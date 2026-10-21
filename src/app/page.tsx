import TrackerApp from '@/components/TrackerApp';

// 這個頁面刻意做成薄殼：登入與資料都在瀏覽器端載入，HTML 才能被 Service Worker 快取，
// 離線時 App 仍能開啟（顯示 IndexedDB 裡最後一次同步的資料）。
// 資料存取的保護靠 Supabase 的 Row Level Security，不是靠這個頁面。
export default function Home() {
  return <TrackerApp />;
}
