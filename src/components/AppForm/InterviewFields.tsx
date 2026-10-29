import { Input } from '@/components/ui/input';
import Field from './Field';

interface Props {
  interviewAt: string;
  interviewLocation: string;
  onChange: (key: 'interviewAt' | 'interviewLocation', value: string) => void;
}

/** 面試時間與地點。狀態是「面試中」或已經填過時才顯示（由表單決定）。 */
export default function InterviewFields({ interviewAt, interviewLocation, onChange }: Props) {
  return (
    <>
      <Field label="面試時間" id="f-interview-at">
        <Input
          id="f-interview-at"
          name="interviewAt"
          type="datetime-local"
          value={interviewAt}
          onChange={(e) => onChange('interviewAt', e.target.value)}
        />
      </Field>
      <Field label="面試地點" id="f-interview-location" hint="地址、地圖或視訊會議連結都可以，連結會變成按鈕">
        <Input
          id="f-interview-location"
          name="interviewLocation"
          value={interviewLocation}
          onChange={(e) => onChange('interviewLocation', e.target.value)}
          autoComplete="off"
          maxLength={300}
          placeholder="台北市信義區… 或 https://meet.google.com/…"
          aria-describedby="f-interview-location-hint"
        />
      </Field>
    </>
  );
}
