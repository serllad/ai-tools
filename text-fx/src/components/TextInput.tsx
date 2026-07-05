interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
}

const MAX_LINES = 5;
const MAX_CHARS = 50;

export function TextInput({ value, onChange }: TextInputProps) {
  const lines = value.split('\n');
  const lineCount = lines.length;
  const charCount = value.replace(/\n/g, '').length;
  const overLines = lineCount > MAX_LINES;
  const overChars = charCount > MAX_CHARS;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">文字内容</label>
      <textarea
        className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="输入文字,支持多行"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span className={overLines ? 'text-red-500' : ''}>
          {lineCount} 行{overLines && ` (最多 ${MAX_LINES} 行)`}
        </span>
        <span className={overChars ? 'text-red-500' : ''}>
          {charCount} 字{overChars && ` (最多 ${MAX_CHARS} 字)`}
        </span>
      </div>
    </div>
  );
}
