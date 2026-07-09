#!/usr/bin/env python3
"""AutoVid Video Generator - AI ???? API ??"""
import json, os, re, subprocess, threading, time, uuid
import shutil
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)

BASE_DIR = Path(__file__).parent
INFSH_PATH = shutil.which("infsh") or os.path.expanduser("~/.inferencesh-cli/infsh")
OUTPUT_DIR = BASE_DIR / "outputs"
WORK_DIR = BASE_DIR / "work"
PORT = int(os.environ.get("VIDEO_GEN_PORT", "5001"))

tasks: dict[str, dict] = {}
tasks_lock = threading.Lock()

MODELS = {
    "pruna-wan": {"name": "pruna/wan-t2v", "label": "Pruna Wan T2V ($0.05/clip)", "min_duration": 1, "max_duration": 10},
    "seedance": {"name": "bytedance/seedance-2-0-fast", "label": "Seedance 2.0 Fast", "min_duration": 4, "max_duration": 15},
    "seedance-pro": {"name": "bytedance/seedance-1-5-pro", "label": "Seedance 1.5 Pro", "min_duration": 4, "max_duration": 10},
    "wan": {"name": "alibaba/wan-2-7-t2v", "label": "Alibaba Wan 2.7 T2V", "min_duration": 4, "max_duration": 10},
}

def load_api_key():
    key = os.environ.get("INFSH_API_KEY")
    if key:
        return key
    env_path = BASE_DIR.parent.parent / ".env"
    if env_path.exists():
        for ln in env_path.read_text().strip().splitlines():
            if "=" in ln and not ln.startswith("#"):
                k, v = ln.split("=", 1)
                if k.strip() == "INFSH_API_KEY":
                    return v.strip()
    return ""

API_KEY = load_api_key()
if API_KEY:
    os.environ["INFSH_API_KEY"] = API_KEY

@app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp

@app.route("/api/video/models")
def api_models():
    return jsonify(MODELS)

@app.route("/api/video/generate", methods=["POST"])
def api_generate():
    data = request.get_json()
    if not data or not data.get("description", "").strip():
        return jsonify({"error": "description is required"}), 400
    task_id = uuid.uuid4().hex
    task = {"id": task_id, "status": "queued", "stage": "Queued", "message": "Starting...", "current": 0, "total": 0, "clips_ok": 0, "segments": [], "video_file": None, "video_url": None, "clip_urls": None}
    with tasks_lock:
        tasks[task_id] = task
    thread = threading.Thread(target=generate_video, args=(task_id, data["description"], int(data.get("duration", 60)), data.get("model", "pruna-wan"), int(data.get("clip_duration", 10)), data.get("resolution", "480p"), data.get("ratio", "16:9"), data.get("audio_enabled", True)), daemon=True)
    thread.start()
    return jsonify({"task_id": task_id})

@app.route("/api/video/status/<task_id>")
def api_status(task_id):
    with tasks_lock:
        task = tasks.get(task_id)
    if not task:
        return jsonify({"error": "task not found"}), 404
    return jsonify(task)

@app.route("/api/video/file/<filename>")
def api_video(filename):
    return send_from_directory(OUTPUT_DIR, filename)

@app.route("/api/video/subtitle/<filename>")
def api_subtitle(filename):
    return send_from_directory(OUTPUT_DIR, filename)
@app.route("/api/video/outputs")
def api_outputs():
    files = []
    for f in sorted(OUTPUT_DIR.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if f.suffix in (".mp4", ".webm", ".mov"):
            sub = f.with_suffix(".vtt")
            files.append({
                "name": f.name,
                "size": f.stat().st_size,
                "modified": f.stat().st_mtime,
                "subtitle": sub.name if sub.exists() else None,
            })
    return jsonify(files[:30])

@app.route("/api/video/cancel/<task_id>", methods=["POST"])
def api_cancel(task_id):
    with tasks_lock:
        task = tasks.get(task_id)
        if not task:
            return jsonify({"error": "task not found"}), 404
        if task["status"] in ("done", "error"):
            return jsonify({"error": "task already finished"}), 400
        task["status"] = "error"
        task["message"] = "Cancelled by user"
    return jsonify({"ok": True})

def run_infsh(args, input_data=None):
    cmd = [INFSH_PATH] + args
    if input_data:
        cmd += ["--input", json.dumps(input_data, ensure_ascii=False)]
    env = os.environ.copy()
    ep = BASE_DIR.parent.parent / ".env"
    if ep.exists():
        for ln in open(ep):
            if "=" in ln and not ln.startswith("#"):
                k, v = ln.strip().split("=", 1)
                if k.strip() == "INFSH_API_KEY":
                    env["INFSH_API_KEY"] = v.strip()
                    break
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300, stdin=subprocess.DEVNULL, env=env)
    except subprocess.TimeoutExpired:
        return {"error": "CLI timed out"}
    except FileNotFoundError:
        return {"error": "CLI not found: " + INFSH_PATH}
    except Exception as e:
        return {"error": "Subprocess: " + str(e)[:100]}
    output = (result.stdout or "") + (result.stderr or "")
    if not output.strip():
        return {"error": "CLI returned no output"}
    parsed = parse_cli_output(output)
    if parsed:
        return parsed
    return {"error": "Parse failed: " + output.strip()[:200]}

