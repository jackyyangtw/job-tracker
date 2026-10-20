import type { Status } from './types';

// Tailwind only generates classes it can see as complete strings, so each status spells them out.
export const STATUS_STYLE: Record<Status, { dot: string; text: string; pill: string }> = {
  wishlist: { dot: 'bg-status-wishlist', text: 'text-status-wishlist', pill: 'bg-status-wishlist/15 text-status-wishlist' },
  applied: { dot: 'bg-status-applied', text: 'text-status-applied', pill: 'bg-status-applied/15 text-status-applied' },
  interview: { dot: 'bg-status-interview', text: 'text-status-interview', pill: 'bg-status-interview/15 text-status-interview' },
  offer: { dot: 'bg-status-offer', text: 'text-status-offer', pill: 'bg-status-offer/15 text-status-offer' },
  rejected: { dot: 'bg-status-rejected', text: 'text-status-rejected', pill: 'bg-status-rejected/15 text-status-rejected' },
  withdrawn: { dot: 'bg-status-withdrawn', text: 'text-status-withdrawn', pill: 'bg-status-withdrawn/15 text-status-withdrawn' },
};
