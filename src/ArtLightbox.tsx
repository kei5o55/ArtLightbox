"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { PointerEvent } from "react";
import { createPortal } from "react-dom";

// SSR時とCSR時で正しいマウント状態を取得するためのフック定義
const emptySubscribe = () => () => {};
const useIsMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,  // クライアント側（ブラウザ）では true
    () => false  // サーバー側（SSR）では false
  );

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const WHEEL_SENSITIVITY = 0.002;
const DRAG_THRESHOLD = 4;       // これ未満の移動はクリックとして扱う（px）
const DOUBLE_CLICK_DELAY = 250; // ダブルクリック判定のため、画像クリックでの閉じる処理を遅らせる（ms）

type View = { scale: number; x: number; y: number };
const INITIAL_VIEW: View = { scale: 1, x: 0, y: 0 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// 拡大後の画像が元の表示領域より内側に入り込まないよう、移動量を制限する
const clampView = (view: View, img: HTMLImageElement): View => {
  const maxX = (img.offsetWidth * (view.scale - 1)) / 2;
  const maxY = (img.offsetHeight * (view.scale - 1)) / 2;
  return {
    scale: view.scale,
    x: clamp(view.x, -maxX, maxX),
    y: clamp(view.y, -maxY, maxY),
  };
};

export type ArtLightboxProps = {
  src: string;
  alt: string;
};

export default function ArtLightbox({ src, alt }: ArtLightboxProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const [dragging, setDragging] = useState(false);
  const isMounted = useIsMounted();

  const overlayRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ id: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const movedRef = useRef(false);
  const closeTimerRef = useRef<number | undefined>(undefined);

  const close = () => {
    window.clearTimeout(closeTimerRef.current);
    setOpen(false);
    setView(INITIAL_VIEW);
  };

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  // ホイールで拡大縮小（カーソル位置を中心に）
  // React の onWheel は passive で preventDefault できないため、ネイティブのリスナーを使う
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const frame = frameRef.current;
      const img = imgRef.current;
      if (!frame || !img) return;

      // 画像は枠の中央に配置されているので、枠の中心を基準にカーソル位置を求める
      const rect = frame.getBoundingClientRect();
      const px = e.clientX - (rect.left + rect.width / 2);
      const py = e.clientY - (rect.top + rect.height / 2);
      const delta = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16 : e.deltaY;

      setView((v) => {
        const scale = clamp(v.scale * Math.exp(-delta * WHEEL_SENSITIVITY), MIN_SCALE, MAX_SCALE);
        const ratio = scale / v.scale;
        return clampView({ scale, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio }, img);
      });
    };

    overlay.addEventListener("wheel", onWheel, { passive: false });
    return () => overlay.removeEventListener("wheel", onWheel);
  }, [open, isMounted]);

  const endDrag = (e: PointerEvent<HTMLImageElement>) => {
    if (dragRef.current?.id !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <>
      {/* 1. サムネイル表示部分（親要素枠にピッタリ収まる） */}
      <div onClick={() => setOpen(true)} className="alb-thumb">
        <img src={src} alt={alt} className="alb-thumb-img" />
      </div>

      {/* 2. モーダル表示部分（createPortal で document.body 直下に展開） */}
      {open && isMounted && createPortal(
        <div ref={overlayRef} onClick={close} className="alb-overlay">
          <div ref={frameRef} className="alb-frame">
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              draggable={false}
              className={[
                "alb-full-img",
                view.scale > 1 && "alb-full-img--zoomed",
                dragging && "alb-full-img--dragging",
              ].filter(Boolean).join(" ")}
              style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                dragRef.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, originX: view.x, originY: view.y };
                movedRef.current = false;
              }}
              onPointerMove={(e) => {
                const drag = dragRef.current;
                if (!drag || drag.id !== e.pointerId) return;
                const dx = e.clientX - drag.startX;
                const dy = e.clientY - drag.startY;
                if (!movedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
                if (!movedRef.current) {
                  movedRef.current = true;
                  setDragging(true);
                }
                const img = e.currentTarget;
                setView((v) => clampView({ ...v, x: drag.originX + dx, y: drag.originY + dy }, img));
              }}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onClick={(e) => {
                e.stopPropagation();
                // ドラッグ後のクリックや、ダブルクリックの2回目では閉じない
                if (movedRef.current || e.detail > 1) return;
                window.clearTimeout(closeTimerRef.current);
                closeTimerRef.current = window.setTimeout(close, DOUBLE_CLICK_DELAY);
              }}
              onDoubleClick={() => {
                window.clearTimeout(closeTimerRef.current);
                setView(INITIAL_VIEW);
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
