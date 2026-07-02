import { useDiffStore } from '../store/useDiffStore';
import { formatStats, isIdentical } from '../lib/stats';

export function StatusBar() {
  const result = useDiffStore(s => s.result);
  const status = useDiffStore(s => s.status);
  const left = useDiffStore(s => s.left);
  const right = useDiffStore(s => s.right);

  let text = '输入两侧文本开始对比';
  if (left && right && !result && status !== 'comparing') text = '点击对比按钮';
  else if (status === 'comparing') text = '正在对比…';
  else if (result) text = isIdentical(result) ? '✓ 内容完全相同' : formatStats(result);

  const identical = result ? isIdentical(result) : false;
  return (
    <div className={`px-4 py-2 text-sm border-t border-gray-200 dark:border-gray-700 flex justify-between ${identical ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
      <span>{text}</span>
      {result && !isIdentical(result) && <span>✓ 对比完成</span>}
    </div>
  );
}
