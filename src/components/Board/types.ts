import type { Status } from '@/lib/types';

/** 看板、卡片與列表共用的屬性。 */
export interface Common {
  staleDays: number;
  onEdit: (id: string) => void;
  onStatus: (id: string, status: Status) => void;
}
