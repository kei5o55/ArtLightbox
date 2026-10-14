import { createRoot } from "react-dom/client";
import { ArtLightbox } from "../src";
import "../src/styles.css";

const images = [
  "https://picsum.photos/id/1015/1600/1000",
  "https://picsum.photos/id/1025/1000/1400",
  "https://picsum.photos/id/1043/1600/1000",
];

createRoot(document.getElementById("root")!).render(
  <div style={{ display: "flex", gap: 16, padding: 24 }}>
    {images.map((src, i) => (
      <div key={src} style={{ width: 240, height: 180 }}>
        <ArtLightbox src={src} alt={`sample ${i + 1}`} />
      </div>
    ))}
  </div>
);
