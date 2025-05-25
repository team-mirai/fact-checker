import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { factCheck } from "./lib/fact-check";
import { notifySlack, slackApp } from "./lib/slack";
import { TwitterApi } from "twitter-api-v2";
import { sendSlackMessage } from "./lib/slack/sendSlackMessage";

/* ------------------------------------------------------------------ */
/*  Hono ルーティング定義                                             */
/* ------------------------------------------------------------------ */
const app = new Hono();

const haveOAuth1 =
	process.env.X_APP_KEY &&
	process.env.X_APP_SECRET &&
	process.env.X_ACCESS_TOKEN &&
	process.env.X_ACCESS_SECRET;

const twitter = haveOAuth1
	? /* 1) OAuth1.0a（読み書き両方） */
		new TwitterApi({
			appKey: process.env.X_APP_KEY!,
			appSecret: process.env.X_APP_SECRET!,
			accessToken: process.env.X_ACCESS_TOKEN!,
			accessSecret: process.env.X_ACCESS_SECRET!,
		})
	: /* 2) OAuth2 Bearer（読み取り専用） */
		new TwitterApi(process.env.X_BEARER_TOKEN!);

app.get("/", (c) => c.text("Hello Hono!"));

// Slack通知テスト用エンドポイント
// FYI localの動作確認用で一旦設置

app.get("/test/slack", async (c) => {
	try {
		const testTweet = "チームみらいはエンジニアチームを作ります。";
		const tweetUrl = "https://twitter.com/i/status/1234567891";
		// ① factCheck だけはきちんと待機
		const check = await factCheck(testTweet);

		// ② 返却用レスポンスを即時生成
		const responseBody = {
			ok: true,
			message: `Slack通知（${check.ok ? "OK" : "NG"}）を送信しました`,
		};

		notifySlack(check.answer, testTweet, tweetUrl);

		// ④ クライアントへ即レスポンス
		return c.json(responseBody);
	} catch (error) {
		console.error("テスト通知エラー:", error);
		return c.json({ ok: false, error: String(error) }, 500);
	}
});

/* ------------------------------------------------------------ */
/* 1. cron 用エンドポイント (Vercel / Cloudflare Cron でも OK)  */
/* ------------------------------------------------------------ */
app.get("/cron/fetch", async (c) => {
	const query =
		'("チームみらい" OR "安野たかひろ") -is:retweet -is:quote -is:reply -"RT @" lang:ja';

	const res = await twitter.v2.search(query, { max_results: 10 });

	/* 👇 追加: NG ツイートが存在したかどうかを記録するフラグ */
	let hasNg = false;

	for (const tweet of res.tweets ?? []) {
		const check = await factCheck(tweet.text);

		/* ↓ 追加: 判定結果と全文をコンソールに出力 */
		const label = check.ok ? "✅ OK" : "❌ NG";
		console.log("────────────────────────────────");
		console.log(`${label} tweetId=${tweet.id}`);
		console.log("> ", tweet.text.replace(/\n/g, " "));
		console.log(check.answer); // ← ここに詳細（全文＋出典）が出る
		console.log("────────────────────────────────\n");

		if (!check.ok) {
			/* NG が出たら Slack へ通知 */
			hasNg = true;
			await notifySlack(check.answer, tweet.text);
		}
	}

	if (!hasNg) {
		// NG が 1 件も無かったときのサマリ通知
		await sendSlackMessage({
			text: "✅ ファクトチェックが必要なツイートはありませんでした",
		});
	}

	return c.json({ ok: true });
});

// 2. Slack interactive endpoint
app.post("/slack/actions", async (c) => {
	try {
		const payload = JSON.parse(c.req.param("payload") as string);
		if (payload.type !== "block_actions") return c.json({});

		// Use the slackApp's processEvent handler to delegate to our action handlers
		await slackApp.processEvent(payload);
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
