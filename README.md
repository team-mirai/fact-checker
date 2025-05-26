# Fact-Checker

このリポジトリは、Twitter/X上の投稿をリアルタイムで監視し、自動的にファクトチェックを行うシステムです。

## 概要

Fact-Checkerは以下の機能を提供します：

- **Twitter/X監視**: "チームみらい"や"安野たかひろ"に関する投稿を自動的に検索・監視
- **AI powered ファクトチェック**: OpenAIのGPTモデルとベクターストアを使用して、投稿内容の真偽を判定
- **Slack通知**: 誤った情報が検出された場合、自動的にSlackに通知を送信
- **CLI & Web API**: コマンドラインツールとしても、Webサービスとしても利用可能
- **自動実行**: cronジョブやクラウドスケジューラーによる定期実行に対応

このシステムにより、チームみらいに関する誤情報の拡散を早期に発見し、適切な対応を取ることができます。

---

## セットアップ

To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

# Fact-Check CLI クイックスタートガイド

以下の 4 ステップでセットアップし、ファクトチェックを実行できます。

---

## 1. OpenAI API キーを設定する

プロジェクトルートの `.env` ファイルに API キーを追加してください。
```bash
OPENAI_API_KEY="sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

---

## 2. ドキュメントをベクターストアへアップロードする

```bash
bunx tsx scripts/upload.ts
```

実行後、`config/vectorStore.json` が生成（更新）され、**vector store ID** が出力されます。

---

## 3. vector store ID を `.env` に追加する

```bash
VECTOR_STORE_ID="ここにコピーした ID を貼り付ける"
```

---

## 4. ファクトチェックを実行する

```bash
bun run fact-check "ファクトチェックしたい文章"
```

---

これで準備完了です。楽しいファクトチェックを！ 🎉

# x-fact-check 定期実行ガイド

## 1. 環境変数を設定する

```bash
# --- OpenAI -------------------------------------------------
OPENAI_API_KEY="sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"


# --- X(Twitter) OAuth 1.0a User Context (書き込みが必要な場合) ----
X_APP_KEY=""
X_APP_SECRET=""
X_ACCESS_TOKEN=""
X_ACCESS_SECRET=""

# --- Slack --------------------------------------------------
SLACK_BOT_TOKEN="xoxb-XXXXXXXXXXXX-XXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX"
SLACK_SIGNING_SECRET="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
SLACK_CHANNEL_ID="C01XXXXXXXXX" # 通知を送りたいチャンネル ID

# -----------------------------------------------------------
VECTOR_STORE_ID=""
CRON_SECRET="" # cronの認証シークレット headerに設定する src/middlewares/verify-cron.tsを参照
```

## 2. デプロイする
honoなので各自調整しお好きなところにデプロイしてください。
gcpの例
```bash
gcloud builds submit --tag $IMAGE  
gcloud run deploy x-fact-checker \
--image "$IMAGE" \
--region asia-northeast1 \
--allow-unauthenticated \
--set-secrets="OPENAI_API_KEY=OPENAI_API_KEY:latest,\
X_BEARER_TOKEN=X_BEARER_TOKEN:latest,\
VECTOR_STORE_ID=VECTOR_STORE_ID:latest,\
SLACK_BOT_TOKEN=SLACK_BOT_TOKEN:latest,\
SLACK_SIGNING_SECRET=SLACK_SIGNING_SECRET:latest,\
SLACK_CHANNEL_ID=SLACK_CHANNEL_ID:latest,\
X_APP_KEY=X_APP_KEY:latest,\
X_APP_SECRET=X_APP_SECRET:latest,\
X_ACCESS_TOKEN=X_ACCESS_TOKEN:latest,\
X_ACCESS_SECRET=X_ACCESS_SECRET:latest,\
CRON_SECRET=CRON_SECRET:latest"
```
## 3. 定期実行を設定する
gcpの例
```bash
gcloud scheduler jobs create http cron-fetch-tweets \
--location asia-northeast1 \
--location asia-northeast1 \
--schedule "0 9-21 * * *" \
--time-zone "Asia/Tokyo" \
--http-method GET \
--uri "$SERVICE_URL/cron/fetch" \
--update-headers "X-Cron-Secret=$CRON_SECRET"
```


