import type { Metadata } from 'next';
import LoginScreen from '@/components/LoginScreen';

export const metadata: Metadata = { title: '登入｜投遞追蹤看板' };

// 和首頁一樣是薄殼：登入狀態在瀏覽器端檢查，HTML 才能被快取。
export default function LoginPage() {
  return <LoginScreen />;
}
