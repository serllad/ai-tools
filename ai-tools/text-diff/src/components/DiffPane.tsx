import { useRef, useEffect, useMemo } from 'react';
import { EditorState, StateEffect, StateField, Annotation, type Extension, type Range } from '@codemirror/state';
import { EditorView, Decoration, lineNumbers, keymap, type DecorationSet } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import type { DiffLine, Side } from '../types';
import { getLanguageExtension } from '../lib/languageDetect';

interface Props {
  side: Side;
  /** 用户实际输入，作为编辑器 doc（行数与之一致） */
  value: string;
  onChange: (v: string) => void;
  /** 行级 diff 结果，用于装饰 */
  lines: DiffLine[];
  languageOverride: string | null;
  activeLineIndex: number | null;
  onScrollerReady?: (el: HTMLElement | null) => void;
}

const setDecorations = StateEffect.define<DecorationSet>();
// 标注外部 value 同步触发的 dispatch，避免与用户输入循环
const externalUpdate = Annotation.define<boolean>();

export function DiffPane({ side, value, onChange, lines, languageOverride, activeLineIndex, onScrollerReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 仅取本侧应展示的行（不做空行占位），并按本侧行号顺序排列
  // left 侧：equal + removed；right 侧：equal + added
  const lineMeta = useMemo(() => {
    const meta: { type: DiffLine['type']; charParts?: DiffLine['charParts']; originalIndex: number }[] = [];
    lines.forEach((l, idx) => {
      const shown = side === 'left' ? l.type !== 'added' : l.type !== 'removed';
      if (shown) meta.push({ type: l.type, charParts: l.charParts, originalIndex: idx });
    });
    return meta;
  }, [side, lines]);

  const decorationsField = useMemo<Extension>(() => {
    return StateField.define<DecorationSet>({
      create: () => Decoration.none,
      update(value, tr) {
        for (const e of tr.effects) {
          if (e.is(setDecorations)) return e.value;
        }
        return value;
      },
      provide: f => EditorView.decorations.from(f)
    });
  }, []);

  // 创建编辑器（仅在挂载时一次）
  useEffect(() => {
    if (!hostRef.current) return;
    const langExt = getLanguageExtension(languageOverride, value);
    const updateListener = EditorView.updateListener.of(v => {
      if (v.docChanged && !v.transactions.some(t => t.annotation(externalUpdate) === true)) {
        const next = v.state.doc.toString();
        lastEmittedRef.current = next;
        onChangeRef.current(next);
      }
    });
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          lineNumbers(),
          EditorView.lineWrapping,
          decorationsField,
          langExt,
          updateListener,
          EditorView.theme({
            '&': { height: '100%', fontSize: '13px' },
            '.cm-scroller': { overflow: 'auto' },
            '.cm-gutters': { minHeight: '100%' },
            '.cm-diff-added': { backgroundColor: 'rgba(34,197,94,0.15)' },
            '.cm-diff-removed': { backgroundColor: 'rgba(239,68,68,0.15)' },
            '.cm-diff-char-add': { backgroundColor: 'rgba(34,197,94,0.45)', borderRadius: '2px' },
            '.cm-diff-char-rem': { backgroundColor: 'rgba(239,68,68,0.45)', borderRadius: '2px' },
            '.cm-diff-active': { boxShadow: 'inset 0 0 0 2px #f59e0b' }
          })
        ]
      }),
      parent: hostRef.current
    });
    viewRef.current = view;
    const scroller = hostRef.current.querySelector('.cm-scroller') as HTMLElement | null;
    onScrollerReady?.(scroller);
    return () => { view.destroy(); viewRef.current = null; onScrollerReady?.(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 外部 value 变化（swap/上传/clear，且非本编辑器用户输入）时同步 doc
  // 用 ref 记录最近一次由用户输入发出的值，避免与用户输入循环
  const lastEmittedRef = useRef<string>(value);
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    // 如果这个 value 是本编辑器刚发出去的，doc 已经一致，跳过
    if (value === lastEmittedRef.current) {
      // 仍需确认 doc 与 value 一致（防止外部 annotation 同步后 doc 已变）
      const current = view.state.doc.toString();
      if (current === value) return;
    }
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
        annotations: externalUpdate.of(true)
      });
    }
  }, [value]);

  // 更新装饰：lineMeta 顺序与本侧 doc 行一一对应（1-based）
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const decos: Range<Decoration>[] = [];
    lineMeta.forEach((m, lineIdx) => {
      if (lineIdx >= view.state.doc.lines) return;
      const line = view.state.doc.line(lineIdx + 1);
      if (m.type === 'added') decos.push(Decoration.line({ class: 'cm-diff-added' }).range(line.from));
      if (m.type === 'removed') decos.push(Decoration.line({ class: 'cm-diff-removed' }).range(line.from));
      if (m.charParts && (m.type === 'added' || m.type === 'removed')) {
        let pos = line.from;
        for (const p of m.charParts) {
          const cls = p.type === 'added' ? 'cm-diff-char-add' : p.type === 'removed' ? 'cm-diff-char-rem' : null;
          if (cls && p.value.length > 0) {
            decos.push(Decoration.mark({ class: cls }).range(pos, pos + p.value.length));
          }
          pos += p.value.length;
        }
      }
    });
    // activeLineIndex 是 lines 数组（含两侧）的下标，
    // 需映射为本侧编辑器行号（lineMeta 下标，与本侧 doc 行 1:1 对应）
    const activeSideIdx = activeLineIndex !== null
      ? lineMeta.findIndex(m => m.originalIndex === activeLineIndex)
      : -1;
    if (activeSideIdx >= 0 && activeSideIdx < view.state.doc.lines) {
      const line = view.state.doc.line(activeSideIdx + 1);
      decos.push(Decoration.line({ class: 'cm-diff-active' }).range(line.from));
    }
    const all = Decoration.set(decos, true);
    view.dispatch({ effects: setDecorations.of(all) });

    // 跳转到当前激活的差异行（导航箭头触发）
    if (activeSideIdx >= 0 && activeSideIdx < view.state.doc.lines) {
      const line = view.state.doc.line(activeSideIdx + 1);
      view.dispatch({ effects: EditorView.scrollIntoView(line.from, { y: 'center' }) });
    }
  }, [lineMeta, activeLineIndex]);

  return <div ref={hostRef} className="h-full w-full overflow-hidden" data-testid={`diffpane-${side}`} />;
}
