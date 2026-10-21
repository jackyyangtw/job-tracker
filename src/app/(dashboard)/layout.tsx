import AppShell from '@/components/AppShell';

// 投遞、統計、設定三個頁面共用的外殼。頁面本身仍是薄殼，登入與資料都在瀏覽器端載入，
// HTML 才能被 Service Worker 快取，離線時也能開啟。
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
