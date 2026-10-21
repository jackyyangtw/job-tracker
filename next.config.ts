import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // React Compiler 在 Next.js 16 已是穩定版，需要 babel-plugin-react-compiler。
  // 它會自動做 memoize，所以不用為了效能手寫 useMemo／useCallback。
  reactCompiler: true,
  async headers() {
    return [
      {
        // Service Worker 絕對不能從過期的 HTTP 快取提供，
        // 否則更新可能要一天以上才會到使用者手上。
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
