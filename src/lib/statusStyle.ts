import type { Status } from './types';

// Tailwind 只會產生它能看到完整字串的 class，所以每個狀態都要把 class 完整寫出來。
export const STATUS_STYLE: Record<Status, { dot: string; text: string; pill: string }> = {
  wishlist: { dot: 'bg-status-wishlist', text: 'text-status-wishlist', pill: 'bg-status-wishlist/15 text-status-wishlist' },
  applied: { dot: 'bg-status-applied', text: 'text-status-applied', pill: 'bg-status-applied/15 text-status-applied' },
  interview: { dot: 'bg-status-interview', text: 'text-status-interview', pill: 'bg-status-interview/15 text-status-interview' },
  offer: { dot: 'bg-status-offer', text: 'text-status-offer', pill: 'bg-status-offer/15 text-status-offer' },
  rejected: { dot: 'bg-status-rejected', text: 'text-status-rejected', pill: 'bg-status-rejected/15 text-status-rejected' },
  withdrawn: { dot: 'bg-status-withdrawn', text: 'text-status-withdrawn', pill: 'bg-status-withdrawn/15 text-status-withdrawn' },
};
