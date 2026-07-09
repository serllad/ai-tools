import { useState, useEffect, useRef } from 'react';

const MODELS_LIST = [
  { key: 'seedance', label: 'Seedance 2.0 Fast', desc: '\u5b57\u8282\u8df3\u52a8 | 4-15s | \u652f\u6301\u97f3\u9891' },
  { key: 'seedance-pro', label: 'Seedance 1.5 Pro', desc: '\u5b57\u8282\u8df3\u52a8 | 4-10s' },
  { key: 'wan', label: 'Alibaba Wan 2.7 T2V', desc: '\u963f\u91cc\u4e91 | 4-10s' },
  { key: 'pruna-wan', label: 'Pruna Wan T2V', desc: 'Pruna | 1-10s | \\$0.05/clip' },
];

const TEXTS = {
  title: 'AI \u89c6\u9891\u751f\u6210',
  subtitle: '\u8f93\u5165\u6587\u5b57\u63cf\u8ff0\uff0cAI \u81ea\u52a8\u62c6\u5206\u573a\u666f\u5e76\u751f\u6210\u89c6\u9891\u7247\u6bb5\uff0c\u6700\u540e\u62fc\u63a5\u4e3a\u5b8c\u6574\u89c6\u9891',
  descLabel: '\u89c6\u9891\u63cf\u8ff0',
  descPlaceholder: '\u8f93\u5165\u4f60\u60f3\u8981\u751f\u6210\u7684\u89c6\u9891\u5185\u5bb9\u63cf\u8ff0...',
  duration: '\u603b\u65f6\u957f (\u79d2)',
  clipDuration: '\u6bcf\u6bb5\u65f6\u957f (\u79d2)',
  resolution: '\u5206\u8fa8\u7387',
  ratio: '\u753b\u9762\u6bd4\u4f8b',
  landscape: '16:9 \u6a2a\u5c4f',
  portrait: '9:16 \u7ad6\u5c4f',
  square: '1:1 \u65b9\u5f62',
  modelLabel: '\u751f\u68A0\u6a21\u578b',
  generateBtn: '\u5f00\u59cb\u751f\u6210',
  generating: '\u751f\u6210\u4e2d...',
  audio: '\u751f\u6210\u97f3\u9891\uff08\u4ec5 Seedance 2.0 \u652f\u6301\uff09',
  segments: '\u7247\u6bb5',
  done: '\u89c6\u9891\u751f\u6210\u5b8c\u6210\uff01',
  download: '\u4e0b\u8f7d\u89c6\u9891',
  reset: '\u91cd\u65b0\u751f\u6210',
  loadFail: '\u89c6\u9891\u52a0\u8f7d\u5931\u8d25',
  backendHint: '\u9996\u6b21\u4f7f\u7528\uff1a\u9700\u8981\u5148\u542f\u52a8 Python \u540e\u7aef\u670d\u52a1\uff1a',
};

export default function VideoGeneratorPage() {
  const [text, setText] = useState('');
  const [model, setModel] = useState('seedance');
  const [duration, setDuration] = useState(60);
  const [status, setStatus] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setGenerating(true); setError(null);
    try {
      const r = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text.trim(), duration, model, clip_duration: 10, resolution: '480p', ratio: '16:9', audio_enabled: true }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); setGenerating(false); return; }
      pollRef.current = setInterval(async () => {
        try {
          const resp = await fetch('/api/video/status/' + d.task_id);
          const s = await resp.json();
          setStatus(s);
          if (s.status === 'done' || s.status === 'error') { clearInterval(pollRef.current); setGenerating(false); }
        } catch { clearInterval(pollRef.current); setGenerating(false); }
      }, 1500);
    } catch { setError('Backend not running?'); setGenerating(false); }
  };

  const reset = () => { clearInterval(pollRef.current); setStatus(null); setGenerating(false); setError(null); };
  const progress = status?.total > 0 ? Math.round((status.current / status.total) * 100) : 0;
  const videoSrc = status?.video_file ? '/api/video/file/' + status.video_file : status?.video_url || null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold mb-1">{TEXTS.title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{TEXTS.subtitle}</p>

      <div className="mb-4">
        <label className="text-xs text-gray-500 block mb-1.5 font-medium">{TEXTS.descLabel}</label>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder={TEXTS.descPlaceholder}
          className="w-full min-h-[120px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm outline-none focus:border-blue-400 resize-y" disabled={generating} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">{TEXTS.duration}</label>
          <input type="number" value={duration} onChange={e => setDuration(Math.max(10, +e.target.value))} min={10} max={600}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm focus:border-blue-400" disabled={generating} />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">{TEXTS.resolution}</label>
          <select value="480p" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm" disabled={generating}>
            <option>240p</option><option>360p</option><option>480p</option><option>720p</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">{TEXTS.ratio}</label>
          <select value="16:9" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm" disabled={generating}>
            <option value="16:9">{TEXTS.landscape}</option>
            <option value="9:16">{TEXTS.portrait}</option>
            <option value="1:1">{TEXTS.square}</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500 block mb-1.5 font-medium">{TEXTS.modelLabel}</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {MODELS_LIST.map(m => (
            <button key={m.key} onClick={() => setModel(m.key)} disabled={generating}
              className={'text-left p-3 rounded-lg border text-sm ' + (model === m.key ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300')}>
              <div className="font-medium">{m.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleGenerate} disabled={generating || !text.trim()}
        className="w-full px-4 py-2.5 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
        {generating ? TEXTS.generating : TEXTS.generateBtn}
      </button>

      {generating && status && (
        <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{status.stage}</span><span>{status.current}/{status.total} {TEXTS.segments}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all" style={{ width: progress + '%' }} />
          </div>
        </div>
      )}

      {error && <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border">{error}</div>}

      {status?.status === 'done' && (
        <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border">
          <h3 className="text-sm font-semibold mb-3 text-green-600">{TEXTS.done}</h3>
          {videoSrc && <div className="bg-black rounded-lg overflow-hidden mb-3">
            <video src={videoSrc} controls className="w-full max-h-[60vh] block" onError={() => setError(TEXTS.loadFail)} />
          </div>}
          <div className="flex gap-2">
            {status.video_file && <a href={'/api/video/file/' + status.video_file} download
              className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium">{TEXTS.download}</a>}
            <button onClick={reset} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100">{TEXTS.reset}</button>
          </div>
        </div>
      )}
    </div>
  );
}
