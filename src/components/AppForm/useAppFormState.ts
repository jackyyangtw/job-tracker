import { useRef, useState } from 'react';
import { addDays, todayStr } from '@/lib/dates';
import { detectSource, extractUrl, safeUrl } from '@/lib/mapping';
import type { Application, Source, Status } from '@/lib/types';

interface Values {
  company: string;
  title: string;
  url: string;
  source: Source;
  status: Status;
  appliedAt: string;
  followUpAt: string;
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
    resume: initial?.resume ?? '',
    note: initial?.note ?? '',
  };
}

/** Field values, dirty tracking and the final Application built from them. */
export function useAppFormState(initial: Application | null) {
  const [start] = useState(() => initialValues(initial));
  const [values, setValues] = useState(start);
  // Once a source is picked by hand, pasting a URL no longer overrides it.
  const sourceTouched = useRef(!!initial?.source);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  function setUrl(raw: string) {
    // Pasting a whole share message is fine: only the link in it is kept.
    const url = extractUrl(raw);
    const detected = detectSource(url);
    setValues((v) => ({ ...v, url, source: detected && !sourceTouched.current ? detected : v.source }));
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
      resume: values.resume.trim(),
      note: values.note.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
  }

  return { values, set, setUrl, setSource, dirty, toApplication };
}
