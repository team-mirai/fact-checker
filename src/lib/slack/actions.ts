// src/lib/slack/actions/approve_and_post.ts
import type { BlockAction, ButtonAction } from "@slack/bolt";
import { slackApp } from "./client";
import { twitter } from "../twitter";
import type { ButtonValue } from "../../types";

/* ↓ 追加：ユーティリティ ------------------------------------------ */
const WORD_JOINER = "\u2060"; // U+2060（ゼロ幅ノンブレーク）で自動リンクを阻止

/** 文字列中の README.md → README⁠.md へ変換して URL 解析を回避する */
function preventAutolink(text: string) {
	// 1) README.md → README⁠.md
	let out = text.replace(/README\.md/gi, `README${WORD_JOINER}.md`);

	// 2) http / https URL のドメイン中 '.' に ZWJ を挿入してリンクを無効化
	//    例: https://example.com → https://example⁠.com
	out = out.replace(/\bhttps?:\/\/\S+/gi, (url) =>
		url.replace(/\./g, `.${WORD_JOINER}`),
	);

	return out;
}

/** https://twitter.com/.../status/123 → 123 を抽出する */
function extractTweetId(url: string) {
	const m = url.match(/status\/(\d+)/);
	return m ? m[1] : undefined;
}
/* --------------------------------------------------------------- */

slackApp.action<BlockAction<ButtonAction>>(
	"approve_and_post",
	async ({ ack, action, body, client, logger }) => {
		/* 1. 3 秒以内に ACK */
		await ack();

		/* 2. ボタン value を安全にパース */
		if (!action.value) {
			logger.error("action.value is undefined");
			return;
		}
		let payload: ButtonValue;
		try {
			payload = JSON.parse(action.value);
		} catch (e) {
			logger.error("action.value is not valid JSON", e);
			return;
		}
		console.log(payload);

		/* 3. ツイート文面を組み立て（冒頭行を簡潔に & README.md 対策） */
		const status = [
			"ファクトチェック結果：❌ NG",
			"",
			preventAutolink(payload.factCheckResult),
		].join("\n");

		/* 4. 引用 RT でポスト（URL でなく quote_tweet_id を使う） */
		const quoteId = extractTweetId(payload.originalTweetUrl);
		try {
			await twitter.v2.tweet({
				text: status,
				quote_tweet_id: quoteId,
			});
		} catch (e) {
			logger.error("post tweet failed", e);
		}

		/* 5. Slack メッセージを更新 */
		const channel = body.container?.channel_id;
		const ts = body.container?.message_ts;
		if (!channel || !ts) {
			logger.error("channel_id or message_ts not found in container");
			return;
		}

		/* 5. メッセージを更新 */
		await client.chat.update({
			channel,
			ts,
			text: "✅ 投稿が完了しました",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: ":white_check_mark: X への投稿が完了しました。",
					},
				},
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `*投稿内容:*\n\`\`\`\n${status}\n\`\`\``,
					},
				},
			],
		});
	},
);
