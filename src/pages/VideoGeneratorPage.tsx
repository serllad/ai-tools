import { useState, useEffect, useRef, useCallback } from 'react';

const T = {
  title: 'AI \u89c6\u9891\u751f\u6210',
  subtitle: '\u8f93\u5165\u6587\u5b57\u63cf\u8ff0\uff0cAI \u81ea\u52a8\u62c6\u5206\u573a\u666f\u5e76\u751f\u6210\u89c6\u9891\u7247\u6bb5\uff0c\u6700\u540e\u62fc\u63a5\u4e3a\u5b8c\u6574\u89c6\u9891',
  desc: '\u89c6\u9891\u63cf\u8ff0',
  descPH: '\u8f93\u5165\u4f60\u60f3\u8981\u751f\u6210\u7684\u89c6\u9891\u5185\u5bb9\u63cf\u8ff0...',
  dur: '\u603b\u65f6\u957f (\u79d2)',
  res: '\u5206\u8fa8\u7387',
  ratio: '\u753b\u9762\u6bd4\u4f8b',
  land: '16:9 \u6a2a\u5c4f',
  port: '9:16 \u7ad6\u5c4f',
  sq: '1:1 \u65b9\u5f62',
  model: '\u751f\u6210\u6a21\u578b',
  gen: '\u5f00\u59cb\u751f\u6210',
  gening: '\u751f\u6210\u4e2d...',
  stage: '\u6b65\u9aa4',
  seg: '\u7247\u6bb5',
  done: '\u89c6\u9891\u751f\u6210\u5b8c\u6210\uff01',
  good: '\u6210\u529f',
  err: '\u5931\u8d25',
  dl: '\u4e0b\u8f7d\u89c6\u9891',
  sub: '\u4e0b\u8f7d\u5b57\u5e55',
  reset: '\u91cd\u65b0\u751f\u6210',
  fail: '\u89c6\u9891\u52a0\u8f7d\u5931\u8d25',
  history: '\u5df2\u751f\u6210\u7684\u89c6\u9891',
  empty: '\u6682\u65e0\u89c6\u9891',
  size: '\u5927\u5c0f',
  time: '\u65f6\u95f4',
  modelL: '\u6a21\u578b',
  merge: '\u5408\u5e76\u4e2d...',
  downing: '\u4e0b\u8f7d\u4e2d...',
};

const MODELS = [
  { k: 'seedance', l: 'Seedance 2.0 Fast', d: '\u5b57\u8282\u8df3\u52a8 | 4-15s | \u652f\u6301\u97f3\u9891' },
  { k: 'seedance-pro', l: 'Seedance 1.5 Pro', d: '\u5b57\u8282\u8df3\u52a8 | 4-10s' },
  { k: 'wan', l: 'Alibaba Wan 2.7 T2V', d: '\u963f\u91cc\u4e91 | 4-10s' },
  { k: 'pruna-wan', l: 'Pruna Wan T2V', d: 'Pruna | 1-10s | \\$0.05/clip' },
];

interface VidFile { name: string; size: number; modified: number; subtitle: string | null; }

