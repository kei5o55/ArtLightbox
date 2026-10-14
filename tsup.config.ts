import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", styles: "src/styles.css" },
  format: ["esm", "cjs"],
  dts: { entry: "src/index.ts" },
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom"],
  // バンドル時に消える "use client" を先頭に付け直す（Next.js App Router 対応）
  banner: { js: '"use client";' },
});
