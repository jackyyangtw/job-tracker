import { MobileTabBar, TopBar } from './Nav';

/**
 * 確認登入前的畫面。頁首與導覽列和登入後一樣是真的，換成正式畫面時不會跳動；
 * 內容區因為三個頁面版面不同，只放中性的灰塊，延遲約 200ms 才淡入，確認得快就不會閃一下。
 */
export default function ShellSkeleton() {
  return (
    <>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-[18px] max-md:pb-20">
        <TopBar basePath="" />
        <div role="status" className="flex flex-col gap-[18px] animate-in fade-in delay-200 duration-300 fill-mode-backwards">
          <span className="sr-only">載入中…</span>
          <div aria-hidden className="skeleton h-9 rounded-md" />
          <div aria-hidden className="skeleton h-[min(360px,50vh)] rounded-xl" />
        </div>
      </div>
      <MobileTabBar basePath="" />
    </>
  );
}
