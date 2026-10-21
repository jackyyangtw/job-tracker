import { useState, useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};
const readDebug = () => new URLSearchParams(window.location.search).get('debug') === '1';

/** 暫時的除錯紀錄：網址加上 ?debug=1 時，在職缺連結欄位下方顯示貼上與輸入事件，方便在手機上排查。 */
export function useDebugLog() {
  const enabled = useSyncExternalStore(noopSubscribe, readDebug, () => false);
  const [lines, setLines] = useState<string[]>([]);

  function log(line: string) {
    if (enabled) setLines((prev) => [...prev.slice(-7), line]);
  }

  return { enabled, lines, log };
}
