/** 轉換漏斗：已投遞 → 面試 → Offer。 */
import type { Application } from '../types';
import { reachedInterview } from './application';

export interface FunnelStep {
  label: string;
  n: number;
  /** 占已投遞的百分比；還沒有投遞時是 null。 */
  ofSent: number | null;
  /** 從上一階段轉換過來的百分比；第一階段或上一階段為 0 時是 null。 */
  ofPrev: number | null;
}

const pctOf = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : null);

/** 已投遞 → 面試 → Offer 的轉換漏斗。 */
export function funnel(list: Application[]): FunnelStep[] {
  const sent = list.filter((a) => a.status !== 'wishlist');
  const interviewed = sent.filter(reachedInterview).length;
  const offer = sent.filter((a) => a.status === 'offer').length;
  return [
    { label: '已投遞', n: sent.length, ofSent: pctOf(sent.length, sent.length), ofPrev: null },
    { label: '面試', n: interviewed, ofSent: pctOf(interviewed, sent.length), ofPrev: pctOf(interviewed, sent.length) },
    { label: 'Offer', n: offer, ofSent: pctOf(offer, sent.length), ofPrev: pctOf(offer, interviewed) },
  ];
}
