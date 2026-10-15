# ArtLightbox

アート作品などの画像を、クリックで拡大表示するための React 用ライトボックスコンポーネントです。

- サムネイルは親要素の枠いっぱいに収まります
- クリックすると、背景をぼかしたモーダルで画像全体を表示します
- 拡大表示中は、ホイールで拡大縮小、ドラッグで表示位置を移動できます
- `title` は画像の代替テキストとして使い、拡大表示時には画像の下にキャプションとしても表示します（`showTitle={false}` で非表示）。`description` を渡すと説明文も表示します
- `status="white"` / `status="black"` で、拡大表示時の背景色を切り替えられます
- モーダルはクリックすると閉じます
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
      <ArtLightbox
        src="/images/artwork.jpg"
        title="作品タイトル"
        description="2024年 / 油彩・キャンバス"
      />
    </div>
  );
}
```

サムネイルは親要素のサイズいっぱいに表示されます。そのため、親要素には幅と高さを指定してください。

### Props

| Prop | 型 | 必須 | 説明 |
|---|---|---|---|
| `src` | `string` | ✓ | 画像の URL |
| `title` | `string` | ✓ | 画像の代替テキストおよび拡大表示時に画像の下に表示するタイトル |
| `showTitle` | `boolean` | | `false` にすると拡大表示時にタイトルを表示しない（代替テキストには使われる）。既定値は `true` |
| `description` | `string` | | タイトルの下に表示する説明文（改行 `\n` はそのまま改行として表示） |
| `status` | `"white" \| "black"` | | 拡大表示時の背景色（下記） |

`showTitle={false}` で `description` も指定しない場合、キャプションは表示されません。

### 背景色（`status`）

| 値 | 背景 |
|---|---|
| 指定なし | 半透明の黒＋背後のページをぼかす |
| `"black"` | ほぼ不透明の黒（作品の色を正しく見せたいとき向け） |
| `"white"` | ほぼ不透明の白（キャプションは黒文字になる） |


### モーダル内の操作

| 操作 | 動作 |
|---|---|
| ホイール | カーソル位置を中心に拡大・縮小（1〜8倍） |
| ドラッグ | 拡大中の表示位置を移動 |
| 画像をダブルクリック | 元のサイズに戻す |
| クリック（ドラッグなし） | 閉じる（キャプション部分のクリックでは閉じない） |

モーダルは、開くときに背景がフェードインしながら画像が少し小さい状態から拡大し、キャプションが下からせり上がって表示されます。閉じるときはフェードアウトしながら少し縮んで消えます。閉じるアニメーションの間は操作を受け付けず、拡大率と表示位置は閉じきってから元に戻ります。

拡大縮小は 180ms のアニメーションで滑らかに変化します。OS で「視差効果を減らす」などの動きを減らす設定をしている場合、拡大縮小のアニメーションは無効になり、開閉はフェードだけになります。

画像のクリックで閉じるときは、ダブルクリックと区別するために 250ms 待ってから閉じます。背景のクリックはすぐに閉じます。

### スタイルのカスタマイズ

クラス名にはすべて `alb-` を付けています。上書きしたいときは、自分の CSS で同じクラスを指定してください。

| クラス | 対象 |
|---|---|
| `.alb-thumb` | サムネイルの外枠 |
| `.alb-thumb-img` | サムネイル画像 |
| `.alb-overlay` | モーダルの背景（全画面） |
| `.alb-overlay--white` / `.alb-overlay--black` | 背景色を指定したモーダル |
| `.alb-overlay--closing` | 閉じるアニメーション中のモーダル |
| `.alb-frame` | モーダル内で画像を配置する枠 |
| `.alb-full-img` | 拡大表示される画像 |
| `.alb-caption` | 画像の下のキャプション（タイトル＋説明文） |
| `.alb-caption-title` | キャプションのタイトル |
| `.alb-caption-description` | キャプションの説明文 |
| `.alb-full-img--zoomed` | 拡大中の画像（カーソルが grab になる） |
| `.alb-full-img--dragging` | ドラッグ中の画像（追従を優先するため transition を無効化） |

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

- `useState`：モーダルの開閉状態と、拡大率・表示位置を持つ
- `useRef` / `useEffect`：ドラッグ状態の保持と、ホイールイベントの登録（`preventDefault` するため `passive: false` のネイティブリスナーを使用）
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
