import type { Stats, CompressInfo, JsonStatus, ParseError } from '../types';
import { formatBytes } from '../lib/stats';

interface Props {
  stats: Stats;
  compressInfo: CompressInfo | null;
  status: JsonStatus;
  error: ParseError | null;
}

export function StatusBar({ stats, compressInfo, status, error }: Props) {
  const ratioPct = compressInfo ? Math.round((1 - compressInfo.ratio) * 100) : null;
  return (
    <div className="flex items-center justify-between px-4 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
      <div className="flex gap-4">
        <span>字符: {stats.chars}</span>
        <span>行: {stats.lines}</span>
        <span>大小: {formatBytes(stats.sizeBytes)}</span>
        {ratioPct !== null && (
          <span>压缩率 {ratioPct}% ↓ {formatBytes(compressInfo!.savedBytes)}</span>
        )}
      </div>
      <div>
        {status === 'idle' && <span>等待输入…</span>}
        {status === 'valid' && <span className="text-green-600 dark:text-green-400">✓ JSON有效</span>}
        {status === 'invalid' && error && (
          <span className="text-red-600 dark:text-red-400">第{error.line}行，第{error.col}列：{error.message}</span>
        )}
        {status === 'processing' && <span>处理中…</span>}
      </div>
    </div>
  );
}
