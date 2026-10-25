import { describe, expect, it } from 'vitest';
import { resolveTheme, themeInitScript } from './theme';

describe('外觀設定', () => {
  it('跟隨系統時依系統的深淺色決定', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('手動選擇時不受系統設定影響', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('防閃爍 script 讀取指定的偏好設定 key，且是合法的 JavaScript', () => {
    const script = themeInitScript('jobtracker.prefs');
    expect(script).toContain('"jobtracker.prefs"');
    expect(() => new Function(script)).not.toThrow();
  });
});
