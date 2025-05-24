# ---- build stage -------------------------------------------------
  FROM oven/bun:1.2 AS builder
  WORKDIR /app
  
  # 1) 依存ファイルを先にコピーしてキャッシュを効かせる
  COPY package.json ./
  # bun.lock がリポジトリにあるなら下行を有効化
   COPY bun.lock ./
  RUN bun install --frozen-lockfile
  
  # 2) ソースをコピーしてビルド
  COPY . .
  RUN bun build src/index.ts \
  --outfile dist/index.js \
  --minify \
  --target bun     # ← or 'node'
  
  # ---- run stage ---------------------------------------------------
  FROM oven/bun:1.2-slim
  WORKDIR /app
  ENV PORT=8080
  
  # 実行に必要なファイルだけコピーして軽量化
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/node_modules ./node_modules
  COPY --from=builder /app/package.json ./
  
  # Cloud Run は 0.0.0.0:8080 をヘルスチェック
  CMD ["bun", "dist/index.js"]
  