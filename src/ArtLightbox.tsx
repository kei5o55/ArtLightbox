"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// SSR時とCSR時で正しいマウント状態を取得するためのフック定義
const emptySubscribe = () => () => {};
const useIsMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,  // クライアント側（ブラウザ）では true
    () => false  // サーバー側（SSR）では false
  );

export type ArtLightboxProps = {
  src: string;
  alt: string;
};

export default function ArtLightbox({ src, alt }: ArtLightboxProps) {
  const [open, setOpen] = useState(false);
  const isMounted = useIsMounted();

  return (
    <>
      {/* 1. サムネイル表示部分（親要素枠にピッタリ収まる） */}
      <div onClick={() => setOpen(true)} className="alb-thumb">
        <img src={src} alt={alt} className="alb-thumb-img" />
      </div>

      {/* 2. モーダル表示部分（createPortal で document.body 直下に展開） */}
      {open && isMounted && createPortal(
        <div onClick={() => setOpen(false)} className="alb-overlay">
          <div className="alb-frame">
            <img src={src} alt={alt} className="alb-full-img" />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
