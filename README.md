# WARPDOOR — 時空間3D没入体験

## プロジェクト概要
- **名前**: WARPDOOR (v6.0 — Cinematic 3D Edition)
- **ゴール**: ブラウザだけで「どこでもドア」を体験。ドアを開けると、その時代・世界に本当に「入る」没入型3Dサービス。
- **主な機能**:
  - 3Dドアの開閉演出（観音開き、パーティクル、ワームホール）
  - ワープトンネル演出（数千のストリーキング星）
  - **8つの没入3D世界**（古代ローマ、未来東京2150、江戸、1920年代NY、古代エジプト、中世ヨーロッパ、火星コロニー、アトランティス）
  - **FPS視点の自由歩行**（WASD / タッチジョイスティック / マウスドラッグで視点回転）
  - サウンドスケープ（WebAudioでbgm/環境音を合成）
  - コレクション機能（スタンプ）/ Collector Pass（ペイウォール demo）
  - シェア機能 / スクリーンショット保存
  - 毎日変わる「本日のテーマ」

## URL
- **ローカル開発**: http://localhost:3000
- **サンドボックス**: (GetServiceUrl で取得)
- **本番 (Cloudflare Pages)**: Cloudflare APIキー設定後にデプロイ予定

### 機能エントリURI
| パス | 説明 |
| --- | --- |
| `/` | ランディング + 世界選択 |
| `/?w=<worldId>` | ディープリンク（直接その世界のドアシーンへ） |
| `/api/live-feed` | オンラインユーザー風のフェイクフィード（ソーシャルプルーフ） |
| `/api/daily-theme` | 曜日ごとのテーマ |
| `/api/share-card/:worldId` | OGP用のSVGシェアカード (1200x630) |

### ワールドID（ディープリンク）
- `rome` 古代ローマ
- `tokyo2150` 未来の東京
- `edo` 江戸時代
- `nyc1924` 1920年代 NY
- `egypt` 古代エジプト
- `medieval` 中世ヨーロッパ
- `mars2200` 火星コロニー ⭐ Collector Pass
- `atlantis` アトランティス ⭐ Collector Pass

## データアーキテクチャ
- **データモデル**: クライアントサイドの localStorage のみ
  - `wd_stamps` : `{ [worldId]: 回数 }`
  - `wd_totalWarps` : 合計ワープ数
  - `wd_hasPass` : Collector Pass 所有フラグ
  - `wd_soundEnabled` : サウンドON/OFF
- **ストレージサービス**: なし（完全クライアント動作）
- **データフロー**: ブラウザ → Hono APIs → 静的JSON。3D世界はブラウザ内の Three.js で都度ビルド。

## ユーザーガイド
1. サイトを開くと、ランディングページに世界カードが並んでいます。
2. お好みの時代をクリック、または「🎲 運命の場所へ」でランダムワープ。
3. ドアのシーンでタップ（または Space/Enter）すると、観音開きで扉が開きます。
4. ワープトンネルを通過して、その世界に到着します。
5. **操作**:
   - ドラッグ（デスクトップ）/ ジョイスティック（モバイル）で視点回転
   - WASD または 矢印キーで歩く
   - Shift で走る
   - Q または Escape で帰還
6. 画面下の「◆ もっと発見する」で、その世界の出来事が次々と流れます。
7. 右上のアクションボタンで「シェア」「到着記録 (PNG保存)」「音声切替」「帰還」。

## デプロイ状況
- **プラットフォーム**: Cloudflare Pages（予定）
- **現ステータス**: ✅ サンドボックス上でアクティブ
- **技術スタック**:
  - Frontend: Vanilla JS + **Three.js** (via importmap CDN)
  - Backend: Hono 4.x (Cloudflare Workers / Pages)
  - Fonts: Syne / IBM Plex Mono / Shippori Mincho
  - Build: Vite 6 + @hono/vite-build
- **パフォーマンス**: Worker バンドル 約 30KB / 全アセット < 130KB
- **最終更新**: 2026-04-21

## 開発・運用コマンド
```bash
# ビルド
cd /home/user/webapp && npm run build

# 開発サーバー起動 (port 3000)
pm2 start ecosystem.config.cjs

# ログ確認
pm2 logs warpdoor --nostream

# 停止
fuser -k 3000/tcp

# 本番デプロイ (Cloudflare APIキー設定後)
npm run build
npx wrangler pages deploy dist --project-name warpdoor
```

## 次の開発ステップ
1. **Cloudflare Pages 本番デプロイ**（APIキーが必要 → Deploy タブで設定）
2. ポストプロセス（ブルーム/被写界深度）の追加で映像の深みを出す
3. Three.js の GPU インスタンシング化で建築物を数倍に
4. リアル地図連携（Nominatim API + OSM）で「実在の場所」ワープを追加
5. 実決済（Stripe）を Collector Pass に接続
6. Cloudflare D1 でユーザーのスタンプをクラウド同期
7. Speech Recognition で「古代ローマ行きたい」などの音声ワープ
8. 記憶アルバム（撮影PNGをCloud Storageに保存しタイムライン化）
