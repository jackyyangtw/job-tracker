import { Label } from '@/components/ui/label';

interface FieldProps {
  label: string;
  id: string;
  error?: string;
  /** 說明文字，id 為 `${id}-hint`，欄位要自己用 aria-describedby 指向它。 */
  hint?: string;
  /** 只負責顯示星號；欄位本身要另外加 aria-required。 */
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}

export default function Field({ label, id, error, hint, required, full, children }: FieldProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-1${full ? ' sm:col-span-2' : ''}`}>
      <Label htmlFor={id}>
        {label}
        {/* 星號只是視覺提示，螢幕閱讀器改由欄位的 aria-required 得知必填 */}
        {required ? <span aria-hidden> *</span> : null}
      </Label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error && (
        <div id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
