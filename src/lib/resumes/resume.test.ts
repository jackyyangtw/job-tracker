import { describe, expect, it } from 'vitest';
import { makeApp, makeResume } from '../testUtils';
import {
  detachResumeFromApps,
  hostOf,
  isPdfFile,
  MAX_PDF_BYTES,
  renameResumeInApps,
  resumeFilePath,
  resumeUsage,
  validateResumeDraft,
  type ResumeDraft,
} from './resume';

const pdf = (size = 1000, name = 'cv.pdf', type = 'application/pdf') => ({ name, type, size }) as File;
const draft = (overrides: Partial<ResumeDraft> = {}): ResumeDraft => ({ name: 'v2', kind: 'url', url: 'https://example.com/cv', file: null, ...overrides });

describe('resumeFilePath', () => {
  it('第一層資料夾是使用者 id', () => {
    expect(resumeFilePath('u1', 'r1')).toBe('u1/r1.pdf');
  });
});

describe('isPdfFile', () => {
  it('依 MIME type 判斷', () => {
    expect(isPdfFile(pdf())).toBe(true);
    expect(isPdfFile(pdf(1, 'cv.pdf', 'image/png'))).toBe(false);
  });

  it('沒有 MIME type 時看副檔名', () => {
    expect(isPdfFile(pdf(1, 'CV.PDF', ''))).toBe(true);
    expect(isPdfFile(pdf(1, 'cv.docx', ''))).toBe(false);
  });
});

describe('validateResumeDraft', () => {
  it('網址版本填好名稱與網址就通過', () => {
    expect(validateResumeDraft(draft(), null, [])).toEqual({});
  });

  it('名稱必填、不可和其他版本重複，但可以和自己同名', () => {
    const existing = makeResume({ name: 'v2' });
    expect(validateResumeDraft(draft({ name: '  ' }), null, []).name).toBe('請填版本名稱');
    expect(validateResumeDraft(draft(), null, [existing]).name).toBe('已經有同名的版本');
    expect(validateResumeDraft(draft(), existing, [existing]).name).toBeUndefined();
  });

  it('網址必填且只接受 http(s)', () => {
    expect(validateResumeDraft(draft({ url: '' }), null, []).url).toBe('請填履歷網址');
    expect(validateResumeDraft(draft({ url: 'javascript:alert(1)' }), null, []).url).toBe('只接受 http 或 https 網址');
  });

  it('新增 PDF 版本一定要選檔案', () => {
    expect(validateResumeDraft(draft({ kind: 'pdf' }), null, []).file).toBe('請選擇 PDF 檔');
    expect(validateResumeDraft(draft({ kind: 'pdf', file: pdf() }), null, [])).toEqual({});
  });

  it('編輯已有檔案的 PDF 版本可以不換檔案', () => {
    const current = makeResume({ kind: 'pdf', url: '', filePath: 'u/r.pdf', fileName: 'cv.pdf' });
    expect(validateResumeDraft(draft({ kind: 'pdf' }), current, [current])).toEqual({});
  });

  it('從網址改成 PDF 時要選檔案', () => {
    const current = makeResume();
    expect(validateResumeDraft(draft({ kind: 'pdf' }), current, [current]).file).toBe('請選擇 PDF 檔');
  });

  it('擋掉非 PDF、空檔與超過 10 MB 的檔案', () => {
    expect(validateResumeDraft(draft({ kind: 'pdf', file: pdf(10, 'a.png', 'image/png') }), null, []).file).toBe('只能上傳 PDF 檔');
    expect(validateResumeDraft(draft({ kind: 'pdf', file: pdf(0) }), null, []).file).toBe('檔案是空的');
    expect(validateResumeDraft(draft({ kind: 'pdf', file: pdf(MAX_PDF_BYTES + 1) }), null, []).file).toBe('PDF 最大 10 MB');
  });
});

describe('投遞與履歷版本的關聯', () => {
  const apps = [
    makeApp({ id: 'a', resumeId: 'r1', resume: '舊名' }),
    makeApp({ id: 'b', resumeId: 'r2', resume: '其他' }),
    makeApp({ id: 'c', resumeId: 'r1', resume: '舊名' }),
    makeApp({ id: 'd', resume: '手填' }),
  ];

  it('計算每個版本用在幾筆投遞', () => {
    expect(resumeUsage(apps)).toEqual(new Map([['r1', 2], ['r2', 1]]));
  });

  it('改名只影響用到該版本的投遞', () => {
    const next = renameResumeInApps(apps, { id: 'r1', name: '新名' });
    expect(next.map((a) => a.resume)).toEqual(['新名', '其他', '新名', '手填']);
    expect(next[1]).toBe(apps[1]);
  });

  it('刪除版本只清掉 id，保留名稱', () => {
    const next = detachResumeFromApps(apps, 'r1');
    expect(next.map((a) => [a.resumeId, a.resume])).toEqual([['', '舊名'], ['r2', '其他'], ['', '舊名'], ['', '手填']]);
  });
});

describe('hostOf', () => {
  it('只留網域並去掉 www', () => {
    expect(hostOf('https://www.cake.me/me/abc')).toBe('cake.me');
    expect(hostOf('not a url')).toBe('not a url');
  });
});
