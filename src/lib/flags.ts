import type { Application } from './types';
import { daysBetween, todayStr } from './dates';

export interface Flag {
  kind: 'stale' | 'due';
  text: string;
}

/**
 * Reminder rules:
 *  - "stale": status is applied and nothing has happened for `staleDays` days
 *    (measured from the last follow-up, or from the application date).
 *  - "due": a follow-up date is set, is today or earlier, and the application is still active.
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

/** Days since the last sign of life; used to order the reminder list (longest silence first). */
export function silenceDays(a: Application, today: string = todayStr()): number {
  const ref = a.lastContact || a.appliedAt;
  return ref ? daysBetween(today, ref) : 0;
}
