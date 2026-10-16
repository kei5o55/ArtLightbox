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
const CLOSE_FALLBACK_DELAY = 500; // 閉じるアニメーションの animationend が来ない場合（CSS で無効化された場合など）に備えた保険（ms）

// closed: 非表示 / open: 表示中 / closing: 閉じるアニメーション中（まだ DOM に残す）
type Phase = "closed" | "open" | "closing";

type View = { scale: number; x: number; y: number };
const INITIAL_VIEW: View = { scale: 1, x: 0, y: 0 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// 拡大後の画像が元の表示領域より内側に入り込まないよう、移動量を制限する
const clampView = (view: View, el: HTMLElement): View => {
  const maxX = (el.offsetWidth * (view.scale - 1)) / 2;
  const maxY = (el.offsetHeight * (view.scale - 1)) / 2;
  return {
    scale: view.scale,
    x: clamp(view.x, -maxX, maxX),
    y: clamp(view.y, -maxY, maxY),
  };
};

/** 拡大表示時の背景色。指定しない場合は半透明の黒＋ぼかし */
export type ArtLightboxStatus = "white" | "black";

export type ArtLightboxProps = {
  src: string;
  /** 画像の代替テキスト（alt）。拡大表示時には画像の下にタイトルとしても表示する */
  title: string;
  /** false にすると、拡大表示時にタイトルを表示しない（代替テキストとしては使われる）。既定値は true */
  showTitle?: boolean;
  /** 拡大表示時にタイトルの下に表示する説明文 */
  description?: string;
  /** 拡大表示時の背景色（"white" | "black"） */
  status?: ArtLightboxStatus;
  /** true にすると、拡大表示時に画像の外側に額縁（フレーム）を表示する。既定値は false */
  frame?: boolean;
  /** true にすると、拡大表示時に画像の周りにマット（余白の台紙）を表示する。既定値は false */
  mat?: boolean;
};

export default function ArtLightbox({ src, title, showTitle = true, description, status, frame = false, mat = false }: ArtLightboxProps) {
  const captionTitle = showTitle ? title : undefined;
  const [phase, setPhase] = useState<Phase>("closed");
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const [dragging, setDragging] = useState(false);
  const isMounted = useIsMounted();

  const overlayRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  // 拡大縮小・移動の対象（画像＋マット＋フレームをまとめた要素）
  const artworkRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const movedRef = useRef(false);
  const closeTimerRef = useRef<number | undefined>(undefined);
  const fallbackTimerRef = useRef<number | undefined>(undefined);

  const open = () => {
    window.clearTimeout(fallbackTimerRef.current);
    setPhase("open");
  };

  // 閉じるアニメーションを開始する（DOM からの削除はアニメーション終了後）
  const close = () => {
    window.clearTimeout(closeTimerRef.current);
    window.clearTimeout(fallbackTimerRef.current);
    setPhase((p) => (p === "open" ? "closing" : p));
    fallbackTimerRef.current = window.setTimeout(finishClose, CLOSE_FALLBACK_DELAY);
  };

  // 拡大状態のリセットは、閉じきってから行う（閉じる途中で画像が元のサイズに戻らないように）
  const finishClose = () => {
    window.clearTimeout(fallbackTimerRef.current);
    setPhase((p) => (p === "closing" ? "closed" : p));
    setView(INITIAL_VIEW);
    setDragging(false);
    dragRef.current = null;
  };

  useEffect(() => () => {
    window.clearTimeout(closeTimerRef.current);
    window.clearTimeout(fallbackTimerRef.current);
  }, []);

  const rendered = phase !== "closed";

  // ホイールで拡大縮小（カーソル位置を中心に）
  // React の onWheel は passive で preventDefault できないため、ネイティブのリスナーを使う
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const frame = frameRef.current;
      const artwork = artworkRef.current;
      if (!frame || !artwork) return;

      // 画像は枠の中央に配置されているので、枠の中心を基準にカーソル位置を求める
      const rect = frame.getBoundingClientRect();
      const px = e.clientX - (rect.left + rect.width / 2);
      const py = e.clientY - (rect.top + rect.height / 2);
      const delta = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16 : e.deltaY;

      setView((v) => {
        const scale = clamp(v.scale * Math.exp(-delta * WHEEL_SENSITIVITY), MIN_SCALE, MAX_SCALE);
        const ratio = scale / v.scale;
        return clampView({ scale, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio }, artwork);
      });
    };

    overlay.addEventListener("wheel", onWheel, { passive: false });
    return () => overlay.removeEventListener("wheel", onWheel);
  }, [rendered, isMounted]);

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.id !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <>
      {/* 1. サムネイル表示部分（親要素枠にピッタリ収まる） */}
      <div onClick={open} className="alb-thumb">
        <img src={src} alt={title} className="alb-thumb-img" />
      </div>

      {/* 2. モーダル表示部分（createPortal で document.body 直下に展開） */}
      {rendered && isMounted && createPortal(
        <div
          ref={overlayRef}
          onClick={close}
          onAnimationEnd={(e) => {
            // 子要素のアニメーション終了もバブリングしてくるので、オーバーレイ自身のものだけを見る
            if (phase === "closing" && e.target === e.currentTarget) finishClose();
          }}
          className={[
            "alb-overlay",
            status && `alb-overlay--${status}`,
            phase === "closing" && "alb-overlay--closing",
          ].filter(Boolean).join(" ")}
        >
          <div ref={frameRef} className="alb-frame">
            {/* マットとフレームは画像と一緒に拡大縮小・移動させるため、まとめて transform をかける */}
            <div
              ref={artworkRef}
              className={[
                "alb-artwork",
                mat && "alb-artwork--matted",
                frame && "alb-artwork--framed",
                view.scale > 1 && "alb-artwork--zoomed",
                dragging && "alb-artwork--dragging",
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
                const artwork = e.currentTarget;
                setView((v) => clampView({ ...v, x: drag.originX + dx, y: drag.originY + dy }, artwork));
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
            >
              <img src={src} alt={title} draggable={false} className="alb-full-img" />
            </div>
          </div>
          {(captionTitle || description) && (
            // キャプションのクリックでは閉じない（テキストを選択できるようにする）
            <div className="alb-caption" onClick={(e) => e.stopPropagation()}>
              {captionTitle && <p className="alb-caption-title">{captionTitle}</p>}
              {description && <p className="alb-caption-description">{description}</p>}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
