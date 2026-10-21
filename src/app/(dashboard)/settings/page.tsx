import type { Metadata } from 'next';
import SettingsPage from '@/components/SettingsPage';

export const metadata: Metadata = { title: '設定｜投遞追蹤看板' };

export default function Page() {
  return <SettingsPage />;
}
