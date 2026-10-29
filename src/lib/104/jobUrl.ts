/** 是不是 104 的網域（`104.com.tw` 與其子網域，例如 www、m）。 */
export const is104Host = (hostname: string) => /(^|\.)104\.com\.tw$/i.test(hostname);

/**
 * 104 職缺連結（`https://www.104.com.tw/job/{職缺代碼}`）拿掉查詢參數與 # 片段後回傳；其他連結原樣回傳。
 * 104 App 分享出來的是一段說明文字加連結，例如
 * 「我在104工作快找上發現了一個超適合你的內容…（換行）https://www.104.com.tw/job/8wgp3?jobsource=ios_share」，
 * 連結帶有追蹤參數（`?jobsource=ios_share`），拿掉之後職缺頁面照樣能開。
 */
export function clean104JobUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    if (is104Host(hostname) && pathname.startsWith('/job/')) return url.split(/[?#]/)[0];
  } catch {
    // 還沒打完的網址：維持原樣。
  }
  return url;
}