def parse_cli_output(text):
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    m = re.search(r'"video":\s*"([^"]+)"', text)
    if m:
        return {"video": m.group(1)}
    m = re.search(r'"result":\s*"([^"]+)"', text)
    if m:
        return {"result": m.group(1)}
    return None

def download_file(url, dest_path):
    key = API_KEY or os.environ.get("INFSH_API_KEY", "")
    try:
        subprocess.run(["curl", "-s", "-H", f"Authorization: Bearer {key}", "-o", str(dest_path), url], timeout=120, capture_output=True)
        return dest_path.exists() and dest_path.stat().st_size > 0
    except Exception:
        return False

def generate_video(task_id, description, duration, model_key, clip_duration, resolution, ratio, audio_enabled):
    task = tasks[task_id]
    model_name = MODELS[model_key]["name"]
    try:
        task["status"] = "running"
        num_segments = max(1, duration // clip_duration)
        task["total"] = num_segments
        segments = split_scenes(description, num_segments)
        task["segments"] = segments
        video_urls = []
        for i, prompt in enumerate(segments):
            # Check for cancellation
            if task.get("status") == "error":
                task["message"] = "Cancelled"
                return
            task["current"] = i + 1
            task["stage"] = f"Generating clip {i+1}/{len(segments)}"
            task["message"] = prompt[:60]
            inp = {"prompt": prompt, "duration": clip_duration, "resolution": resolution}
            if "seedance" in model_name:
                inp["ratio"] = ratio
                if "2-0" in model_name:
                    inp["generate_audio"] = audio_enabled
            result = run_infsh(["app", "run", model_name], input_data=inp)
            if result and "video" in result:
                video_urls.append(result["video"])
                task["clips_ok"] = task.get("clips_ok", 0) + 1
            time.sleep(1)
        if not video_urls:
            task["status"] = "error"
            task["message"] = "All clips failed to generate"
            return
        task["stage"] = "Merging clips..."
        task["message"] = f"Concatenating {len(video_urls)} clips"
        merged_url = merge_clips(video_urls)
        if not merged_url:
            task["status"] = "error"
            task["message"] = "Video merge failed, clips available individually"
            task["clip_urls"] = video_urls
            return
        task["stage"] = "Downloading result..."
        output_filename = f"autovid_{task_id[:8]}.mp4"
        output_path = OUTPUT_DIR / output_filename
        if download_file(merged_url, output_path):
            task["video_file"] = output_filename
            task["status"] = "done"
            task["message"] = "Complete!"
        else:
            task["video_url"] = merged_url
            task["status"] = "done"
            task["message"] = "Generated (download URL below)"
    except Exception as e:
        task["status"] = "error"
        task["message"] = str(e)

def merge_clips(urls):
    if len(urls) <= 1:
        return urls[0] if urls else None
    result = run_infsh(["app", "run", "infsh/media-merger"], input_data={"media_files": [{"file": u} for u in urls], "fps": 24})
    if result and "result" in result:
        return result["result"]
    return None

def split_scenes(desc, n):
    if n <= 1:
        return [desc]
    sentences = re.split(r"(?<=[???.!??;])", desc)
    sentences = [s.strip() for s in sentences if s.strip()]
    if len(sentences) >= n:
        prompts = []
        sz = len(sentences) / n
        for i in range(n):
            s = int(i * sz)
            e = int((i + 1) * sz)
            prompts.append(f"Scene {i+1}/{n}: {' '.join(sentences[s:e])}")
        return prompts
    else:
        sz = max(1, len(desc) // n)
        prompts = []
        for i in range(n):
            s = i * sz
            e = (i + 1) * sz if i < n - 1 else len(desc)
            chunk = desc[s:e].strip()
            if chunk:
                prompts.append(f"Scene {i+1}/{n}: {chunk}")
        return prompts if prompts else [desc]

if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Video Generator API running on http://127.0.0.1:{PORT}")
    app.run(host="127.0.0.1", port=PORT, debug=False, use_reloader=False)
