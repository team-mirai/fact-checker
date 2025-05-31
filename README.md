# Fact-Checker

このリポジトリは、Twitter/X上の投稿をリアルタイムで監視し、自動的にファクトチェックを行うシステムです。

## 概要

Fact-Checkerは以下の機能を提供します：

- **Twitter/X監視**: 特定の話題に関する投稿を自動的に検索・監視
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

ドキュメントの.mdファイルをpolicy/以下に配置し、以下を実行してください。
```bash
bun run upload
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
--schedule "0 9-21 * * *" \
--time-zone "Asia/Tokyo" \
--http-method GET \
--uri "$SERVICE_URL/cron/fetch" \
--update-headers "X-Cron-Secret=$CRON_SECRET"
```

# ベクターストア自動更新ガイド

ポリシードキュメントが更新された際に、ベクターストアを自動的に更新するための機能です。GitHub Actionsワークフローを使用して、定期的または手動でベクターストアの再構築を行うことができます。

## 1. 必要な環境変数とシークレットを設定する

GitHub リポジトリの Settings > Secrets and variables > Actions で以下を設定してください。

### Repository Variables（変数）
```
POLICY_REPO: ポリシードキュメントリポジトリ名（デフォルト: policy-documents）
POLICY_BRANCH: ポリシーリポジトリのブランチ（デフォルト: main）
POLICY_DIR: ポリシーファイルのディレクトリ（デフォルト: policy）
REBUILD_SCHEDULE: 再構築スケジュール（デフォルト: 0 */6 * * *）
VECTOR_STORE_SECRET: ベクターストアIDのシークレット名（デフォルト: VECTOR_STORE_ID）
VECTOR_STORE_BACKUP_SECRET: バックアップ用シークレット名（デフォルト: VECTOR_STORE_ID-backup）
SLACK_NOTIFICATIONS: Slack通知の有効/無効（true/false）
```

### Repository Secrets（シークレット）
```
OPENAI_API_KEY: OpenAI APIキー
GCLOUD_SERVICE_KEY: Google Cloud サービスアカウントキー（JSON形式）
PROJECT_ID: Google Cloud プロジェクトID
POLICY_REPO_PAT: ポリシーリポジトリアクセス用Personal Access Token（プライベートリポジトリの場合）
SLACK_WEBHOOK_URL: Slack通知用Webhook URL（通知有効時のみ）
```

## 2. Google Cloud Secret Managerを設定する

Google Cloud Consoleで以下のシークレットを作成してください。

```bash
# ベクターストアIDを保存するシークレットを作成
gcloud secrets create VECTOR_STORE_ID --replication-policy="automatic"

# バックアップ用シークレットを作成
gcloud secrets create VECTOR_STORE_ID-backup --replication-policy="automatic"

# サービスアカウントにシークレットへのアクセス権を付与
gcloud secrets add-iam-policy-binding VECTOR_STORE_ID \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding VECTOR_STORE_ID-backup \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 3. 外部からワークフローをトリガーする

GitHub APIを使用して、外部からワークフローを実行できます。

```bash
# GitHub Personal Access Tokenを設定
GH_TOKEN="your_github_token"

# リポジトリディスパッチイベントを送信
curl -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/team-mirai-volunteer/fact-checker/dispatches \
  -d '{"event_type":"embed","client_payload":{"sha":"main"}}'
```

## 4. Secret Managerからベクターストアを取得する

アプリケーションは環境変数`VECTOR_STORE_ID`が設定されていない場合、自動的にGoogle Cloud Secret ManagerからベクターストアIDを取得します。

この機能を使用するには、アプリケーションがGoogle Cloud環境で実行されていることを確認し、適切なIAM権限が設定されていることを確認してください。

```bash
# Google Cloud Run環境変数の設定例
gcloud run deploy x-fact-checker \
--image "$IMAGE" \
--region asia-northeast1 \
--allow-unauthenticated \
--set-env-vars="GOOGLE_CLOUD_PROJECT=your-project-id" \
--service-account="your-service-account@your-project.iam.gserviceaccount.com"
```

## 5. 手動でワークフローを実行する

GitHub Actionsのインターフェースから「Embed-and-Swap」ワークフローを手動で実行することもできます。

1. リポジトリの「Actions」タブを開く
2. 左側のサイドバーから「Embed-and-Swap」を選択
3. 「Run workflow」ボタンをクリック
4. 必要に応じてパラメータを設定し、「Run workflow」をクリック

これにより、最新のポリシードキュメントを使用してベクターストアが更新されます。


