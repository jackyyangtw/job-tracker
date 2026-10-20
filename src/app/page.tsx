import TrackerApp from '@/components/TrackerApp';

// The page is a thin shell on purpose: auth and data load in the browser, so the HTML can be cached
// by the service worker and the app still opens offline (showing the last synced data from IndexedDB).
// Data access is protected by Row Level Security in Supabase, not by this page.
export default function Home() {
  return <TrackerApp />;
}
