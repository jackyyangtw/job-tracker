/**
 * 偏好設定在 localStorage 的 key。獨立成檔案，讓 Server Component（layout 的防閃爍 script）
 * 不需要匯入 Zustand store；script 會直接讀這個 key 底下的 state.theme。
 */
export const PREFS_KEY = 'jobtracker.prefs';
