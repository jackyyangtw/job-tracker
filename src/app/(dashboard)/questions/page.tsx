import type { Metadata } from 'next';
import QuestionsPage from '@/components/QuestionsPage';

export const metadata: Metadata = { title: '面試題｜投遞追蹤看板' };

export default function Page() {
  return <QuestionsPage />;
}
