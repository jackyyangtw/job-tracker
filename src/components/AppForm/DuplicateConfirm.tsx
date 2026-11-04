import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { STATUS_LABEL, type Application } from '@/lib/types';

interface Props {
  /** 之前投過的同一個職缺；null 時不顯示。 */
  duplicate: Application | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/** 新增的投遞和既有投遞是同一個職缺時，疊在表單上面的確認對話框。 */
export default function DuplicateConfirm({ duplicate, onCancel, onConfirm }: Props) {
  return (
    <Dialog open={!!duplicate} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-sm" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogTitle className="flex items-center gap-2">
          <Info aria-hidden className="size-5 shrink-0 text-primary" />
          好像已經投過這個職缺
        </DialogTitle>
        <DialogDescription className="not-sr-only text-muted-foreground">之前已有一筆相同職缺的投遞，確定還要再新增一筆嗎？</DialogDescription>
        {duplicate ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-secondary px-3 py-2 text-sm">
            <dt className="text-muted-foreground">公司</dt>
            <dd className="min-w-0 break-words">{duplicate.company}</dd>
            <dt className="text-muted-foreground">職位</dt>
            <dd className="min-w-0 break-words">{duplicate.title || '（未填）'}</dd>
            <dt className="text-muted-foreground">狀態</dt>
            <dd>{STATUS_LABEL[duplicate.status]}</dd>
            <dt className="text-muted-foreground">投遞日</dt>
            <dd>{duplicate.appliedAt || '（未填）'}</dd>
          </dl>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="button" onClick={onConfirm}>
            仍要新增
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
