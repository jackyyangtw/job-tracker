import type { PreviewStatus } from './useJobPreview';

const PREVIEW_TEXT: Record<Exclude<PreviewStatus, 'idle'>, string> = {
  loading: '辨識職缺中…',
  done: '已帶入公司與職稱，請確認內容',
  failed: '無法自動辨識，請手動填寫',
  blocked: '104 暫時無法查詢，請手動填寫',
  unauthorized: '登入已過期，請重新登入後再試',
};

export default function PreviewHint({ status }: { status: PreviewStatus }) {
  if (status === 'idle') return null;
  return (
    <p role="status" className="text-xs text-muted-foreground">
      {PREVIEW_TEXT[status]}
    </p>
  );
}
