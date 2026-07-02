export function useScrollSync() {
  function attach(a: HTMLElement, b: HTMLElement): () => void {
    let syncing = false;
    function sync(from: HTMLElement, to: HTMLElement) {
      if (syncing) return;
      syncing = true;
      const fromMax = from.scrollHeight - from.clientHeight;
      const toMax = to.scrollHeight - to.clientHeight;
      if (fromMax <= 0) { syncing = false; return; }
      const ratio = from.scrollTop / fromMax;
      to.scrollTop = ratio * toMax;
      syncing = false;
    }
    const onA = () => sync(a, b);
    const onB = () => sync(b, a);
    a.addEventListener('scroll', onA);
    b.addEventListener('scroll', onB);
    return () => {
      a.removeEventListener('scroll', onA);
      b.removeEventListener('scroll', onB);
    };
  }
  return { attach };
}
