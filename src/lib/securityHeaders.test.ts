import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, securityHeaders } from './securityHeaders';

const SUPABASE = 'https://abc.supabase.co';
const directive = (csp: string, name: string) => csp.split('; ').find((d) => d.startsWith(`${name} `));

describe('contentSecurityPolicy', () => {
  it('只允許連線到自己與 Supabase（含 Realtime 的 wss）', () => {
    const csp = contentSecurityPolicy({ supabaseUrl: SUPABASE, dev: false });
    expect(directive(csp, 'connect-src')).toBe("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co");
  });

  it('禁止被嵌入 iframe、外掛物件與改寫 <base>', () => {
    const csp = contentSecurityPolicy({ supabaseUrl: SUPABASE, dev: false });
    expect(directive(csp, 'frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directive(csp, 'object-src')).toBe("object-src 'none'");
    expect(directive(csp, 'base-uri')).toBe("base-uri 'self'");
  });

  it('正式環境不允許 eval，並升級成 https', () => {
    const csp = contentSecurityPolicy({ supabaseUrl: SUPABASE, dev: false });
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('開發模式允許 eval 與 HMR 的 ws://，但不升級 https', () => {
    const csp = contentSecurityPolicy({ supabaseUrl: SUPABASE, dev: true });
    expect(directive(csp, 'script-src')).toContain("'unsafe-eval'");
    expect(directive(csp, 'connect-src')).toContain('ws:');
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('Supabase 網址缺少或格式錯誤時只允許同網域', () => {
    expect(directive(contentSecurityPolicy({ dev: false }), 'connect-src')).toBe("connect-src 'self'");
    expect(directive(contentSecurityPolicy({ supabaseUrl: 'not a url', dev: false }), 'connect-src')).toBe("connect-src 'self'");
  });
});

describe('securityHeaders', () => {
  it('包含 CSP 與常見的安全標頭', () => {
    const keys = securityHeaders({ supabaseUrl: SUPABASE, dev: false }).map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining(['Content-Security-Policy', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Strict-Transport-Security']),
    );
  });

  it('開發模式不送 HSTS', () => {
    const keys = securityHeaders({ supabaseUrl: SUPABASE, dev: true }).map((h) => h.key);
    expect(keys).not.toContain('Strict-Transport-Security');
  });
});
