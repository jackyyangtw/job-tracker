import type { Status } from '@/lib/types';

/** 看板、卡片與列表共用的屬性。 */
export interface Common {
  staleDays: number;
  onEdit: (id: string) => void;
  onStatus: (id: string, status: Status) => void;
}

/** 看板拖曳時放在 dataTransfer 的資料類型，值為投遞的 id。 */
export const DRAG_TYPE = 'application/x-job-tracker-app';
