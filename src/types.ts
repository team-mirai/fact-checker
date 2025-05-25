export type ButtonValue = {
	originalTweet: string; // 200 字以内に切り詰めておく
	originalTweetUrl: string;
	factCheckResult: string; // 1 行目だけなら 200 byte も行かない
};
