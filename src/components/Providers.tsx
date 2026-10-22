'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ThemeSync from '@/components/ThemeSync';

export default function Providers({ children }: { children: React.ReactNode }) {
  // 每個瀏覽器分頁只建立一次；用 useState 讓它在重新渲染之間保持穩定。
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: true, refetchOnReconnect: true },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ThemeSync />
      {children}
      {/* 正式環境的建置不會渲染任何東西。 */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
