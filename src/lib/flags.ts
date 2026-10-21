import type { Application } from './types';
import { daysBetween, todayStr } from './dates';

export interface Flag {
  kind: 'stale' | 'due';
  text: string;
}

/**
 * 提醒規則：
 *  - "stale"：狀態是「已投遞」，且已經 `staleDays` 天沒有任何動靜
 *    （從最後一次跟進算起，沒有的話從投遞日算起）。
 *  - "due"：有設定跟進日、且是今天或更早，而且這筆投遞還在進行中。
 */
export function flagsOf(a: Application, staleDays: number, today: string = todayStr()): Flag[] {
  const flags: Flag[] = [];

  if (a.status === 'applied') {
    const ref = a.lastContact || a.appliedAt;
    if (ref) {
      const d = daysBetween(today, ref);
      if (d >= staleDays) flags.push({ kind: 'stale', text: `${d} 天沒消息` });
    }
  }

  if (a.followUpAt && (a.status === 'applied' || a.status === 'interview') && a.followUpAt <= today) {
    flags.push({ kind: 'due', text: a.followUpAt === today ? '今天要跟進' : '跟進已逾期' });
  }

  return flags;
}

/** 距離最後一次動靜的天數；用來排序提醒清單（沉默最久的排最前面）。 */
export function silenceDays(a: Application, today: string = todayStr()): number {
  const ref = a.lastContact || a.appliedAt;
  return ref ? daysBetween(today, ref) : 0;
}
