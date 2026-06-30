import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { json } from '@codemirror/lang-json';
import { syntaxHighlighting, defaultHighlightStyle, foldGutter, indentUnit } from '@codemirror/language';

interface Props {
  value: string;
}

export function Output({ value }: Props) {
  const parent = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!parent.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        foldGutter(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        indentUnit.of('  '),
        json(),
        EditorView.editable.of(false),
        EditorView.lineWrapping
      ]
    });
    view.current = new EditorView({ state, parent: parent.current });
    return () => {
      view.current?.destroy();
      view.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!view.current) return;
    const current = view.current.state.doc.toString();
    if (current !== value) {
      view.current.dispatch({
        changes: { from: 0, to: current.length, insert: value }
      });
    }
  }, [value]);

  return <div ref={parent} className="h-full overflow-auto" />;
}
