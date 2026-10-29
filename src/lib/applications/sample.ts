import type { Application } from '../types';
import { addDays } from '../dates';

/** 顯示給全新使用者看的範例資料。只存在記憶體裡，不會被儲存。 */
export function sampleApps(): Application[] {
  const now = new Date().toISOString();
  const base = { url: '', followUpAt: '', lastContact: '', interviewAt: '', interviewLocation: '', note: '', createdAt: now, updatedAt: now, sample: true } as const;
  return [
    { ...base, id: 's1', company: '範例科技', title: '前端工程師', source: 'Cake', status: 'applied', appliedAt: addDays(-17), resume: 'v1 通用版', note: '範例：投出後一直沒有回音' },
    { ...base, id: 's2', company: '範例金融', title: '資深前端工程師', source: '104', status: 'applied', appliedAt: addDays(-6), followUpAt: addDays(0), resume: 'v2 強調 Next.js' },
    { ...base, id: 's3', company: '範例軟體', title: 'React 工程師', source: '內推', status: 'interview', appliedAt: addDays(-12), interviewAt: `${addDays(3)}T10:00`, interviewLocation: '台北市信義區（範例地址）', resume: 'v2 強調 Next.js', note: '範例：技術面試' },
    { ...base, id: 's4', company: '範例電商', title: '前端工程師', source: '104', status: 'rejected', appliedAt: addDays(-25), resume: 'v1 通用版' },
    { ...base, id: 's5', company: '範例新創', title: 'Next.js 工程師', source: 'LinkedIn', status: 'wishlist', appliedAt: '', resume: '' },
  ];
}
