import type { KnownBlock, SectionBlock } from "@slack/types";
import { slack } from "./client";
import { sendSlackMessage } from "./sendSlackMessage";

const MAX_SLACK_TEXT = 1500;

function truncate(text: string, max = MAX_SLACK_TEXT) {
	return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

function truncateForButtonValue(obj: {
	originalTweet: string;
	factCheckResult: string;
}) {
	// 各要素を短縮してからJSON化
	return JSON.stringify({
		originalTweet: truncate(obj.originalTweet, 800),
		factCheckResult: truncate(obj.factCheckResult, 800),
	});
}

/**
 * ファクトチェック結果を Slack に送信する
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

	// --- ブロック生成 ---------------------------------------------------------
	const factCheckSummary = factCheckResult.split("\n")[0];

	// <details> 内の出典抽出
	let citationText = "";
	const m = factCheckResult.match(
		/<details>[\s\S]*?<summary>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/i,
	);
	if (m) {
		citationText = m[1]
			.trim()
			.replace(/\n\s*-\s*\*\*([^*]+)\*\*\s*\n\s*>\s*(.+)/g, "\n• *$1*\n> $2");
	}

	// details タグと --- 区切りを除去
	const factCheckDetails = factCheckResult
		.replace(/<details>[\s\S]*?<\/details>/gi, "")
		.replace(/---+\s*[\r\n]/g, "")
		.split("\n")
		.slice(1)
		.join("\n")
		.trim();

	const blocks: KnownBlock[] = [];

	// 1) ヘッダー -------------------------------------------------------------
	blocks.push({
		type: "header",
		text: {
			type: "plain_text",
			text: isOk
				? "✅ ファクトチェック完了（問題なし）"
				: "🔍 ファクトチェック要請",
		},
	});

	// 2) 検証サマリ ----------------------------------------------------------
	blocks.push({
		type: "context",
		elements: [
			{
				type: "mrkdwn",
				text: isOk
					? ":large_green_circle: *検証結果: OK*"
					: ":red_circle: *検証結果: 要確認*",
			},
		],
	});

	// 3) 検出ツイート --------------------------------------------------------
	const tweetSection: SectionBlock = {
		type: "section",
		text: {
			type: "mrkdwn",
			text: `*検出されたツイート:*\n> ${truncate(truncatedTweet)}`,
		},
	};
	if (tweetUrl) {
		tweetSection.accessory = {
			type: "button",
			text: { type: "plain_text", text: "🔗 ツイートを表示" },
			url: tweetUrl,
			action_id: "view_tweet",
		};
	}
	blocks.push(tweetSection);

	// 4) ファクトチェック結果 -------------------------------------------------
	blocks.push({
		type: "section",
		text: {
			type: "mrkdwn",
			text: `*ファクトチェック結果:*\n${isOk ? "✅" : "❌"} ${truncate(factCheckSummary)}`,
		},
	});

	// 5) 詳細情報 ------------------------------------------------------------
	if (factCheckDetails) {
		blocks.push({
			type: "section",
			text: { type: "mrkdwn", text: truncate(factCheckDetails) },
		});
	}

	// 6) 出典情報 ------------------------------------------------------------
	if (citationText) {
		blocks.push({
			type: "section",
			text: { type: "mrkdwn", text: "📚 *出典情報* (マニフェスト抜粋)" },
		});

		const mm = citationText.match(/\*\*([^*]+)\*\*\s*>\s*(.+)/m);
		if (mm) {
			blocks.push({
				type: "section",
				text: {
					type: "mrkdwn",
					text: `・*${truncate(mm[1].trim())}*\n> ${truncate(mm[2].trim())}`,
				},
			});
		}
	}

	// 7) 区切り線 ------------------------------------------------------------
	blocks.push({ type: "divider" });

	// 8) アクション（NG の時だけ） ------------------------------------------
	if (!isOk) {
		const buttonValue = truncateForButtonValue({
			originalTweet,
			factCheckResult,
		});
		blocks.push({
			type: "actions",
			elements: [
				{
					type: "button",
					text: { type: "plain_text", text: "✅ 承認してX投稿" },
					style: "primary",
					action_id: "approve_and_post",
					value: buttonValue,
				},
				{
					type: "button",
					text: { type: "plain_text", text: "📝 編集してX投稿" },
					action_id: "edit_and_post",
					value: buttonValue,
				},
				{
					type: "button",
					text: { type: "plain_text", text: "❌ 却下" },
					style: "danger",
					action_id: "reject",
					value: buttonValue,
				},
			],
		});
	}

	// 9) フッター ------------------------------------------------------------
	blocks.push({
		type: "context",
		elements: [
			{
				type: "mrkdwn",
				text: `検出時刻: ${truncate(detectionTime)} | 検索キーワード: チームみらい`,
			},
		],
	});

	// --- 送信 ---------------------------------------------------------------
	await sendSlackMessage({
		text: isOk
			? "✅ ファクトチェック完了（問題なし）"
			: "🔍 ファクトチェック要請 [要確認]",
		blocks,
	});
}
