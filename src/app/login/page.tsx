import type { Metadata } from 'next';
import LoginScreen from '@/components/LoginScreen';

export const metadata: Metadata = { title: '登入｜投遞追蹤看板' };

// Thin shell like the home page: the session check happens in the browser so the HTML stays cacheable.
export default function LoginPage() {
  return <LoginScreen />;
}
