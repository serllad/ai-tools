import { useState } from 'react';
import { useAutoCompare } from './hooks/useAutoCompare';
import { useKeyboard } from './hooks/useKeyboard';
import { useTheme } from './hooks/useTheme';
import { useFileDrop } from './hooks/useFileDrop';
import { Toolbar } from './components/Toolbar';
import { DiffView } from './components/DiffView';
import { StatusBar } from './components/StatusBar';
import { ErrorBanner } from './components/ErrorBanner';
import { SettingsDrawer } from './components/SettingsDrawer';

export default function App() {
  useAutoCompare();
  useKeyboard();
  useTheme();
  const { onDrop } = useFileDrop();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fileInputSide, setFileInputSide] = useState<'left' | 'right'>('left');

  function handleUploadClick(side: 'left' | 'right') {
    setFileInputSide(side);
    document.getElementById('file-input')?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) await onDrop(f, fileInputSide);
    e.target.value = '';
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      <ErrorBanner />
      <Toolbar onUploadClick={handleUploadClick} onToggleSettings={() => setSettingsOpen(o => !o)} />
      <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
        <DiffView />
      </div>
      <StatusBar />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <input id="file-input" type="file" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
