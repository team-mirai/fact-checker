import { WebClient } from "@slack/web-api";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function notifySlack(diff: string, original: string) {
	await slack.chat.postMessage({
		channel: process.env.SLACK_CHANNEL_ID!,
		text: "⚠️ 可能な誤情報を検出しました",
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "*⚠️ 可能な誤情報を検出しました*\n\n" + diff,
				},
			},
			{
				type: "context",
				elements: [{ type: "mrkdwn", text: `> ${original.slice(0, 180)}…` }],
			},
			{
				type: "actions",
				elements: [
					{
						type: "button",
						text: { type: "plain_text", text: "📝 X にファクトチェックを投稿" },
						action_id: "post_factcheck",
						style: "primary",
						value: JSON.stringify({ diff, original }),
					},
				],
			},
		],
	});
}
