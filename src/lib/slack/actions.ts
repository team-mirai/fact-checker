// src/slack/actions/approve_and_post.ts
import { BlockAction, ButtonAction } from "@slack/bolt";
import { slackApp } from "./client";
import { twitter } from "../twitter"; // ← 今はコメントアウトのまま
import { ButtonValue } from "../../types";

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

		/* 3. 投稿する文面を組み立て */
		const status = [
			"✅ ファクトチェック結果",
			"",
			payload.originalTweet,
			"",
			payload.originalTweetUrl,
			"—– 誤りの指摘 —–",
			payload.factCheckResult,
		].join("\n");

		await twitter.v2.tweet(status);
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
