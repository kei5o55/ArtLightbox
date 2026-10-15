import { createRoot } from "react-dom/client";
import { ArtLightbox } from "../src";
import "../src/styles.css";
// import すると Vite が配信用の URL に変換してくれる
import imageA from "../assets/a.png";
import imageB from "../assets/b.png";
import imageC from "../assets/c.png";

const images = [
  { src: imageA, title: "作品 A", description: "タイトルと説明文を表示する例です。\n説明文は改行もそのまま表示されます。" },
  { src: imageB, title: "作品 B" },
  { src: imageC },
];

createRoot(document.getElementById("root")!).render(
  <div style={{ display: "flex", gap: 16, padding: 24 }}>
    {images.map(({ src, title, description }, i) => (
      <div key={src} style={{ width: 240, height: 180 }}>
        <ArtLightbox src={src} alt={title ?? `sample ${i + 1}`} title={title} description={description} />
      </div>
    ))}
  </div>
);
