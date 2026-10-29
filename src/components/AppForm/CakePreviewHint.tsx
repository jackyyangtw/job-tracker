import type { CakePreviewStatus } from './useCakeJobPreview';

const PREVIEW_TEXT: Record<Exclude<CakePreviewStatus, 'idle'>, string> = {
  loading: '辨識職缺中…',
  done: '已帶入公司與職稱，請確認內容',
  failed: '無法自動辨識，請手動填寫',
  blocked: 'Cake 暫時無法查詢，請手動填寫',
  unauthorized: '登入已過期，請重新登入後再試',
};

/** 職缺連結欄下方的 Cake 職缺辨識狀態；用 role="status" 讓螢幕閱讀器唸出結果。 */
export default function CakePreviewHint({ status }: { status: CakePreviewStatus }) {
  if (status === 'idle') return null;
  return (
    <p role="status" className="text-xs text-muted-foreground">
      {PREVIEW_TEXT[status]}
    </p>
  );
}
