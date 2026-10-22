/** 使用者選的外觀；`system` 代表跟隨作業系統的深淺色設定。 */
export type ThemePref = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_PREFS: ThemePref[] = ['system', 'light', 'dark'];

/** 瀏覽器網址列與 PWA 狀態列的顏色，和 globals.css 的 --background 一致。 */
export const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: '#f2f5f4',
  dark: '#0d1413',
};

export const DARK_QUERY = '(prefers-color-scheme: dark)';

/** 實際要套用的深淺色：選「跟隨系統」時依系統設定決定。 */
export function resolveTheme(pref: ThemePref, systemDark: boolean): ResolvedTheme {
  if (pref === 'system') return systemDark ? 'dark' : 'light';
  return pref;
}

/** 把外觀套用到 <html>：CSS 依 data-theme 切換配色，color-scheme 讓原生表單元件跟著變。 */
export function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.content = THEME_COLOR[theme];
  }
}

/**
 * 在 <head> 執行的防閃爍 script：React 還沒載入前就先套用外觀。
 * 直接讀 Zustand persist 存的 JSON（key 見 store/prefsKey.ts，格式是 { state: { theme } }），
 * 讀不到就跟隨系統。
 */
export function themeInitScript(prefsKey: string): string {
  return `(function(){try{var p='system';try{p=JSON.parse(localStorage.getItem(${JSON.stringify(prefsKey)})).state.theme||'system'}catch(e){}var t=p==='system'?(matchMedia(${JSON.stringify(DARK_QUERY)}).matches?'dark':'light'):p;var r=document.documentElement;r.dataset.theme=t;r.style.colorScheme=t}catch(e){}})()`;
}
