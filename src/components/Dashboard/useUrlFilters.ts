import { useEffect } from 'react';
import { useTrackerStore } from '@/store/useTrackerStore';

/** Mirrors view / search / source into the URL so a reload or a shared link keeps them. */
export function useUrlFilters() {
  const view = useTrackerStore((s) => s.view);
  const query = useTrackerStore((s) => s.query);
  const source = useTrackerStore((s) => s.source);

  // On mount: URL -> store.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const v = p.get('view');
    const { setView, setQuery, setSource } = useTrackerStore.getState();
    if (v === 'board' || v === 'list') setView(v);
    setQuery(p.get('q') ?? '');
    setSource(p.get('source') ?? '');
  }, []);

  // Afterwards: store -> URL (replaceState, so history is not filled with keystrokes).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const sync = (key: string, value: string) => (value ? p.set(key, value) : p.delete(key));
    sync('view', view);
    sync('q', query);
    sync('source', source);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [view, query, source]);
}
