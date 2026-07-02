# AI Tools

Privacy-first, client-side only online tool collection. All processing happens in your browser — no data leaves your device.

## Tools

### [Text Diff](./text-diff)
A visual text comparison tool with side-by-side and inline views. Features:
- Line-level and character-level diff highlighting
- Split and unified view modes
- Syntax highlighting via CodeMirror 6
- Dark mode support
- File drag & drop upload
- Keyboard shortcuts and diff navigation

### [JSON Formatter](./json-formatter)
A lightweight JSON formatting and validation tool. Features:
- Format, compress, and validate JSON
- Unescape strings and decode Unicode/URL-encoded values
- Syntax highlighting with error indicators
- Local history (last 50 entries)
- Dark mode support
- Paste from clipboard or upload file

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **State:** Zustand
- **Editor:** CodeMirror 6
- **Style:** Tailwind CSS
- **Diff Engine:** `diff` npm package (Myers algorithm)

## Development

```bash
# text-diff
cd text-diff
npm install
npm run dev

# json-formatter
cd json-formatter
npm install
npm run dev
```

## Build

```bash
cd text-diff && npm run build
cd ../json-formatter && npm run build
```

## License

MIT
