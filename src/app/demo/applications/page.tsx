import type { Metadata } from 'next';
import ApplicationsPage from '@/components/ApplicationsPage';

export const metadata: Metadata = { title: '投遞（試用）｜投遞追蹤看板' };

export default function Page() {
  return <ApplicationsPage />;
}
