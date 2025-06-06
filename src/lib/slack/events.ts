import { factCheck } from "../fact-check";
import { slackApp } from "./client";

/**
 * App にメンションされたテキストをファクトチェックし、同じスレッドに返信する
 */
slackApp.event("app_mention", async ({ event, client }) => {
  // 例: "<@U12345678> ここが実際の本文" → "ここが実際の本文"
  const text = event.text?.replace(/<@[^>]+>\s*/, "").trim() ?? "";
  if (!text) return;

  // ファクトチェック
  const check = await factCheck(text);
  const label = check.ok ? "✅ OK" : "❌ NG";

  // スレッド (thread_ts) があればそこへ、無ければメンションに紐付けて返信
  await client.chat.postMessage({
    channel: event.channel,
    thread_ts: event.thread_ts ?? event.ts,
    text: `${label} ${check.answer}`,
  });
});
