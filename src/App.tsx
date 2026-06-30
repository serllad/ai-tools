import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import JsonFormatterPage from './pages/JsonFormatterPage';
import WatermarkRemoverPage from './pages/WatermarkRemoverPage';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      return (localStorage.getItem('ai-tools:theme') as 'light' | 'dark' | 'system') || 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    function apply(t: 'light' | 'dark' | 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = t === 'dark' || (t === 'system' && prefersDark);
      root.classList.toggle('dark', isDark);
    }
    apply(theme);
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const setThemePersist = (t: 'light' | 'dark' | 'system') => {
    try { localStorage.setItem('ai-tools:theme', t); } catch { /* ignore */ }
    setTheme(t);
  };

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setThemePersist(next);
  };

  const isHome = location.pathname === '/' || location.hash === '#/';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-2">
          {!isHome && (
            <button
              onClick={() => navigate('/')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← 返回首页
            </button>
          )}
          <h1 className="text-sm font-semibold">
            {isHome ? 'AI 工具集' : ''}
          </h1>
        </div>
        <button
          onClick={cycleTheme}
          className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          title="切换主题"
        >
          {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/json-formatter" element={<JsonFormatterPage />} />
          <Route path="/watermark-remover" element={<WatermarkRemoverPage />} />
        </Routes>
      </main>
    </div>
  );
}
