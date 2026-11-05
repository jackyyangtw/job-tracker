'use client';

import { useState } from 'react';
import { ExternalLink, FileText, Link2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import ResumeLink from '@/components/ResumeLink';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { hostOf } from '@/lib/resumes/resume';
import type { Resume } from '@/lib/types';

interface Props {
  resume: Resume;
  href: string;
  /** 用到這個版本的投遞筆數。 */
  usedBy: number;
  onEdit: () => void;
  onRemove: () => Promise<void>;
}

/** 一張履歷版本卡片：上方是名稱與來源（網域或檔名）、「⋯」選單，下方是使用次數與開啟連結。 */
export default function ResumeItem({ resume, href, usedBy, onEdit, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false);
  const isPdf = resume.kind === 'pdf';
  const Icon = isPdf ? FileText : Link2;

  return (
    <Card className="h-full gap-0 rounded-[10px] p-0">
      <div className="flex min-w-0 items-start gap-3 p-4">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
          <Icon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="truncate text-base font-medium">{resume.name}</h2>
          <p className="truncate text-xs text-muted-foreground" title={isPdf ? resume.fileName : resume.url}>
            <span className="sr-only">{isPdf ? 'PDF：' : '網址：'}</span>
            {isPdf ? resume.fileName || 'PDF 檔案' : hostOf(resume.url)}
          </p>
        </div>
        {/* modal={false}：從選單開確認對話框時，Radix 才不會把 body 的 pointer-events 留在 none */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="-mt-1 -mr-2" aria-label={`${resume.name} 的更多操作`}>
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-36">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil aria-hidden className="mr-2 size-4" />
              編輯
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setConfirming(true)} className="text-destructive">
              <Trash2 aria-hidden className="mr-2 size-4" />
              刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t px-4 py-3 text-sm">
        <span className="text-muted-foreground">{usedBy ? `已用於 ${usedBy} 筆投遞` : '尚未用於投遞'}</span>
        <ResumeLink resume={resume} href={href} className="shrink-0">
          {isPdf ? '預覽' : '開啟'}
          <ExternalLink aria-hidden className="size-3.5" />
        </ResumeLink>
      </div>

      <DeleteConfirm
        open={confirming}
        name={resume.name}
        usedBy={usedBy}
        onOpenChange={setConfirming}
        onConfirm={async () => {
          await onRemove();
          setConfirming(false);
        }}
      />
    </Card>
  );
}

interface DeleteConfirmProps {
  open: boolean;
  name: string;
  usedBy: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

function DeleteConfirm({ open, name, usedBy, onOpenChange, onConfirm }: DeleteConfirmProps) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-sm">
        <DialogTitle>刪除「{name}」？</DialogTitle>
        <DialogDescription className="not-sr-only text-muted-foreground">
          {usedBy ? `用到這個版本的 ${usedBy} 筆投遞會保留版本名稱，但不能再從投遞開啟履歷。` : '刪除後無法復原。'}
        </DialogDescription>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            取消
          </Button>
          <Button
            type="button"
            variant="destructive-solid"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm();
              setBusy(false);
            }}
          >
            {busy ? '刪除中…' : '刪除'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
