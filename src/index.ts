import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { factCheck } from "./lib/fact-check";
import { notifySlack, slackApp } from "./lib/slack";
import { sendSlackMessage } from "./lib/slack/sendSlackMessage";
import { twitter } from "./lib/twitter";

/* ------------------------------------------------------------------ */
/*  Hono ルーティング定義                                             */
/* ------------------------------------------------------------------ */
const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

/* ------------------------------------------------------------------ */
/*  共通: ツイート本文のファクトチェック＆通知処理                    */
/* ------------------------------------------------------------------ */
async function checkAndNotify(tweetText: string, tweetUrl?: string) {
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

app.get("/test/slack", async (c) => {
	try {
		const testTweet = "チームみらいはエンジニアチームを作りません｡";
		const tweetUrl = "https://twitter.com/i/status/1234567891";

		const { notified, check } = await checkAndNotify(testTweet, tweetUrl);

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
app.get("/cron/fetch", async (c) => {
	const query = '("チームみらい" OR "安野たかひろ") -is:retweet';

	// Twitter 検索
	const res = await twitter.v2.search(query, { max_results: 10 });

	// ───────────────────────────────────────────
	// 並列でファクトチェック & NG 通知を実行
	// ───────────────────────────────────────────
	const results = await Promise.all(
		(res.tweets ?? []).map((t) => checkAndNotify(t.text)),
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

/* 2. Slack interactive endpoint ---------------------------------- */
app.post("/slack/actions", async (c) => {
	try {
		const payload = JSON.parse(c.req.param("payload") as string);
		if (payload.type !== "block_actions") return c.json({});

		await slackApp.processEvent({
			body: payload,
			ack: async () => {}, // interactive も同様に ack
		});
		return c.json({});
	} catch (error) {
		console.error("Error handling Slack action:", error);
		return c.json({ error: "Failed to process action" });
	}
});

/* 型互換のために一応 export も残しておく */

export default {
	fetch: app.fetch,
	port: Number(process.env.PORT) || 8080,
	hostname: "0.0.0.0",
	idleTimeout: 120,
};
