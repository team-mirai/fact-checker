import { App } from "@slack/bolt";
import { WebClient } from "@slack/web-api";

// Slack Block Kitの型定義
interface TextObject {
	type: "plain_text" | "mrkdwn";
	text: string;
	emoji?: boolean;
	verbatim?: boolean;
}

interface BlockElement {
	type: string;
	text?: TextObject;
	action_id?: string;
	value?: string;
	style?: "primary" | "danger";
	url?: string;
}

interface Block {
	type: string;
	text?: TextObject;
	elements?: BlockElement[] | TextObject[];
	accessory?: BlockElement;
	block_id?: string;
}

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Bolt app for interactive components
export const slackApp = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
});

/**
 * Send a fact check notification to Slack
 * @param factCheckResult The formatted fact check result
 * @param originalTweet The original tweet text
 * @param tweetUrl Optional URL to the original tweet
 *
 * TODO: メソッドのインターフェース改善検討事項
 * - 生テキストのパースに依存しない構造化データの導入
 * - FactCheckDataのような型付きインターフェースを検討
 */
export async function notifySlack(
	factCheckResult: string,
	originalTweet: string,
	tweetUrl?: string,
) {
	const isOk = /^OK/i.test(factCheckResult);
	const truncatedTweet =
		originalTweet.length > 180
			? `${originalTweet.slice(0, 180)}…`
			: originalTweet;
	const detectionTime = new Date().toLocaleString("ja-JP", {
		timeZone: "Asia/Tokyo",
	});

	// Extract the first line as the summary (NG/OK part)
	const factCheckSummary = factCheckResult.split("\n")[0];

	// Extract citation information from details tag
	let citationText = "";
	const detailsMatch = factCheckResult.match(
		/<details>[\s\S]*?<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/i,
	);

	if (detailsMatch) {
		// 出典情報を抽出
		citationText = detailsMatch[2].trim();
		// MarkdownのリストアイテムをSlack用に整形
		citationText = citationText.replace(
			/\n\s*-\s*\*\*([^*]+)\*\*\s*\n\s*>\s*(.+)/g,
			"\n• *$1*\n> $2",
		);
	}

	// 詳細情報（<details>タグと---区切りを除く）
	// ファクトチェック結果の最初の行を取得し、正規表現でdetailsタグと---区切りを除去
	let cleanResult = factCheckResult
		.replace(/<details>[\s\S]*?<\/details>/gi, "") // detailsタグを削除
		.replace(/---+\s*[\r\n]/g, ""); // ---区切りを削除

	// 最初の行を除く詳細部分を取得
	const factCheckDetails = cleanResult
		.split("\n")
		.slice(1) // 最初の行（NG/OK行）を除く
		.join("\n")
		.trim();

	// メッセージブロックの配列を定義
	const blocks: Block[] = [
		{
			type: "header",
			text: {
				type: "plain_text",
				text: isOk
					? "✅ ファクトチェック完了（問題なし）"
					: "🔍 ファクトチェック要請",
			},
		},
		// ステータスインジケーター（緑/赤の円と検証結果）
		{
			type: "context",
			elements: [
				{
					type: "mrkdwn",
					text: isOk
						? ":large_green_circle: *検証結果: OK*"
						: ":red_circle: *検証結果: 要確認*",
				},
			],
		},
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*検出されたツイート:*\n> ${truncatedTweet}`,
			},
			...(tweetUrl && {
				accessory: {
					type: "button",
					text: { type: "plain_text", text: "🔗 ツイートを表示" },
					url: tweetUrl,
					action_id: "view_tweet",
				},
			}),
		},
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: `*ファクトチェック結果:*\n${
					isOk ? "✅" : "❌"
				} ${factCheckSummary}`,
			},
		},
	];

	// 詳細情報があれば追加
	if (factCheckDetails) {
		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: factCheckDetails,
			},
		});
	}

	// 出典情報があれば追加
	if (citationText) {
		// 出典情報のタイトル
		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: "📚 *出典情報* (マニフェスト抜粋)",
			},
		});

		// manifest.mdの参照部分
		const matches = citationText.match(/\*\*([^*]+)\*\*\s*>\s*(.+)/m);
		if (matches && matches.length >= 3) {
			const sourceFile = matches[1].trim();
			const sourceContent = matches[2].trim();

			blocks.push({
				type: "section",
				text: {
					type: "mrkdwn",
					text: `・*${sourceFile}*\n> ${sourceContent}`,
				},
			});
		}
	}

	// アクションボタン前の区切り線
	blocks.push({ type: "divider" });

	// NGの場合のみアクションボタンを追加
	if (!isOk) {
		blocks.push({
			type: "actions",
			elements: [
				{
					// 承認ボタン - approve_and_postハンドラーで処理
					type: "button",
					text: { type: "plain_text", text: "✅ 承認してX投稿" },
					style: "primary",
					action_id: "approve_and_post",
					value: JSON.stringify({ originalTweet, factCheckResult }),
				},
				{
					// 編集ボタン - edit_and_postハンドラーで処理
					type: "button",
					text: { type: "plain_text", text: "📝 編集してX投稿" },
					action_id: "edit_and_post",
					value: JSON.stringify({ originalTweet, factCheckResult }),
				},
				{
					// 却下ボタン - rejectハンドラーで処理
					type: "button",
					text: { type: "plain_text", text: "❌ 却下" },
					style: "danger",
					action_id: "reject",
					value: JSON.stringify({ originalTweet, factCheckResult }),
				},
			],
		});
	}

	// フッター情報（検出時刻やキーワードなど）
	blocks.push({
		type: "context",
		elements: [
			{
				type: "mrkdwn",
				text: `検出時刻: ${detectionTime} | 検索キーワード: チームみらい`,
			},
		],
	});

	// Send the message
	await slack.chat.postMessage({
		channel: process.env.SLACK_CHANNEL_ID!,
		text: isOk
			? "✅ ファクトチェック完了（問題なし）"
			: "🔍 ファクトチェック要請 [要確認]",
		blocks: blocks,
	});
}

// ボタンクリックハンドラー

// 「✅ 承認してX投稿」ボタンのアクションハンドラー (action_id: approve_and_post)
slackApp.action("approve_and_post", async ({ ack, body, client }) => {
	await ack();

	try {
		// Type assertion for body to access properties safely
		const bBody = body as any;
		const action = bBody.actions && bBody.actions[0];
		if (!action) throw new Error("No action found");

		// Parse the payload data
		const payload = JSON.parse(action.value as string);
		const { originalTweet, factCheckResult } = payload;

		// Format tweet status
		const status = [
			"✅ ファクトチェック結果",
			"",
			originalTweet.length > 200
				? originalTweet.slice(0, 200) + "…"
				: originalTweet,
			"",
			"—– 誤りの指摘 —–",
			factCheckResult.split("\n")[0], // Just use the first line summary
		].join("\n");

		// TODO: X投稿機能の実装
		// 実際の実装では、ここでTwitter/X APIを利用してファクトチェック結果を投稿する
		// 次期プルリクエストで実装予定であり、X API認証情報の設定が必要
		// await twitter.v2.tweet(status);

		// Extract channel and ts with type safety
		const channel = bBody.channel?.id || process.env.SLACK_CHANNEL_ID;
		const ts = bBody.message?.ts;
		if (!channel || !ts) throw new Error("Missing channel or timestamp");

		// Update the message in Slack
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
		console.error("Error handling approve_and_post action:", error);

		// Try to handle error with fallback to channel ID from env
		try {
			const bBody = body as any;
			const channel = bBody.channel?.id || process.env.SLACK_CHANNEL_ID;
			const ts = bBody.message?.ts;

			if (channel && ts) {
				// Update the message with error information
				await client.chat.update({
					channel,
					ts,
					text: "❌ エラーが発生しました",
					blocks: [
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text: ":x: エラーが発生しました。管理者に連絡してください。",
							},
						},
					],
				});
			}
		} catch (err) {
			console.error("Failed to send error message:", err);
		}
	}
});

// 「📝 編集してX投稿」ボタンのアクションハンドラー (action_id: edit_and_post)
slackApp.action("edit_and_post", async ({ ack, body, client }) => {
	await ack();

	try {
		// Type assertion to safely access properties
		const bBody = body as any;
		const channel = bBody.channel?.id || process.env.SLACK_CHANNEL_ID;
		const ts = bBody.message?.ts;
		if (!channel || !ts) throw new Error("Missing channel or timestamp");

		// TODO: モーダルダイアログを使用した編集機能の実装
		// 完全な実装では、以下のステップを追加する必要があります：
		// 1. Slack Modal APIを使用してモーダルダイアログを開く
		//    例: client.views.open({ trigger_id, view: modalView });
		// 2. ユーザーが編集したテキストを保存するハンドラーを実装
		// 3. 編集後のテキストをXに投稿する処理を実装
		//
		// 現時点では開発中のメッセージを表示
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
		console.error("Error handling edit_and_post action:", error);
	}
});

// 「❌ 却下」ボタンのアクションハンドラー (action_id: reject)
slackApp.action("reject", async ({ ack, body, client }) => {
	await ack();

	try {
		// Type assertion to safely access properties
		const bBody = body as any;
		const channel = bBody.channel?.id || process.env.SLACK_CHANNEL_ID;
		const ts = bBody.message?.ts;
		if (!channel || !ts) throw new Error("Missing channel or timestamp");

		// TODO: 状態管理の拡張
		// 将来の拡張案として、却下されたファクトチェックをデータベースに記録し、
		// 同様の誤情報が再度検出された場合に自動判定する仕組みを実装予定
		//
		// 現時点では却下確認メッセージのみを表示
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
		console.error("Error handling reject action:", error);
	}
});
