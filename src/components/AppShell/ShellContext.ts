'use client';

import { createContext, useContext } from 'react';
import type { Application } from '@/lib/types';

/**
 * 三個頁面共用的資料與動作。正式模式由 AppShell 接 Supabase 提供；
 * 試用模式由 DemoShell 提供記憶體裡的資料，頁面不需要知道差別。
 */
export interface Shell {
  /** 試用模式：資料只在記憶體裡，不會寫入資料庫。 */
  isDemo: boolean;
  /** 導覽連結的前綴：正式模式是 ''，試用模式是 '/demo'。 */
  basePath: string;
  /** 登入帳號的 email；試用模式沒有帳號。 */
  email: string | null;
  /** 真正的投遞資料（不含範例）。 */
  apps: Application[];
  /** 畫面上要顯示的資料：還沒有任何投遞時是範例資料。 */
  shown: Application[];
  samplesOn: boolean;
  loaded: boolean;
  offline: boolean;
  /** 修改「超過 N 天沒消息就提醒」，並同步到資料庫。 */
  changeStaleDays: (days: number) => void;
  /** 新增或修改一筆投遞。成功回傳 `true`。 */
  upsert: (app: Application) => Promise<boolean>;
  /** 刪除一筆投遞。成功回傳 `true`。 */
  remove: (id: string) => Promise<boolean>;
  /** 大量匯入，回傳實際儲存的筆數。 */
  importMany: (apps: Application[]) => Promise<number>;
  /** 正式模式是登出；試用模式是離開試用。 */
  signOut: () => void;
}

export const ShellContext = createContext<Shell | null>(null);

export function useShell(): Shell {
  const shell = useContext(ShellContext);
  if (!shell) throw new Error('useShell 只能在 AppShell 或 DemoShell 裡面使用');
  return shell;
}
