import { useRef, useState } from 'react';
import { addDays, todayStr } from '@/lib/dates';
import { detectSource, extractUrl, safeUrl } from '@/lib/data/mapping';
import type { CakeJobPreview } from '@/lib/cake-resume/jobPreview';
import type { Prefill } from '@/lib/data/prefill';
import type { Application, Source, Status } from '@/lib/types';

interface Values {
  company: string;
  title: string;
  url: string;
  source: Source;
  status: Status;
  appliedAt: string;
  followUpAt: string;
  interviewAt: string;
  interviewLocation: string;
  resume: string;
  note: string;
}

function initialValues(initial: Application | null): Values {
  return {
    company: initial?.company ?? '',
    title: initial?.title ?? '',
    url: initial?.url ?? '',
    source: initial?.source ?? '',
    status: initial?.status ?? 'applied',
    appliedAt: initial ? initial.appliedAt : todayStr(),
    followUpAt: initial ? initial.followUpAt : addDays(7),
    interviewAt: initial?.interviewAt ?? '',
    interviewLocation: initial?.interviewLocation ?? '',
    resume: initial?.resume ?? '',
    note: initial?.note ?? '',
  };
}

/**
 * 欄位值、是否有未儲存的修改，以及由欄位組出的最終 Application。
 * `prefill`（從網址參數帶入）只填進欄位、不算進起始值，所以沒儲存就關閉時會詢問是否放棄。
 */
export function useAppFormState(initial: Application | null, prefill?: Prefill | null) {
  const [start] = useState(() => initialValues(initial));
  const [values, setValues] = useState(() => (prefill ? { ...start, ...prefill } : start));
  // 手動選過來源之後，貼上網址就不再自動覆蓋它。
  const sourceTouched = useRef(!!initial?.source);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  function setUrl(raw: string) {
    // 貼上整段分享訊息也沒關係：只會保留其中的連結。
    const url = extractUrl(raw);
    const detected = detectSource(url);
    setValues((v) => ({ ...v, url, source: detected && !sourceTouched.current ? detected : v.source }));
  }

  /** 把從 Cake 查到的公司與職稱填進表單，但絕不覆蓋使用者已經輸入的內容。 */
  function applyCakePreview(preview: CakeJobPreview) {
    setValues((v) => ({
      ...v,
      company: v.company.trim() ? v.company : preview.company,
      title: v.title.trim() ? v.title : preview.title,
    }));
  }

  function setSource(source: Source) {
    sourceTouched.current = true;
    set('source', source);
  }

  const dirty = (Object.keys(start) as (keyof Values)[]).some((k) => values[k] !== start[k]);

  function toApplication(): Application {
    const now = new Date().toISOString();
    return {
      id: initial?.id ?? crypto.randomUUID(),
      company: values.company.trim(),
      title: values.title.trim(),
      url: safeUrl(values.url),
      source: values.source,
      status: values.status,
      appliedAt: values.status !== 'wishlist' && !values.appliedAt ? todayStr() : values.appliedAt,
      followUpAt: values.followUpAt,
      lastContact: initial?.lastContact ?? '',
      interviewAt: values.interviewAt,
      interviewLocation: values.interviewLocation.trim(),
      resume: values.resume.trim(),
      note: values.note.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
  }

  return { values, set, setUrl, setSource, applyCakePreview, dirty, toApplication };
}
