import type { KnownBlock, SectionBlock } from "@slack/types";
import type { ButtonValue } from "../../types";
import { sendSlackMessage } from "./sendSlackMessage";

export async function notifySlack(
  factCheckResult: string,
  originalTweet: string,
  tweetUrl: string,
) {
  const tweetSection: SectionBlock = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*ツイート:*\n> ${originalTweet.slice(0, 200)}${originalTweet.length > 200 ? "..." : ""}`,
    },
    accessory: {
      type: "button",
      text: { type: "plain_text", text: "🔗 ツイートを表示" },
      url: tweetUrl, // ← 直接リンク
      action_id: "view_tweet", // 任意の ID
    },
  };
  // シンプルなメッセージブロック
  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🔍 要確認",
      },
    },
    tweetSection,
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${factCheckResult
          .split("\n") // 行単位に分割
          .slice(1, 3) // 先頭 3 行を取得
          .join("\n")}`,
      },
    },
  ];

  // JSONにする前に確実に文字列化
  const buttonData: ButtonValue = {
    originalTweet: originalTweet.slice(0, 500), // 長すぎる場合は切る
    originalTweetUrl: tweetUrl,
    factCheckResult: `${factCheckResult
      .split("\n") // 行単位に分割
      .slice(1, 3) // 先頭 3 行を取得
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
    ],
  });

  await sendSlackMessage({
    text: "🔍 要確認",
    blocks,
  });
}
