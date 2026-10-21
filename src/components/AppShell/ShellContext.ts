'use client';

import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Application } from '@/lib/types';

/** 登入後三個頁面共用的資料與動作，由 AppShell 提供。 */
export interface Shell {
  session: Session;
  userId: string;
  /** 真正的投遞資料（不含範例）。 */
  apps: Application[];
  /** 畫面上要顯示的資料：還沒有任何投遞時是範例資料。 */
  shown: Application[];
  samplesOn: boolean;
  loaded: boolean;
  offline: boolean;
  /** 修改「超過 N 天沒消息就提醒」，並同步到資料庫。 */
  changeStaleDays: (days: number) => void;
}

export const ShellContext = createContext<Shell | null>(null);

export function useShell(): Shell {
  const shell = useContext(ShellContext);
  if (!shell) throw new Error('useShell 只能在 AppShell 裡面使用');
  return shell;
}