export default function VideoGeneratorPage() {
  const [txt, setTxt] = useState('');
  const [model, setModel] = useState('seedance');
  const [dur, setDur] = useState(60);
  const [res, setRes] = useState('480p');
  const [ratio, setRatio] = useState('16:9');
  const [s, setS] = useState<any>(null);
  const [gen, setGen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [files, setFiles] = useState<VidFile[]>([]);
  const poll = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadFiles = useCallback(async () => {
    try {
      const r = await fetch('/api/video/outputs');
      if (r.ok) setFiles(await r.json());
    } catch {}
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);
  useEffect(() => () => clearInterval(poll.current), []);

  const start = async () => {
    if (!txt.trim()) return;
    setGen(true); setErr(null); setS(null);
    try {
      const r = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: txt.trim(), duration: dur, model, clip_duration: 10, resolution: res, ratio, audio_enabled: true }),
      });
      const d = await r.json();
      if (d.error) { setErr(d.error); setGen(false); return; }
      poll.current = setInterval(async () => {
        try {
          const resp = await fetch('/api/video/status/' + d.task_id);
          const st = await resp.json();
          setS(st);
          if (st.status === 'done' || st.status === 'error') {
            clearInterval(poll.current);
            setGen(false);
            loadFiles();
          }
        } catch { clearInterval(poll.current); setGen(false); }
      }, 1000);
    } catch { setErr('Backend not running?'); setGen(false); }
  };

  const rst = () => { clearInterval(poll.current); setS(null); setGen(false); setErr(null); };

  const vsrc = s?.video_file ? '/api/video/file/' + s.video_file : s?.video_url || null;
  const pct = s?.total > 0 ? Math.round((s.current / s.total) * 100) : 0;

  const fmtSize = (b: number) => b > 1024*1024 ? (b/1024/1024).toFixed(1)+'MB' : (b/1024).toFixed(0)+'KB';
  const fmtTime = (t: number) => { const d = new Date(t*1000); return d.toLocaleString(); };
  const choose = (f: VidFile) => setS({video_file: f.name, status: 'done', subtitle: f.subtitle, clips_ok: 0});

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h2 className="text-lg font-semibold">{T.title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">{T.subtitle}</p>

      {/* Input */}
      <div>
        <label className="text-xs text-gray-500 block mb-1.5 font-medium">{T.desc}</label>
        <textarea value={txt} onChange={e => setTxt(e.target.value)} placeholder={T.descPH}
          className="w-full min-h-[120px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm outline-none focus:border-blue-400 resize-y" disabled={gen} />
      </div>

      {/* Params */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><label className="text-xs text-gray-500 block mb-1">{T.dur}</label>
          <input type="number" value={dur} onChange={e => setDur(Math.max(10,+e.target.value))} min={10} max={600}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm focus:border-blue-400" disabled={gen} /></div>
        <div><label className="text-xs text-gray-500 block mb-1">{T.res}</label>
          <select value={res} onChange={e => setRes(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border rounded-lg p-2 text-sm" disabled={gen}>
            <option value="240p">240p</option><option value="360p">360p</option><option value="480p">480p</option><option value="720p">720p</option></select></div>
        <div><label className="text-xs text-gray-500 block mb-1">{T.ratio}</label>
          <select value={ratio} onChange={e => setRatio(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border rounded-lg p-2 text-sm" disabled={gen}>
            <option value="16:9">{T.land}</option><option value="9:16">{T.port}</option><option value="1:1">{T.sq}</option></select></div>
      </div>

      {/* Models */}
      <div>
        <label className="text-xs text-gray-500 block mb-1.5 font-medium">{T.model}</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {MODELS.map(m => (
            <button key={m.k} onClick={() => setModel(m.k)} disabled={gen}
              className={'text-left p-3 rounded-lg border text-sm '+(model===m.k?'border-blue-500 bg-blue-50 dark:bg-blue-900/30':'border-gray-200 dark:border-gray-700 hover:border-gray-300')}>
              <div className="font-medium">{m.l}</div>
              <div className="text-xs text-gray-400 mt-0.5">{m.d}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <button onClick={start} disabled={gen || !txt.trim()}
        className="w-full px-4 py-2.5 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
        {gen ? T.gening : T.gen}
      </button>

      {/* Progress */}
      {gen && s && (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span className="font-medium text-blue-600 dark:text-blue-400">{s.stage || ''}</span>
            <span>{s.current}/{s.total} {T.seg} ({s.clips_ok||0} OK)</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500" style={{width: pct+'%'}} />
          </div>
          {s.message && <p className="text-xs text-gray-400 truncate">{s.message}</p>}
        </div>
      )}

      {/* Error */}
      {err && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">{err}</div>}

      {/* Result */}
      {s?.status === 'done' && (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-3">
          <h3 className="text-sm font-semibold text-green-600 dark:text-green-400">
            {T.done} ({s.clips_ok||'?'} {T.seg})
          </h3>
          {vsrc && <div className="bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} src={vsrc} controls className="w-full max-h-[60vh] block" onError={() => setErr(T.fail)} />
          </div>}
          <div className="flex flex-wrap gap-2">
            {s.video_file && <a href={'/api/video/file/'+s.video_file} download
              className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600">{T.dl}</a>}
            {s.subtitle && <a href={'/api/video/subtitle/'+s.subtitle} download
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">{T.sub}</a>}
            <button onClick={rst} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">{T.reset}</button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold mb-3">{T.history}</h3>
        {files.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">{T.empty}</p>
        ) : (
          <div className="space-y-1">
            {files.map(f => (
              <div key={f.name}
                onClick={() => choose(f)}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors text-sm"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{f.name}</span>
                  <span className="text-xs text-gray-400">{fmtTime(f.modified)}</span>
                </div>
                <span className="text-xs text-gray-400 ml-2 shrink-0">{fmtSize(f.size)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
