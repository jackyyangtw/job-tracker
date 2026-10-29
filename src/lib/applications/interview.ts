import { parseD } from '../dates';
import { safeUrl } from '../data/mapping';

const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六'];

/** `2026-11-02T15:00` -> `11/02（一）15:00`；不是這個格式時回傳 ''。 */
export function interviewTimeLabel(at: string): string {
  const m = at.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/);
  if (!m) return '';
  const day = WEEKDAY[parseD(`${m[1]}-${m[2]}-${m[3]}`).getDay()];
  return `${m[2]}/${m[3]}（${day}）${m[4]}`;
}

export interface InterviewPlace {
  /** 去掉連結後的文字（地址、樓層、「線上面試」等）。 */
  text: string;
  /** 第一個 http(s) 連結；沒有時是 ''。 */
  url: string;
  /** 連結按鈕的文字：地圖、視訊會議或連結。 */
  linkLabel: string;
}

const MEETING_HOST_RE = /(^|\.)(meet\.google\.com|zoom\.us|teams\.microsoft\.com|teams\.live\.com|webex\.com)$/;
// Apple 地圖分享（maps.apple、maps.apple.com）、Google 地圖短網址（maps.app.goo.gl）與 maps.google.*
const MAP_HOST_RE = /^(maps\.apple(\.com)?|maps\.app\.goo\.gl|maps\.google\.[a-z.]+)$/;

function linkLabelOf(url: string): string {
  const { hostname, pathname } = new URL(url);
  if (MEETING_HOST_RE.test(hostname)) return '視訊會議';
  // www.google.com/maps/… 也是 Google 地圖
  if (MAP_HOST_RE.test(hostname) || (/(^|\.)google\.[a-z.]+$/.test(hostname) && pathname.startsWith('/maps'))) return '地圖';
  return '連結';
}

/** 把面試地點拆成文字與連結，讓卡片可以顯示地址並把連結做成按鈕。只接受 http(s) 連結。 */
export function splitInterviewPlace(location: string): InterviewPlace {
  const m = location.match(/https?:\/\/[!-~]+/i);
  const url = m ? safeUrl(m[0].replace(/[.,;:!?)\]}'"]+$/, '')) : '';
  const text = (m ? location.replace(m[0], ' ') : location).replace(/\s+/g, ' ').trim();
  return { text, url, linkLabel: url ? linkLabelOf(url) : '' };
}
