import { describe, expect, it } from 'vitest';
import { interviewTimeLabel, splitInterviewPlace } from './interview';

describe('interviewTimeLabel', () => {
  it('顯示月日、星期與時間', () => {
    expect(interviewTimeLabel('2026-11-02T15:00')).toBe('11/02（一）15:00');
    expect(interviewTimeLabel('2026-11-08T09:30')).toBe('11/08（日）09:30');
  });

  it('沒有或格式不對時回傳空字串', () => {
    expect(interviewTimeLabel('')).toBe('');
    expect(interviewTimeLabel('2026-11-02')).toBe('');
  });
});

describe('splitInterviewPlace', () => {
  it('只有地址', () => {
    expect(splitInterviewPlace(' 台北市信義區（範例地址） ')).toEqual({ text: '台北市信義區（範例地址）', url: '', linkLabel: '' });
  });

  it('地址與地圖連結混在一起時拆開', () => {
    expect(splitInterviewPlace('台北市信義區 5F\nhttps://maps.apple/p/abc123')).toEqual({
      text: '台北市信義區 5F',
      url: 'https://maps.apple/p/abc123',
      linkLabel: '地圖',
    });
  });

  it('依網域判斷連結種類', () => {
    expect(splitInterviewPlace('https://maps.app.goo.gl/xyz').linkLabel).toBe('地圖');
    expect(splitInterviewPlace('https://www.google.com/maps/place/x').linkLabel).toBe('地圖');
    expect(splitInterviewPlace('線上面試 https://meet.google.com/abc-defg-hij').linkLabel).toBe('視訊會議');
    expect(splitInterviewPlace('https://us02web.zoom.us/j/123').linkLabel).toBe('視訊會議');
    expect(splitInterviewPlace('https://www.google.com/search?q=x').linkLabel).toBe('連結');
    expect(splitInterviewPlace('https://example.com/room').linkLabel).toBe('連結');
  });

  it('連結結尾的標點不算進網址', () => {
    expect(splitInterviewPlace('會議室（https://meet.google.com/abc）').url).toBe('https://meet.google.com/abc');
  });

  it('不接受 http(s) 以外的連結', () => {
    expect(splitInterviewPlace('javascript:alert(1)')).toEqual({ text: 'javascript:alert(1)', url: '', linkLabel: '' });
  });
});
