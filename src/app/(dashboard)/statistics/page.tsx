import type { Metadata } from 'next';
import StatisticsPage from '@/components/StatisticsPage';

export const metadata: Metadata = { title: '統計｜投遞追蹤看板' };

export default function Page() {
  return <StatisticsPage />;
}
