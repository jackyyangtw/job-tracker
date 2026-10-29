/**
 * 104 職缺連結（`https://www.104.com.tw/job/{職缺代碼}`）拿掉查詢參數與 # 片段後回傳；其他連結原樣回傳。
 * 104 App 分享的連結帶有追蹤參數（`?jobsource=ios_share`），拿掉之後職缺頁面照樣能開。
 */
export function clean104JobUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    if (/(^|\.)104\.com\.tw$/.test(hostname) && pathname.startsWith('/job/')) return url.split(/[?#]/)[0];
  } catch {
    // 還沒打完的網址：維持原樣。
  }
  return url;
}
