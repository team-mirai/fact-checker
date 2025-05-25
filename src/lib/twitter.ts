import { TwitterApi } from "twitter-api-v2";

const haveOAuth1 =
	process.env.X_APP_KEY &&
	process.env.X_APP_SECRET &&
	process.env.X_ACCESS_TOKEN &&
	process.env.X_ACCESS_SECRET;

export const twitter = haveOAuth1
	? /* 1) OAuth1.0a（読み書き両方） */
		new TwitterApi({
			appKey: process.env.X_APP_KEY!,
			appSecret: process.env.X_APP_SECRET!,
			accessToken: process.env.X_ACCESS_TOKEN!,
			accessSecret: process.env.X_ACCESS_SECRET!,
		})
	: /* 2) OAuth2 Bearer（読み取り専用） */
		new TwitterApi(process.env.X_BEARER_TOKEN!);
