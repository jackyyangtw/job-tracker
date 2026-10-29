import { describe, expect, it } from 'vitest';
import { H104_PARAM, job104FromParams, parse104JobHeader } from './jobHeader';

describe('parse104JobHeader', () => {
  it('取出公司與職稱，並去除多餘空白', () => {
    const raw = JSON.stringify({ jobName: ' 前端\n工程師 ', custName: '測試公司', appearDate: '2026/10/21' });
    expect(parse104JobHeader(raw)).toEqual({ company: '測試公司', title: '前端 工程師' });
  });

  it('超過表單長度上限時截斷', () => {
    const r = parse104JobHeader(JSON.stringify({ custName: 'a'.repeat(200), jobName: 'b'.repeat(200) }));
    expect(r.company).toHaveLength(120);
    expect(r.title).toHaveLength(160);
  });

  it('沒有內容、格式不對、欄位不是字串或太長時回傳空字串', () => {
    const empty = { company: '', title: '' };
    expect(parse104JobHeader(null)).toEqual(empty);
    expect(parse104JobHeader('')).toEqual(empty);
    expect(parse104JobHeader('{壞掉')).toEqual(empty);
    expect(parse104JobHeader('null')).toEqual(empty);
    expect(parse104JobHeader(JSON.stringify({ custName: 123, jobName: ['x'] }))).toEqual(empty);
    expect(parse104JobHeader(JSON.stringify({ custName: '測試公司', pad: 'x'.repeat(20_000) }))).toEqual(empty);
  });
});

describe('job104FromParams', () => {
  it('讀取 h104 參數', () => {
    const p = new URLSearchParams({ [H104_PARAM]: JSON.stringify({ custName: '測試公司', jobName: '前端工程師' }) });
    expect(job104FromParams(p)).toEqual({ company: '測試公司', title: '前端工程師' });
    expect(job104FromParams(new URLSearchParams())).toEqual({ company: '', title: '' });
  });
});
