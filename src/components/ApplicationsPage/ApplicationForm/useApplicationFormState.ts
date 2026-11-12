import { useRef, useState } from 'react';
import { normalizeQuestions } from '@/lib/applications/interviewQuestions';
import { addDays, todayStr } from '@/lib/dates';
import { detectSource, extractUrl, safeUrl } from '@/lib/data/mapping';
import type { CakeJobPreview } from '@/lib/cake-resume/jobPreview';
import type { Prefill } from '@/lib/data/prefill';
import type { Application, InterviewQuestion, Resume, Source, Status } from '@/lib/types';

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
  interviewQuestions: readonly InterviewQuestion[];
  resume: string;
  resumeId: string;
  note: string;
}

type DateKey = 'appliedAt' | 'followUpAt';

/** 新增時兩個日期的預設值：「想投」還沒投出去，所以都留空；其他狀態填今天與一週後。 */
function defaultDates(status: Status): Pick<Values, DateKey> {
  return status === 'wishlist' ? { appliedAt: '', followUpAt: '' } : { appliedAt: todayStr(), followUpAt: addDays(7) };
}

function initialValues(initial: Application | null): Values {
  const status = initial?.status ?? 'applied';
  return {
    company: initial?.company ?? '',
    title: initial?.title ?? '',
    url: initial?.url ?? '',
    source: initial?.source ?? '',
    status,
    ...(initial ? { appliedAt: initial.appliedAt, followUpAt: initial.followUpAt } : defaultDates(status)),
    interviewAt: initial?.interviewAt ?? '',
    interviewLocation: initial?.interviewLocation ?? '',
    interviewQuestions: initial?.interviewQuestions ?? [],
    resume: initial?.resume ?? '',
    resumeId: initial?.resumeId ?? '',
    note: initial?.note ?? '',
  };
}

/**
 * 欄位值、是否有未儲存的修改，以及由欄位組出的最終 Application。
 * `prefill`（從網址參數帶入）只填進欄位、不算進起始值，所以沒儲存就關閉時會詢問是否放棄。
 */
export function useApplicationFormState(initial: Application | null, prefill?: Prefill | null) {
  const [start] = useState(() => initialValues(initial));
  const [values, setValues] = useState(() => (prefill ? { ...start, ...prefill } : start));
  // 手動選過來源之後，貼上網址就不再自動覆蓋它。
  const sourceTouched = useRef(!!initial?.source);
  const datesTouched = useRef(new Set<DateKey>());

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

  /**
   * 選擇履歷版本：名稱跟著版本走（統計依名稱分組）。選「不指定」時兩者都清空；
   * 選回舊紀錄（沒有對應版本、只有文字）時還原成原本的文字。
   */
  function setResume(resume: Resume | null, legacy = false) {
    setValues((v) => ({
      ...v,
      resumeId: resume?.id ?? '',
      resume: resume ? resume.name : legacy ? (initial?.resume ?? '') : '',
    }));
  }

  function setSource(source: Source) {
    sourceTouched.current = true;
    set('source', source);
  }

  /** 手動改過日期之後，切換狀態就不再自動覆蓋它。 */
  function setDate(key: DateKey, value: string) {
    datesTouched.current.add(key);
    set(key, value);
  }

  /**
   * 新增時切換狀態，沒手動改過的日期會跟著換成該狀態的預設值（例如改成「想投」就清空投遞日）。
   * 編輯既有紀錄時只改狀態，不動原本的日期。
   */
  function setStatus(status: Status) {
    setValues((v) => {
      if (initial) return { ...v, status };
      const defaults = defaultDates(status);
      const next = { ...v, status };
      for (const key of ['appliedAt', 'followUpAt'] as const) {
        if (!datesTouched.current.has(key)) next[key] = defaults[key];
      }
      return next;
    });
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
      interviewQuestions: normalizeQuestions(values.interviewQuestions),
      resume: values.resume.trim(),
      resumeId: values.resumeId,
      note: values.note.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
  }

  return { values, set, setUrl, setSource, setStatus, setDate, setResume, applyCakePreview, dirty, toApplication };
}
