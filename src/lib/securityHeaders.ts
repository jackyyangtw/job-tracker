/**
 * 全站共用的安全標頭（由 next.config.ts 的 headers() 套用）。
 *
 * script-src 保留 'unsafe-inline'：Next.js 會插入 inline script 傳遞 RSC 資料，`app/layout.tsx` 也有防閃爍 script，
 * 改用 nonce 必須讓每個頁面都動態渲染，Service Worker 快取的靜態外殼就不能用了。
 * 這份 CSP 主要的作用是限制資料只能送往自己與 Supabase（connect-src），並禁止被嵌入 iframe、外掛物件與改寫 <base>。
 */
export function contentSecurityPolicy({ supabaseUrl, dev }: { supabaseUrl?: string; dev: boolean }): string {
  const connect = ["'self'"];
  if (supabaseUrl) {
    try {
      const { origin, host } = new URL(supabaseUrl);
      // Realtime 走 WebSocket，要另外列出 wss://。
      connect.push(origin, `wss://${host}`);
    } catch {
      // 環境變數格式不對時只允許同網域；Supabase 請求會失敗，比默默放寬政策好。
    }
  }
  // 開發模式：React 需要 eval 重建錯誤堆疊，HMR 走 ws://。
  if (dev) connect.push('ws:');

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': connect,
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };
  const policy = Object.entries(directives).map(([k, v]) => `${k} ${v.join(' ')}`);
  // 本機是 http，加了會把 localhost 的請求升級成 https 而失敗。
  if (!dev) policy.push('upgrade-insecure-requests');
  return policy.join('; ');
}

export function securityHeaders(opts: { supabaseUrl?: string; dev: boolean }): { key: string; value: string }[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(opts) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    ...(opts.dev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
  ];
}
