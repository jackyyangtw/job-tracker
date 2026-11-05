import type { Metadata } from 'next';
import ResumesPage from '@/components/ResumesPage';

export const metadata: Metadata = { title: '履歷版本（試用）｜投遞追蹤看板' };

export default function Page() {
  return <ResumesPage />;
}
