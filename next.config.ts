import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // React Compiler is stable in Next.js 16 and requires babel-plugin-react-compiler.
  // It memoizes components automatically, so we don't hand-write useMemo/useCallback for performance.
  reactCompiler: true,
  async headers() {
    return [
      {
        // The service worker must never be served from a stale HTTP cache,
        // otherwise updates to it can take a day or more to reach users.
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
