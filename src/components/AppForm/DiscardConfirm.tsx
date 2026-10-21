import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
}

/** Nested confirmation shown when the form is closed with unsaved edits. */
export default function DiscardConfirm({ open, onOpenChange, onDiscard }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogTitle>放棄未儲存的內容？</DialogTitle>
        <DialogDescription className="not-sr-only text-muted-foreground">你填寫的內容還沒有儲存，關閉後會遺失。</DialogDescription>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            繼續編輯
          </Button>
          <Button type="button" variant="destructive-solid" onClick={onDiscard}>
            放棄並關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
