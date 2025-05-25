// src/slack/actions/approve_and_post.ts
import { BlockAction, ButtonAction } from "@slack/bolt";
import { slackApp } from "./client";
import { twitter } from "../twitter"; // ← 今はコメントアウトのまま

// ボタンに詰め込む JSON は 2 000 byte 以下という Slack の制限がある
// https://docs.slack.dev/reference/block-kit/block-elements/button-element
type ButtonValue = {
	original: string; // 200 字以内に切り詰めておく
	fact: string; // 1 行目だけなら 200 byte も行かない
};

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

		/* 3. 投稿する文面を組み立て */
		const status = [
			"✅ ファクトチェック結果",
			"",
			payload.original,
			"",
			"—– 誤りの指摘 —–",
			payload.fact,
		].join("\n");

		// await twitter.v2.tweet(status);

		/* 4. 更新対象メッセージの特定
			 Block Action のペイロードでは channel/ts は
			 body.container.channel_id / body.container.message_ts に入る */
		// 例ペイロード: https://github.com/slackapi/java-slack-sdk/issues/1200#issuecomment-1683304512
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
