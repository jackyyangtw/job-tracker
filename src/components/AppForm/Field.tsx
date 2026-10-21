import { Label } from '@/components/ui/label';

interface FieldProps {
  label: string;
  id: string;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}

export default function Field({ label, id, error, full, children }: FieldProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-1${full ? ' sm:col-span-2' : ''}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <div id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
