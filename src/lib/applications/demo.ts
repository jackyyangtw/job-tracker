import type { Application } from '../types';
import { addDays } from '../dates';

/**
 * 試用模式（/demo）的初始資料：涵蓋六種狀態，並包含「沒消息」與「該跟進」兩種提醒，
 * 讓看板、提醒清單與統計頁都有內容。只存在記憶體裡，不會寫入資料庫。
 *
 * 不標記 `sample`：範例資料不能編輯，試用模式則要讓訪客實際操作。
 */
export function demoApps(today: Date = new Date()): Application[] {
  const day = (n: number) => addDays(n, today);
  const base = { url: '', followUpAt: '', lastContact: '', note: '', createdAt: today.toISOString(), updatedAt: today.toISOString() } as const;
  return [
    { ...base, id: 'demo-1', company: '範例科技', title: '前端工程師', source: 'Cake', status: 'applied', appliedAt: day(-20), resume: 'v1 通用版', note: '投出後一直沒有回音' },
    { ...base, id: 'demo-2', company: '範例金融', title: '資深前端工程師', source: '104', status: 'applied', appliedAt: day(-9), followUpAt: day(0), resume: 'v2 強調 Next.js' },
    { ...base, id: 'demo-3', company: '範例數位', title: 'React 工程師', source: 'LinkedIn', status: 'applied', appliedAt: day(-3), resume: 'v2 強調 Next.js' },
    { ...base, id: 'demo-4', company: '範例軟體', title: '前端工程師（TypeScript）', source: '內推', status: 'interview', appliedAt: day(-12), followUpAt: day(-1), resume: 'v2 強調 Next.js', note: '技術面試後要寄感謝信' },
    { ...base, id: 'demo-5', company: '範例雲端', title: 'Frontend Engineer', source: '公司官網', status: 'interview', appliedAt: day(-18), lastContact: day(-2), resume: 'v3 英文版', note: '二面已排定' },
    { ...base, id: 'demo-6', company: '範例新創', title: 'Next.js 工程師', source: '內推', status: 'offer', appliedAt: day(-30), lastContact: day(-1), resume: 'v2 強調 Next.js', note: '收到 Offer，考慮中' },
    { ...base, id: 'demo-7', company: '範例電商', title: '前端工程師', source: '104', status: 'rejected', appliedAt: day(-25), resume: 'v1 通用版' },
    { ...base, id: 'demo-8', company: '範例媒體', title: 'Web 工程師', source: '104', status: 'withdrawn', appliedAt: day(-15), resume: 'v1 通用版', note: '職缺內容和面談說的不同' },
    { ...base, id: 'demo-9', company: '範例遊戲', title: '前端工程師', source: 'Cake', status: 'wishlist', appliedAt: '', resume: '' },
  ];
}
