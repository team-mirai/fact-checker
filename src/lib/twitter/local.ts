import type {
  BaseTwitterProvider,
  PostTweetParams,
  SearchTweetsParams,
  SearchTweetsResult,
} from "./types";

export class LocalTwitterProvider implements BaseTwitterProvider {
  async searchTweets(_params: SearchTweetsParams): Promise<SearchTweetsResult> {
    return { data: [] };
  }

  async postTweet(params: PostTweetParams): Promise<void> {
    console.log("🐦 [LocalTwitter] Post Tweet:");
    console.log("────────────────────────────────");
    console.log("Text:", params.text);
    if (params.quote_tweet_id) {
      console.log("Quote Tweet ID:", params.quote_tweet_id);
    }
    console.log("All Params:", JSON.stringify(params, null, 2));
    console.log("────────────────────────────────\n");
  }
}
