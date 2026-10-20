import { Badge } from '@/components/ui/badge';
import { flagsOf } from '@/lib/flags';
import type { Application } from '@/lib/types';

export function FlagBadges({ app, staleDays }: { app: Application; staleDays: number }) {
  return (
    <>
      {flagsOf(app, staleDays).map((f) => (
        <Badge key={f.kind} variant={f.kind === 'due' ? 'destructive' : 'warn'}>
          {f.text}
        </Badge>
      ))}
    </>
  );
}

export function SampleTag() {
  return <Badge variant="outline">範例</Badge>;
}
