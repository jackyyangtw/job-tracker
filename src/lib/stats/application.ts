/** 統計共用的單筆投遞判斷。 */
import type { Application, Status } from '../types';

/** 目前狀態就代表一定面試過的狀態。 */
const INTERVIEWED: Status[] = ['interview', 'awaiting', 'offer'];

/**
 * 是否進過面試。資料只存目前狀態，面試後被拒（未錄取）或撤回的投遞看不出來，
 * 所以「有填面試時間」也算進過面試。
 */
export function reachedInterview(a: Application): boolean {
  if (a.status === 'wishlist') return false;
  return INTERVIEWED.includes(a.status) || Boolean(a.interviewAt);
}
