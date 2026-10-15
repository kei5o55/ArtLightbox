import { createRoot } from "react-dom/client";
import { ArtLightbox } from "../src";
import "../src/styles.css";

const images = [
  { src: "https://picsum.photos/id/1015/1600/1000", title: "川の流れる谷", description: "タイトルと説明文を表示する例です。\n説明文は改行もそのまま表示されます。" },
  { src: "https://picsum.photos/id/1025/1000/1400", title: "パグ" },
  { src: "https://picsum.photos/id/1043/1600/1000" },
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
