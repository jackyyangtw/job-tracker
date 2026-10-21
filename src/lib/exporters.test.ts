import { describe, expect, it } from 'vitest';
import { followUpMessage, toCsv, toJson } from './exporters';
import { makeApp } from './testUtils';

const dataRow = (csv: string) => csv.split('\r\n')[1];

describe('toCsv', () => {
  it('開頭有 BOM，Excel 才能正確顯示中文', () => {
    expect(toCsv([]).charCodeAt(0)).toBe(0xfeff);
  });

  it('第一列是中文標題，列與列之間用 CRLF', () => {
    const csv = toCsv([makeApp()]);
    expect(csv.slice(1).split('\r\n')[0]).toBe('"公司","職位","來源","狀態","投遞日","履歷版本","下次跟進","連結","備註"');
    expect(csv.split('\r\n')).toHaveLength(2);
  });

  it('狀態輸出成中文', () => {
    expect(dataRow(toCsv([makeApp({ status: 'interview' })]))).toContain('"面試中"');
  });

  it('雙引號會被跳脫，逗號與換行包在引號內', () => {
    const row = dataRow(toCsv([makeApp({ company: '說"好"的公司', note: 'a,b' })]));
    expect(row.startsWith('"說""好""的公司"')).toBe(true);
    expect(row).toContain('"a,b"');
  });

  it.each(['=1+1', '+886', '-cmd', '@SUM(A1)'])('防止公式注入：%s 前面加上單引號', (value) => {
    expect(dataRow(toCsv([makeApp({ company: value })])).startsWith(`"'${value}"`)).toBe(true);
  });
});

describe('toJson', () => {
  it('包含格式資訊，並移除只用來顯示的 sample 標記', () => {
    const data = JSON.parse(toJson([makeApp({ sample: true })]));
    expect(data.app).toBe('job-tracker');
    expect(data.version).toBe(1);
    expect(data.apps).toHaveLength(1);
    expect(data.apps[0]).not.toHaveProperty('sample');
  });
});

describe('followUpMessage', () => {
  it('包含投遞日與職位', () => {
    const msg = followUpMessage(makeApp({ title: '前端工程師', appliedAt: '2026-10-20' }));
    expect(msg).toContain('2026/10/20');
    expect(msg).toContain('「前端工程師」');
  });

  it('沒有職位或投遞日時改用通用說法', () => {
    const msg = followUpMessage(makeApp());
    expect(msg).toContain('我投遞了貴公司的這個職缺');
  });
});
