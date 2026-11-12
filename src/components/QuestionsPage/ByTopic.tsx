import { QuestionItem } from '@/components/QuestionList';
import { Card } from '@/components/ui/card';
import type { TopicGroup } from '@/lib/applications/interviewQuestions';
import { AppMeta } from './AppMeta';

/** 「依題目」檢視：所有題目依分類分組，每題註明是哪一家公司問的，方便針對同類題目複習。 */
export default function ByTopic({ groups, showAnswers }: { groups: readonly TopicGroup[]; showAnswers: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map(({ category, items }) => (
        <Card key={category} className="gap-3 rounded-[10px] p-3.5">
          <h2 className="text-base font-semibold">
            {category}
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">{items.length} 題</span>
          </h2>
          <ol className="m-0 flex list-none flex-col divide-y p-0">
            {items.map(({ question, app }, i) => (
              <QuestionItem
                key={`${app.id}-${i}-${showAnswers}`}
                question={question}
                defaultOpen={showAnswers}
                hideCategory
                meta={
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="wrap-anywhere">
                      {app.company}
                      {app.title ? ` · ${app.title}` : ''}
                    </span>
                    <AppMeta app={app} />
                  </span>
                }
              />
            ))}
          </ol>
        </Card>
      ))}
    </div>
  );
}
