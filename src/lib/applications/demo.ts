import type { Application, Resume } from '../types';
import { addDays } from '../dates';

/**
 * 試用模式（/demo）的初始資料：涵蓋所有狀態，並包含「沒消息」與「該跟進」兩種提醒，
 * 讓看板、提醒清單與統計頁都有內容。只存在記憶體裡，不會寫入資料庫。
 *
 * 不標記 `sample`：範例資料不能編輯，試用模式則要讓訪客實際操作。
 */
export function demoApps(today: Date = new Date()): Application[] {
  const day = (n: number) => addDays(n, today);
  const base = { url: '', followUpAt: '', lastContact: '', interviewAt: '', interviewLocation: '', note: '', createdAt: today.toISOString(), updatedAt: today.toISOString() } as const;
  const list: Omit<Application, 'resumeId'>[] = [
    { ...base, id: 'demo-1', company: '範例科技', title: '前端工程師', source: 'Cake', status: 'applied', appliedAt: day(-20), resume: 'v1 通用版', note: '投出後一直沒有回音' },
    { ...base, id: 'demo-2', company: '範例金融', title: '資深前端工程師', source: '104', status: 'applied', appliedAt: day(-9), followUpAt: day(0), resume: 'v2 強調 Next.js' },
    { ...base, id: 'demo-3', company: '範例數位', title: 'React 工程師', source: 'LinkedIn', status: 'applied', appliedAt: day(-3), resume: 'v2 強調 Next.js' },
    { ...base, id: 'demo-4', company: '範例軟體', title: '前端工程師（TypeScript）', source: '內推', status: 'interview', appliedAt: day(-12), followUpAt: day(-1), resume: 'v2 強調 Next.js', note: '技術面試後要寄感謝信' },
    { ...base, id: 'demo-5', company: '範例雲端', title: 'Frontend Engineer', source: '公司官網', status: 'interview', appliedAt: day(-18), lastContact: day(-2), interviewAt: `${day(2)}T14:00`, interviewLocation: '線上面試 https://meet.google.com/abc-defg-hij', resume: 'v3 英文版', note: '二面：主管面談' },
    { ...base, id: 'demo-10', company: '範例智慧', title: '前端工程師', source: '104', status: 'awaiting', appliedAt: day(-21), lastContact: day(-4), interviewAt: `${day(-4)}T15:00`, interviewLocation: '台北市內湖區（範例地址）', resume: 'v2 強調 Next.js', note: '終面結束，說一週內通知結果' },
    { ...base, id: 'demo-6', company: '範例新創', title: 'Next.js 工程師', source: '內推', status: 'offer', appliedAt: day(-30), lastContact: day(-1), resume: 'v2 強調 Next.js', note: '收到 Offer，考慮中' },
    { ...base, id: 'demo-7', company: '範例電商', title: '前端工程師', source: '104', status: 'rejected', appliedAt: day(-25), resume: 'v1 通用版' },
    { ...base, id: 'demo-8', company: '範例媒體', title: 'Web 工程師', source: '104', status: 'withdrawn', appliedAt: day(-15), resume: 'v1 通用版', note: '職缺內容和面談說的不同' },
    { ...base, id: 'demo-9', company: '範例遊戲', title: '前端工程師', source: 'Cake', status: 'wishlist', appliedAt: '', resume: '' },
  ];
  const ids = new Map(demoResumes(today).map((r) => [r.name, r.id]));
  return list.map((a) => ({ ...a, resumeId: ids.get(a.resume) ?? '' }));
}

/** 試用模式的履歷版本，名稱和上面投遞用到的版本相同。PDF 要訪客自己上傳（只存在分頁裡）。 */
export function demoResumes(today: Date = new Date()): Resume[] {
  const at = today.toISOString();
  const base = { kind: 'url', filePath: '', fileName: '', createdAt: at, updatedAt: at } as const;
  return [
    { ...base, id: 'demo-resume-1', name: 'v1 通用版', url: 'https://example.com/resume-v1' },
    { ...base, id: 'demo-resume-2', name: 'v2 強調 Next.js', url: 'https://example.com/resume-v2' },
    { ...base, id: 'demo-resume-3', name: 'v3 英文版', url: 'https://example.com/resume-en' },
  ];
}
