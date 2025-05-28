import { describe, test, expect } from "bun:test";
import { buildSearchQuery } from "../lib/twitter_query/query_build";
import { searchKeywords, searchFilters } from "../lib/twitter_query/config";

describe("buildSearchQuery", () => {
	test("デフォルト設定でクエリが正しく構築される", () => {
		const query = buildSearchQuery();

		// 基本的な構造の確認
		expect(query).toContain('("チームみらい"');
		expect(query).toContain("-is:retweet");
		expect(query).toContain("-from:idobata_ai");

		// 特定のキーワードの存在確認
		expect(query).toContain("@team_mirai_jp");
		expect(query).toContain("安野たかひろ");
		expect(query).toContain("平りさこ");
		expect(query).toContain("高山さとし");
		expect(query).toContain("須田えいたろう");
	});

	test("カスタムキーワードとフィルターでクエリが正しく構築される", () => {
		const customKeywords = ["テスト1", "テスト2", "テスト3"];
		const customFilters = ["-is:retweet", "-is:reply"];

		const query = buildSearchQuery(customKeywords, customFilters);

		// カスタムキーワードの確認
		expect(query).toContain('"テスト1"');
		expect(query).toContain('"テスト2"');
		expect(query).toContain('"テスト3"');

		// カスタムフィルターの確認
		expect(query).toContain("-is:retweet");
		expect(query).toContain("-is:reply");

		// デフォルトのフィルターが含まれていないことを確認
		expect(query).not.toContain("-from:idobata_ai");
	});

	test("設定ファイルの値と完全一致するクエリが構築される", () => {
		const query = buildSearchQuery();
		const expectedQuery = `(${searchKeywords.map((keyword) => `"${keyword}"`).join(" OR ")}) ${searchFilters.join(" ")}`;

		expect(query).toBe(expectedQuery);
	});
});
