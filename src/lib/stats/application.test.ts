import { describe, expect, it } from 'vitest';
import { makeApp } from '../testUtils';
import { reachedInterview } from './application';

describe('reachedInterview', () => {
  it('有填面試時間的未錄取／撤回也算進過面試', () => {
    expect(reachedInterview(makeApp({ status: 'rejected', interviewAt: '2026-10-01T10:00' }))).toBe(true);
    expect(reachedInterview(makeApp({ status: 'rejected' }))).toBe(false);
    expect(reachedInterview(makeApp({ status: 'awaiting' }))).toBe(true);
    expect(reachedInterview(makeApp({ status: 'wishlist', interviewAt: '2026-10-01T10:00' }))).toBe(false);
  });
});
