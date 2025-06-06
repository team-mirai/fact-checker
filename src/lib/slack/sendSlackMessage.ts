/**
 * Slack へメッセージを送るだけの薄いユーティリティ
 */
import type { KnownBlock } from "@slack/types";
import { slack } from "./client";

interface SlackMessageParams {
  text: string;
  blocks?: KnownBlock[];
}

export async function sendSlackMessage({ text, blocks }: SlackMessageParams) {
  await slack.chat.postMessage({
    channel:
      process.env.SLACK_CHANNEL_ID ??
      (() => {
        throw new Error("SLACK_CHANNEL_ID is not set");
      })(),
    text,
    blocks,
  });
}
