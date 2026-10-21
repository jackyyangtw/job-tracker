export const applicationsKey = (userId: string) => ['applications', userId] as const;
export const applicationsCacheKey = (userId: string) => ['applications-cache', userId] as const;
export const userSettingsKey = (userId: string) => ['user-settings', userId] as const;
