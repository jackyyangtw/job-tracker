// Query key：依使用者區分快取。
export const applicationsKey = (userId: string) => ['applications', userId] as const;
export const applicationsCacheKey = (userId: string) => ['applications-cache', userId] as const;
export const userSettingsKey = (userId: string) => ['user-settings', userId] as const;
export const resumesKey = (userId: string) => ['resumes', userId] as const;
/** PDF 履歷的簽章網址；依檔案路徑分組，路徑變了就重新簽。 */
export const resumeLinksKey = (userId: string, paths: readonly string[]) => ['resume-links', userId, ...paths] as const;

// Mutation key：前綴和對應的 query key 相同，可以用 useIsMutating({ mutationKey: ['applications'] })
// 一次查出所有投遞相關的寫入是否進行中；在 React Query DevTools 裡也能看出是哪一種寫入。
export const mutationKeys = {
  upsertApplication: ['applications', 'upsert'],
  removeApplication: ['applications', 'remove'],
  importApplications: ['applications', 'import'],
  updateUserSettings: ['user-settings', 'update'],
  saveResume: ['resumes', 'save'],
  removeResume: ['resumes', 'remove'],
} as const;
