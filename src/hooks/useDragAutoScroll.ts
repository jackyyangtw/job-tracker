import { useEffect, useRef, useState } from 'react';

/** 拖曳時游標離容器左右邊緣多近就開始自動捲動（px） */
const EDGE = 96;
/** 游標貼齊邊緣時每一幀捲動的距離（px），約每秒 600px */
const MAX_STEP = 10;

/**
 * 拖曳 `dragType` 的項目到捲動容器左右邊緣時自動橫向捲動，越靠近邊緣捲越快。
 * 不直接在 dragover 裡捲：Safari 游標停住時不一定會持續觸發 dragover，
 * 所以 dragover 只記下游標位置，實際捲動交給 requestAnimationFrame 迴圈，放開或拖出容器才停。
 * `dragging` 在整段拖曳期間為 true，用來關掉捲動吸附（Safari 的 dragleave 沒有 relatedTarget，
 * 不能靠欄位的放置提示判斷是否還在拖曳）。
 */
export function useDragAutoScroll<T extends HTMLElement>(dragType: string) {
  const el = useRef<T | null>(null);
  const pointerX = useRef(0);
  const frame = useRef(0);
  const [dragging, setDragging] = useState(false);

  function step() {
    const node = el.current;
    if (!node) return;
    const { left, right } = node.getBoundingClientRect();
    const edge = Math.min(EDGE, node.clientWidth / 4);
    const x = pointerX.current;
    const depth = x < left + edge ? x - (left + edge) : x > right - edge ? x - (right - edge) : 0;
    if (depth) node.scrollLeft += (depth / edge) * MAX_STEP;
    frame.current = requestAnimationFrame(step);
  }

  function stop() {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    el.current = null;
    setDragging(false);
  }

  function onDragOver(e: React.DragEvent<T>) {
    if (!e.dataTransfer.types.includes(dragType)) return;
    const node = e.currentTarget;
    if (node.scrollWidth <= node.clientWidth) return;
    pointerX.current = e.clientX;
    if (frame.current) return;
    el.current = node;
    frame.current = requestAnimationFrame(step);
    setDragging(true);
  }

  function onDragLeave(e: React.DragEvent<T>) {
    // 移到容器內的子元素也會觸發 dragleave；Safari 沒有 relatedTarget，改用游標位置判斷是否真的離開
    const { left, right, top, bottom } = e.currentTarget.getBoundingClientRect();
    const inside = e.clientX > left && e.clientX < right && e.clientY > top && e.clientY < bottom;
    if (!inside) stop();
  }

  // 拖曳中元件被卸載（例如切換檢視）時停掉迴圈
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return { dragging, autoScrollHandlers: { onDragOver, onDragLeave, onDrop: stop, onDragEnd: stop } };
}
