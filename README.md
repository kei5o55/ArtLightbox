# ArtLightbox

アート作品などの画像を、クリックで拡大表示するための React 用ライトボックスコンポーネントです。

- サムネイルは親要素の枠いっぱいに収まります
- クリックすると、背景をぼかしたモーダルで画像全体を表示します
- モーダルはもう一度クリックすると閉じます
- モーダルは `createPortal` で `document.body` の直下に描画するので、親要素の `overflow` や `z-index` の影響を受けません
- SSR に対応しています（Next.js の App Router でも使えます）
- Tailwind CSS がなくても使えます（CSS を同梱しています）

## インストール

```bash
npm install artlightbox
```

`react` と `react-dom` の 18 以上が必要です（peerDependencies）。

## 使い方

```tsx
import { ArtLightbox } from "artlightbox";
import "artlightbox/styles.css";

export default function Gallery() {
  return (
    <div style={{ width: 240, height: 180 }}>
      <ArtLightbox src="/images/artwork.jpg" alt="作品タイトル" />
    </div>
  );
}
```

サムネイルは親要素のサイズいっぱいに表示されます。そのため、親要素には幅と高さを指定してください。

### Props

| Prop | 型 | 必須 | 説明 |
|---|---|---|---|
| `src` | `string` | ✓ | 画像の URL |
| `alt` | `string` | ✓ | 画像の代替テキスト |

### スタイルのカスタマイズ

クラス名にはすべて `alb-` を付けています。上書きしたいときは、自分の CSS で同じクラスを指定してください。

| クラス | 対象 |
|---|---|
| `.alb-thumb` | サムネイルの外枠 |
| `.alb-thumb-img` | サムネイル画像 |
| `.alb-overlay` | モーダルの背景（全画面） |
| `.alb-frame` | モーダル内で画像を配置する枠 |
| `.alb-full-img` | 拡大表示される画像 |

## 開発

```bash
npm install
npm run dev        # playground（Vite）を起動して動作を確認する
npm run build      # dist/ にビルドする
npm run typecheck  # 型チェック
```

### ディレクトリ構成

```
artlightbox/
├── src/
│   ├── ArtLightbox.tsx   コンポーネント本体
│   ├── styles.css        同梱するスタイル
│   └── index.ts          公開するエントリーポイント
├── playground/           動作確認用の Vite アプリ
├── tsup.config.ts        ビルド設定
├── tsconfig.json
└── package.json
```

### ビルドで出力されるもの（`dist/`）

| ファイル | 形式 | 対象 |
|---|---|---|
| `index.js` | ESM | `import` で読み込む場合 |
| `index.cjs` | CommonJS | `require` で読み込む場合 |
| `index.d.ts` / `index.d.cts` | 型定義 | TypeScript で使う場合 |
| `styles.css` | CSS | `artlightbox/styles.css` として読み込む |

## 使用技術

### 実行環境

| 技術 | バージョン | 用途 |
|---|---|---|
| Node.js | v24.18.1 | 開発とビルドの実行環境 |
| npm | 11.16.0 | パッケージ管理 |

### ライブラリ本体

| 技術 | バージョン | 用途 |
|---|---|---|
| React | 19.3.0（利用側の条件は `>=18`） | UI を組み立てる |
| React DOM | 19.3.0（利用側の条件は `>=18`） | `createPortal` でモーダルを表示する |
| TypeScript | 5.9.3 | 型付けと型定義の生成 |
| CSS（素の CSS） | ― | スタイル |

React で使っている主な機能は次のとおりです。

- `useState`：モーダルの開閉状態を持つ
- `useSyncExternalStore`：サーバー側（SSR）とブラウザ側でマウント状態を正しく判定する
- `"use client"`：Next.js の App Router でクライアントコンポーネントとして扱わせる

### ビルドと開発ツール

| 技術 | バージョン | 用途 |
|---|---|---|
| tsup | 8.5.1 | ライブラリのビルド（内部で esbuild を使用） |
| Vite | 8.3.4 | playground の開発サーバー |
| @vitejs/plugin-react | 6.1.2 | Vite で React（JSX）を扱う |
| @types/react, @types/react-dom | 19.3.0 | React の型定義 |

## 注意事項

- **TypeScript は 5.9 系に固定しています。** TypeScript 7 では tsup が型定義（`.d.ts`）を生成できません。TypeScript 6 でも、tsup の内部設定（`baseUrl`）が非推奨エラーになって止まります。
- **tsup は 2025年11月以降リリースがありません。** TypeScript を上げるときは、後継の tsdown への移行を検討してください。
- **ビルドの最後に `"use client";` を付け直しています。** tsup はバンドル時にこの指定を消してしまうためです（`tsup.config.ts` の `banner` で設定）。

## ライセンス

MIT
