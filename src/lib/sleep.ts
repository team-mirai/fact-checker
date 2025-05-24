/** 指定 ms 待機 */
export const sleep = (ms: number) =>
	new Promise<void>((r) => setTimeout(r, ms));
