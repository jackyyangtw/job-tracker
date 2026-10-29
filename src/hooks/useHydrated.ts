import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/**
 * 伺服器端與 hydration 的第一次 render 回傳 false，之後是 true。
 * 用在「畫面取決於只有瀏覽器知道的值」的地方（localStorage 的偏好、網址參數），
 * 避免先畫出預設值、hydration 後又換掉而跳一下。
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
