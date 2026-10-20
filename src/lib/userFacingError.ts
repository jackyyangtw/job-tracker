/** Error whose message is safe to show to the user as-is. */
export class UserFacingError extends Error {}

export const isOffline = () => typeof navigator !== 'undefined' && !navigator.onLine;

export const messageFor = (e: unknown, fallback: string) => (e instanceof UserFacingError ? e.message : fallback);
