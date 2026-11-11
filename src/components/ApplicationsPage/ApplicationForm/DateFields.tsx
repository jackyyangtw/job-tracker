import DateInput from './DateInput';
import Field from './Field';

interface Props {
  appliedAt: string;
  followUpAt: string;
  onChange: (key: 'appliedAt' | 'followUpAt', value: string) => void;
}

/** 投遞日與下次跟進日。狀態不是「想投」或已經填過時才顯示（由表單決定）。 */
export default function DateFields({ appliedAt, followUpAt, onChange }: Props) {
  return (
    <>
      <Field label="投遞日" id="f-applied">
        <DateInput id="f-applied" name="appliedAt" value={appliedAt} onChange={(e) => onChange('appliedAt', e.target.value)} />
      </Field>
      <Field label="下次跟進日" id="f-follow">
        <DateInput id="f-follow" name="followUpAt" value={followUpAt} onChange={(e) => onChange('followUpAt', e.target.value)} />
      </Field>
    </>
  );
}
