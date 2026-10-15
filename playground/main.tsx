import { createRoot } from "react-dom/client";
import { ArtLightbox } from "../src";
import "../src/styles.css";
// import すると Vite が配信用の URL に変換してくれる
import imageA from "../assets/a.png";
import imageB from "../assets/b.png";
import imageC from "../assets/c.png";

const images = [
  { src: imageA, title: "作品 A", description: "タイトルと説明文を表示する例です。\n説明文は改行もそのまま表示されます。" },
  { src: imageB, title: "作品 B（背景: white）", status: "white" as const },
  { src: imageC, title: "作品 C（背景: black・タイトル非表示）", status: "black" as const, showTitle: false },
];

createRoot(document.getElementById("root")!).render(
  <div style={{ display: "flex", gap: 16, padding: 24 }}>
    {images.map(({ src, title, showTitle, description, status }) => (
      <div key={src} style={{ width: 240, height: 180 }}>
        <ArtLightbox src={src} title={title} showTitle={showTitle} description={description} status={status} />
      </div>
    ))}
  </div>
);
