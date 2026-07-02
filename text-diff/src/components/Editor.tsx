import { useRef, useEffect } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import type { Side } from '../types';

interface Props {
  side: Side;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function Editor({ side, value, onChange, placeholder }: Props) {
  // placeholder is reserved for future use (e.g., CodeMirror placeholder extension)
  void placeholder;
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current) return;
    const updateListener = EditorView.updateListener.of(v => {
      if (v.docChanged) onChangeRef.current(v.state.doc.toString());
    });
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          lineNumbers(),
          EditorView.lineWrapping,
          updateListener,
          EditorView.theme({
            '&': { height: '100%', fontSize: '13px' },
            '.cm-scroller': { overflow: 'auto' }
          })
        ]
      }),
      parent: hostRef.current
    });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      // 用 annotation 标记外部更新，避免与用户输入循环；保留历史以便 undo
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
        selection: { anchor: Math.min(value.length, view.state.selection.main.anchor) }
      });
    }
  }, [value]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        {side === 'left' ? '原始文本' : '修改后文本'}
      </div>
      <div ref={hostRef} className="flex-1 overflow-hidden bg-white dark:bg-gray-900" data-testid={`editor-${side}`} />
      <div className="px-3 py-1 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700">
        字符: {value.length} 行: {value ? value.split('\n').length : 0}
      </div>
    </div>
  );
}
