import { useRef, useState } from 'react';

/** 在這些元素上按下時不平移，保留原本的點擊與拖放（可拖曳的卡片要能拖去換欄） */
const NO_PAN = 'a, button, input, select, textarea, label, [draggable="true"]';

/**
 * 按住滑鼠左右拖曳來橫向捲動容器，給隱藏了橫向捲軸的看板用。
 * 只處理滑鼠：觸控本來就能滑，觸控板可以雙指橫滑。
 * 回傳要接到捲動容器上的 pointer 事件，以及目前是否正在平移（用來換游標、關掉捲動吸附）。
 */
export function useDragPan<T extends HTMLElement>() {
  // 按下時的游標位置與捲動位置；只在事件處理中讀寫
  const start = useRef<{ x: number; left: number } | null>(null);
  const [panning, setPanning] = useState(false);

  function onPointerDown(e: React.PointerEvent<T>) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    // 沒有可以橫向捲的內容（例如手機版的直向排列）就不攔截
    if (e.currentTarget.scrollWidth <= e.currentTarget.clientWidth) return;
    const target = e.target as HTMLElement;
    if (target.closest(NO_PAN)) return;
    // 按在欄位自己的直向捲軸上：交給捲軸
    if (e.nativeEvent.offsetX >= target.clientWidth) return;
    e.preventDefault(); // 避免拖曳時選取文字
    start.current = { x: e.clientX, left: e.currentTarget.scrollLeft };
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanning(true);
  }

  function onPointerMove(e: React.PointerEvent<T>) {
    if (!start.current) return;
    e.currentTarget.scrollLeft = start.current.left - (e.clientX - start.current.x);
  }

  function end() {
    start.current = null;
    setPanning(false);
  }

  return { panning, panHandlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end } };
}
