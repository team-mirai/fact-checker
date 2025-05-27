import { App } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { factCheck } from "../fact-check";
export const slack = new WebClient(
	process.env.SLACK_BOT_TOKEN ??
		(() => {
			throw new Error("SLACK_BOT_TOKEN is not set");
		})(),
);

export const slackApp = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// ---------------- app_mention ハンドラ ----------------
slackApp.event("app_mention", async ({ event, client }) => {
	// `<@U12345678> ここが実際の本文…` となっているのでメンション部分を除去
	const rawText = event.text?.replace(/<@[^>]+>\s*/, "").trim() ?? "";
	if (!rawText) return;

	// ファクトチェック
	const check = await factCheck(rawText);
	const label = check.ok ? "✅ OK" : "❌ NG";

	// スレッド (thread_ts) があればそこへ、無ければ新規メッセージ
	await client.chat.postMessage({
		channel: event.channel,
		thread_ts: event.thread_ts ?? event.ts,
		text: `${label} ${check.answer}`,
	});
});
// ------------------------------------------------------
