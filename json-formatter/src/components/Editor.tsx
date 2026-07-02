import { useEffect, useRef } from 'react';
import { EditorState, StateEffect, StateField, RangeSet } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLine, keymap, Decoration, DecorationSet } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import type { ParseError } from '../types';

interface Props {
  value: string;
  onChange: (v: string) => void;
  error: ParseError | null;
}

const setErrorMark = StateEffect.define<{ from: number; to: number } | null>();

const errorMarkField = StateField.define<DecorationSet>({
  create() { return RangeSet.empty; },
  update(value, tr) {
    value = value.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setErrorMark)) {
        if (e.value === null) return RangeSet.empty;
        const mark = Decoration.mark({
          class: 'cm-error-underline',
          attributes: { 'aria-label': 'JSON 语法错误' }
        });
        return RangeSet.of([mark.range(e.value.from, e.value.to)]);
      }
    }
    return value;
  },
  provide: f => EditorView.decorations.from(f)
});

export function Editor({ value, onChange, error }: Props) {
  const parent = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!parent.current) return;
    const updateListener = EditorView.updateListener.of(v => {
      if (v.docChanged) onChange(v.state.doc.toString());
    });
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        highlightActiveLine(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        json(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        updateListener,
        errorMarkField,
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

  useEffect(() => {
    if (!view.current) return;
    if (!error) {
      view.current.dispatch({ effects: setErrorMark.of(null) });
      return;
    }
    const doc = view.current.state.doc;
    const lineNum = Math.min(error.line, doc.lines);
    const line = doc.line(lineNum);
    const from = line.from;
    const to = line.to;
    view.current.dispatch({ effects: setErrorMark.of({ from, to }) });
  }, [error]);

  return <div ref={parent} className="h-full overflow-auto" />;
}
