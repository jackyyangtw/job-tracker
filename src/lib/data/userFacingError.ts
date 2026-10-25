/** 訊息可以直接顯示給使用者看的錯誤。 */
export class UserFacingError extends Error {}

export const isOffline = () => typeof navigator !== 'undefined' && !navigator.onLine;

export const messageFor = (e: unknown, fallback: string) => (e instanceof UserFacingError ? e.message : fallback);
