import { slackApp } from "./client";
import { twitter } from "../twitter";
//
// ✅ 承認して X 投稿
//
slackApp.action("approve_and_post", async ({ ack, body, client }) => {
	await ack();
	try {
		const action = (body as any).actions?.[0];
		console.log(action.value);
		if (!action) throw new Error("No action found");

		const { originalTweet, factCheckResult } = JSON.parse(
			action.value as string,
		);

		const status = [
			"✅ ファクトチェック結果",
			"",
			originalTweet.length > 200
				? `${originalTweet.slice(0, 200)}…`
				: originalTweet,
			"",
			"—– 誤りの指摘 —–",
			factCheckResult.split("\n")[0],
		].join("\n");

		// await twitter.v2.tweet(status);

		const channel = (body as any).channel?.id || process.env.SLACK_CHANNEL_ID;
		const ts = (body as any).message?.ts;
		if (!channel || !ts) throw new Error("Missing channel or timestamp");

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
	} catch (error) {
		console.error("Error handling approve_and_post:", error);
	}
});

//
// 📝 編集して X 投稿
//
slackApp.action("edit_and_post", async ({ ack, body, client }) => {
	await ack();
	try {
		const channel = (body as any).channel?.id || process.env.SLACK_CHANNEL_ID;
		const ts = (body as any).message?.ts;
		if (!channel || !ts) throw new Error("Missing channel or timestamp");

		await client.chat.update({
			channel,
			ts,
			text: "✏️ 編集機能",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: ":pencil2: 編集機能は現在開発中です。次期アップデートをお待ちください。",
					},
				},
			],
		});
	} catch (error) {
		console.error("Error handling edit_and_post:", error);
	}
});

//
// ❌ 却下
//
slackApp.action("reject", async ({ ack, body, client }) => {
	await ack();
	try {
		const channel = (body as any).channel?.id || process.env.SLACK_CHANNEL_ID;
		const ts = (body as any).message?.ts;
		if (!channel || !ts) throw new Error("Missing channel or timestamp");

		await client.chat.update({
			channel,
			ts,
			text: "❌ 却下されました",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: ":x: このファクトチェック要請は却下されました。",
					},
				},
			],
		});
	} catch (error) {
		console.error("Error handling reject:", error);
	}
});
