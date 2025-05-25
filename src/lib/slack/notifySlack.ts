import type { KnownBlock } from "@slack/types";
import { sendSlackMessage } from "./sendSlackMessage";

export async function notifySlack(
	factCheckResult: string,
	originalTweet: string,
) {
	// 入力値を確実に文字列にする
	factCheckResult = String(factCheckResult || "");
	originalTweet = String(originalTweet || "");

	// シンプルなメッセージブロック
	const blocks: KnownBlock[] = [
		{
			type: "header",
			text: {
				type: "plain_text",
				text: "🔍 要確認",
			},
		},
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*ツイート:*\n> ${originalTweet.slice(0, 200)}${originalTweet.length > 200 ? "..." : ""}`,
			},
		},
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*結果:*\n${factCheckResult
					.split("\n") // 行単位に分割
					.slice(0, 3) // 先頭 3 行を取得
					.join("\n")}`,
			},
		},
	];

	// JSONにする前に確実に文字列化
	const buttonData = {
		originalTweet: originalTweet.slice(0, 500), // 長すぎる場合は切る
		factCheckResult: `*結果:*\n${factCheckResult
			.split("\n") // 行単位に分割
			.slice(0, 3) // 先頭 3 行を取得
			.join("\n")}`,
	};

	blocks.push({
		type: "actions",
		elements: [
			{
				type: "button",
				text: { type: "plain_text", text: "✅ 承認してXに投稿" },
				style: "primary",
				action_id: "approve_and_post",
				value: JSON.stringify(buttonData),
			},
			// {
			// 	type: "button",
			// 	text: { type: "plain_text", text: "📝 編集" },
			// 	action_id: "edit_and_post",
			// 	value: JSON.stringify(buttonData),
			// },
			{
				type: "button",
				text: { type: "plain_text", text: "❌ 却下" },
				style: "danger",
				action_id: "reject",
				value: JSON.stringify(buttonData),
			},
		],
	});

	await sendSlackMessage({
		text: "🔍 要確認",
		blocks,
	});
}
