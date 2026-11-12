import type { Application, Resume } from './types';

/** 測試用的投遞資料：只需要填和該測試有關的欄位。 */
export function makeApp(overrides: Partial<Application> = {}): Application {
  return {
    id: '00000000-0000-4000-8000-000000000000',
    company: '測試公司',
    title: '',
    url: '',
    source: '',
    status: 'applied',
    appliedAt: '',
    followUpAt: '',
    lastContact: '',
    interviewAt: '',
    interviewLocation: '',
    interviewQuestions: [],
    resume: '',
    resumeId: '',
    note: '',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

/** 測試用的履歷版本。 */
export function makeResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: '00000000-0000-4000-8000-0000000000aa',
    name: 'v1 通用版',
    kind: 'url',
    url: 'https://example.com/resume',
    filePath: '',
    fileName: '',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}
