import { searchKeywords, searchFilters } from "./config";

/**
 * Twitter検索用のクエリを構築する
 * @param keywords 検索キーワードの配列（省略時は設定ファイルの値を使用）
 * @param filters フィルター条件の配列（省略時は設定ファイルの値を使用）
 * @returns 検索クエリ文字列
 */
export function buildSearchQuery(
	keywords: string[] = searchKeywords,
	filters: string[] = searchFilters,
): string {
	// キーワードを OR で結合
	const keywordsQuery = keywords.map((keyword) => `"${keyword}"`).join(" OR ");

	// フィルターをスペースで結合
	const filtersQuery = filters.join(" ");

	// 全体を結合
	return `(${keywordsQuery}) ${filtersQuery}`;
}
