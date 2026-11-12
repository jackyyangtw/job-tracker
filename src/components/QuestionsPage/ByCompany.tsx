import QuestionList from '@/components/QuestionList';
import { Card } from '@/components/ui/card';
import type { QuestionGroup } from '@/lib/applications/interviewQuestions';
import { AppMeta } from './AppMeta';

/** 「依公司」檢視：每筆投遞一張卡片，列出該次面試被問到的問題。 */
export default function ByCompany({ groups, showAnswers }: { groups: readonly QuestionGroup[]; showAnswers: boolean }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {groups.map(({ app, questions }) => (
        <li key={app.id}>
          <Card className="gap-3 rounded-[10px] p-3.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="text-base font-semibold wrap-anywhere">{app.company}</h2>
              {app.title ? <span className="text-sm text-muted-foreground wrap-anywhere">{app.title}</span> : null}
              <AppMeta app={app} />
            </div>
            <QuestionList questions={questions} showAnswers={showAnswers} />
          </Card>
        </li>
      ))}
    </ul>
  );
}
