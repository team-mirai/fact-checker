import type { KnownBlock, SectionBlock } from "@slack/types";
import { sendSlackMessage } from "./sendSlackMessage";

const MAX_SLACK_TEXT = 1500;
const MAX_BUTTON_BYTES = 2000;
const encoder = new TextEncoder();

/**
 * UTF‑8 byte‑safe truncate helper.
 * Ensures the resulting string is ≤ maxBytes.
 * If truncated, appends "…".
 */
function truncateByBytes(text: string, maxBytes: number): string {
	if (encoder.encode(text).length <= maxBytes) return text;

	// Binary search for the largest prefix that fits.
	let low = 0;
	let high = text.length;
	while (low < high) {
		const mid = Math.ceil((low + high) / 2);
		const slice = text.slice(0, mid);
		if (encoder.encode(slice).length > maxBytes - 3) {
			high = mid - 1;
		} else {
			low = mid;
		}
	}
	return text.slice(0, low) + "…";
}

/** Simple char‑count truncate (Slack block text limit ≒ 3000) */
function truncate(text: string, max = MAX_SLACK_TEXT): string {
	return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

interface ButtonPayload {
	originalTweet: string;
	factCheckResult: string;
}

/**
 * Build a button payload guaranteed to be ≤ 2 000 bytes.
 * If we still overflow, factCheckResult gets an extra cut.
 */
function buildButtonValue(payload: ButtonPayload): string {
	const rough: ButtonPayload = {
		originalTweet: truncateByBytes(payload.originalTweet, 900),
		factCheckResult: truncateByBytes(payload.factCheckResult, 900),
	};

	let json = JSON.stringify(rough);
	if (encoder.encode(json).length > MAX_BUTTON_BYTES) {
		const head = { originalTweet: rough.originalTweet, factCheckResult: "" };
		const headBytes = encoder.encode(JSON.stringify(head)).length;
		const remain = MAX_BUTTON_BYTES - headBytes - 6; // margin
		rough.factCheckResult = truncateByBytes(rough.factCheckResult, remain);
		json = JSON.stringify(rough);
	}

	return json;
}

/**
 * Send a fact‑check notification to Slack.
 */
export async function notifySlack(
	factCheckResult: string,
	originalTweet: string,
	tweetUrl?: string,
) {
	const isOk = /^OK\b/i.test(factCheckResult);

	// --- block fragments ----------------------------------------------------
	const factCheckSummary = factCheckResult.split("\n")[0];
	const truncatedTweet =
		originalTweet.length > 180
			? originalTweet.slice(0, 180) + "…"
			: originalTweet;
	const detectionTime = new Date().toLocaleString("ja-JP", {
		timeZone: "Asia/Tokyo",
	});

	/** Extract citation inside <details> ... </details> */
	const citationMatch = factCheckResult.match(
		/<details>[\s\S]*?<summary>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/i,
	);
	const citationText = citationMatch
		? citationMatch[1]
				.trim()
				.replace(/\n\s*-\s*\*\*([^*]+)\*\*\s*\n\s*>\s*(.+)/g, "\n• *$1*\n> $2")
		: "";

	// Strip <details> and horizontal rules from body for the "details" section
	const factCheckDetails = factCheckResult
		.replace(/<details>[\s\S]*?<\/details>/gi, "")
		.replace(/---+\s*[\r\n]/g, "")
		.split("\n")
		.slice(1)
		.join("\n")
		.trim();

	// --- blocks -------------------------------------------------------------
	const blocks: KnownBlock[] = [];

	blocks.push({
		type: "header",
		text: {
			type: "plain_text",
			text: isOk
				? "✅ ファクトチェック完了（問題なし）"
				: "🔍 ファクトチェック要請",
		},
	});

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

	blocks.push({
		type: "section",
		text: {
			type: "mrkdwn",
			text: `*ファクトチェック結果:*\n${isOk ? "✅" : "❌"} ${truncate(
				factCheckSummary,
			)}`,
		},
	});

	if (factCheckDetails) {
		blocks.push({
			type: "section",
			text: { type: "mrkdwn", text: truncate(factCheckDetails) },
		});
	}

	if (citationText) {
		blocks.push({
			type: "section",
			text: { type: "mrkdwn", text: "📚 *出典情報* (マニフェスト抜粋)" },
		});

		const firstCitation = citationText.match(/\*\*([^*]+)\*\*\s*>\s*(.+)/m);
		if (firstCitation) {
			blocks.push({
				type: "section",
				text: {
					type: "mrkdwn",
					text: `・*${truncate(firstCitation[1].trim())}*\n> ${truncate(
						firstCitation[2].trim(),
					)}`,
				},
			});
		}
	}

	blocks.push({ type: "divider" });

	if (!isOk) {
		const buttonValue = buildButtonValue({ originalTweet, factCheckResult });
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

	blocks.push({
		type: "context",
		elements: [
			{
				type: "mrkdwn",
				text: `検出時刻: ${detectionTime} | 検索キーワード: チームみらい`,
			},
		],
	});

	await sendSlackMessage({
		text: isOk
			? "✅ ファクトチェック完了（問題なし）"
			: "🔍 ファクトチェック要請 [要確認]",
		blocks,
	});
}
