import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { factCheck } from "./lib/fact-check";
import { notifySlack, slackApp } from "./lib/slack";
import { sendSlackMessage } from "./lib/slack/sendSlackMessage";
import { twitter } from "./lib/twitter";
import { buildSearchQuery } from "./lib/twitter_query/query_build";
import { verifyCron } from "./middlewares/verify-cron";

/* ------------------------------------------------------------------ */
/*  Hono ルーティング定義                                             */
/* ------------------------------------------------------------------ */
const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

/* ------------------------------------------------------------------ */
/*  共通: ツイート本文のファクトチェック＆通知処理                    */
/* ------------------------------------------------------------------ */
async function checkAndNotify(tweetText: string, tweetUrl: string) {
  const check = await factCheck(tweetText);

  const label = check.ok ? "✅ OK" : "❌ NG";
  console.log("────────────────────────────────");
  console.log(label);
  console.log("> ", tweetText.replace(/\n/g, " "));
  console.log(check.answer);
  console.log("────────────────────────────────\n");

  if (!check.ok) {
    // NG のときだけ即 Slack 通知
    await notifySlack(check.answer, tweetText, tweetUrl);
    return { notified: true, check };
  }

  // OK の場合はここでは何もしない
  return { notified: false, check };
}

// Slack通知テスト用エンドポイント
// FYI localの動作確認用で一旦設置

app.get("/test/slack", verifyCron, async (c) => {
  try {
    const testTweet = "チームみらいはエンジニアチームを作りません｡";
    const testTweetUrl = "https://x.com/idobata_ai/status/1926171130294939673";

    const { notified, check } = await checkAndNotify(testTweet, testTweetUrl);

    // NG が無かったらここで OK 通知を 1 回だけ送る
    if (!notified) {
      await sendSlackMessage({
        text: "✅ ファクトチェックが必要なツイートはありませんでした",
      });
    }

    return c.json({
      ok: true,
      message: notified
        ? `Slack通知（${check.ok ? "OK" : "NG"}）を送信しました`
        : "ファクトチェックが必要なツイートはありませんでした",
    });
  } catch (error) {
    console.error("テスト通知エラー:", error);
    return c.json({ ok: false, error: String(error) }, 500);
  }
});

/* ------------------------------------------------------------ */
/* 1. cron 用エンドポイント (Vercel / Cloudflare Cron でも OK)  */
/* ------------------------------------------------------------ */
app.get("/cron/fetch", verifyCron, async (c) => {
  const query = buildSearchQuery();

  // Twitter 検索
  const res = await twitter.v2.search(query, { max_results: 30 });

  // ───────────────────────────────────────────
  // 並列でファクトチェック & NG 通知を実行
  // ───────────────────────────────────────────
  const results = await Promise.all(
    (res.tweets ?? []).map((t) => {
      const tweetUrl = `https://x.com/i/web/status/${t.id}`;
      return checkAndNotify(t.text, tweetUrl);
    }),
  );
  const hasNg = results.some((r) => r.notified);

  // NG が 1 件も無かったら OK 通知を 1 回だけ送信
  if (!hasNg) {
    await sendSlackMessage({
      text: "✅ ファクトチェックが必要なツイートはありませんでした",
    });
  }

  return c.json({ ok: true, hasNg });
});

/* ---------------- Slack Events 受信 ---------------- */
app.post("/slack/events", async (c) => {
  try {
    const body = await c.req.json();

    // URL Verification
    if (body.type === "url_verification") {
      return c.json({ challenge: body.challenge });
    }

    // Bolt へは body と ack を渡す
    await slackApp.processEvent({
      body,
      ack: async () => {}, // 即時 ack
    });

    // HTTP レスポンスは単に 200 を返す
    return c.json({});
  } catch (error) {
    console.error("Error handling Slack event:", error);
    return c.json({ error: "Failed to process Slack event" }, 500);
  }
});

app.post("/slack/actions", async (c) => {
  // ① URL-encoded フォームを取得
  const form = await c.req.formData();
  const raw = form.get("payload");

  // payload が無ければ 400
  if (typeof raw !== "string") {
    return c.json({ error: "payload missing" }, 400);
  }

  // ② JSON へ変換
  const payload = JSON.parse(raw);

  // ③ Bolt へ委譲 — ack はレスポンスを返さず Promise<void>
  await slackApp.processEvent({
    body: payload,
    ack: async () => {}, // 型：AckFn => Promise<void>
  });

  // ④ 最後に Hono として 200 OK を返す
  return c.json({});
});

/* 型互換のために一応 export も残しておく */

export default {
  fetch: app.fetch,
  port: Number(process.env.PORT) || 8080,
  hostname: "0.0.0.0",
  idleTimeout: 120,
};
