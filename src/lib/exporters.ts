import { STATUS_LABEL, type Application } from './types';

export function toJson(apps: Application[]): string {
  const clean = apps.map(({ sample: _sample, ...rest }) => rest);
  return JSON.stringify({ app: 'job-tracker', version: 1, exportedAt: new Date().toISOString(), apps: clean }, null, 2);
}

function csvCell(v: unknown): string {
  let s = String(v ?? '');
  // Neutralise spreadsheet formula injection (=, +, -, @ at the start of a cell).
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** UTF-8 with BOM so Excel opens Chinese text correctly. */
export function toCsv(apps: Application[]): string {
  const head = ['公司', '職位', '來源', '狀態', '投遞日', '履歷版本', '下次跟進', '連結', '備註'];
  const rows = apps.map((a) =>
    [a.company, a.title, a.source, STATUS_LABEL[a.status], a.appliedAt, a.resume, a.followUpAt, a.url, a.note]
      .map(csvCell)
      .join(','),
  );
  return '﻿' + [head.map(csvCell).join(','), ...rows].join('\r\n');
}

export function downloadFile(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function followUpMessage(a: Application): string {
  const role = a.title ? `「${a.title}」` : '這個職缺';
  const when = a.appliedAt ? `我在 ${a.appliedAt.replace(/-/g, '/')} 投遞了貴公司的` : '我投遞了貴公司的';
  return `您好，${when}${role}，想請問目前的審核進度是否有更新？如果需要補充任何資料，我可以隨時提供。謝謝您！`;
}
