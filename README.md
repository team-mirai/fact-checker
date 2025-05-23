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


