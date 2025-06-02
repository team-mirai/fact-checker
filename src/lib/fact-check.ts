import OpenAI from "openai";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let cachedVectorStoreId: string | null = null;

async function getVectorStoreId(): Promise<string> {
	if (cachedVectorStoreId) {
		return cachedVectorStoreId;
	}

	const envVectorStoreId = process.env.VECTOR_STORE_ID;
	if (envVectorStoreId) {
		console.log("Using VECTOR_STORE_ID from environment variable");
		cachedVectorStoreId = envVectorStoreId;
		return cachedVectorStoreId;
	}

	try {
		const client = new SecretManagerServiceClient();
		const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID;
		
		if (!projectId) {
			throw new Error("PROJECT_ID or GOOGLE_CLOUD_PROJECT environment variable not set");
		}

		const secretName = `projects/${projectId}/secrets/VECTOR_STORE_ID/versions/latest`;
		console.log(`Retrieving vector store ID from Secret Manager: ${secretName}`);
		
		const [version] = await client.accessSecretVersion({ name: secretName });
		const vectorStoreId = version.payload?.data?.toString();
		
		if (!vectorStoreId) {
			throw new Error("Vector store ID is empty in Secret Manager");
		}

		console.log("Successfully retrieved vector store ID from Secret Manager");
		cachedVectorStoreId = vectorStoreId;
		return cachedVectorStoreId;
	} catch (error) {
		console.error("Failed to retrieve vector store ID from Secret Manager:", error);
		throw new Error("VECTOR_STORE_ID not available from environment variable or Secret Manager");
	}
}

export interface CheckResult {
	ok: boolean; // 事実と概ね一致?
	answer: string; // GPT が生成した全文 (OK / NG + 詳細 & 出典)
	citations: string[]; // 出典だけを配列で保持
}

/**
 * ファクトチェック本体
 * @param statement チェック対象文章
 */
export async function factCheck(statement: string): Promise<CheckResult> {
	const vectorStoreId = await getVectorStoreId();
	
	const res = await openai.responses.create({
		model: "o3-mini",
		tools: [{ type: "file_search", vector_store_ids: [vectorStoreId] }],
		include: ["file_search_call.results"],
		input: [
			{
				type: "message",
				role: "system",
				content: `あなたは厳格なファクトチェッカーです。  
以下の手順と書式だけを守り、日本語で簡潔に回答してください。  
（指示にないことは書かないこと）

────────────────────────────────
▼ステップ 0 : 対象判定（事前フィルタ）
  ❶ 入力テキストが「客観的に検証可能な事実命題」か確認せよ。
  ❷ 以下のいずれかに該当する場合はファクトチェック対象外とし、  
      次の書式で即座に終了すること：
        OK
        入力文は○○のためファクトチェック対象外。
      （○○には一行で理由を書く。出典は不要）

  ★ファクトチェック対象外リスト
    ・感想／意見／価値判断／予測／願望／比喩／誇張  
    ・固有名詞そのもの  
      （人名・地名・組織名・商品名・ブランド名 等）  
    ・連絡先や識別情報（URL, メールアドレス, 電話番号, SNS ID 等）  
    ・個人の経歴・肩書・受賞歴など履歴情報  
    ・検証可能な公開データソースが存在しない内容

────────────────────────────────
▼ステップ 1 : 真偽判定（ステップ 0 を通過した場合のみ）
  ❶ データソースで裏付けを取り、最上部に以下いずれかを記載
        OK : データソースと完全一致  
        NG : データソースと矛盾（誤りあり）  
        OK : データ不足で判定不能  

  ❷ 判定根拠を箇条書き（簡潔に）。  
  ❸ 引用箇所（節・ページ・タイムスタンプ等）を箇条書き。  
  ❹ 最後に出典（URL／書誌情報）。

  ★追加ルール
    ・表記揺れ（漢字⇔ひらがな、略称、旧字体など）による  
      固有名詞の差異は誤りとみなさない。  
      ─ 例：「安野貴博」と「安野たかひろ」は同一人物扱い。  
      ─ 誤字脱字のみを指摘する用途ではないことに注意。  
    ・固有名詞の spelling が異なること「だけ」を理由に  
      NG 判定を出さない。内容面の食い違いがある場合のみ NG とする。

────────────────────────────────
▼出力フォーマット例

OK
- 根拠: …  
- 該当箇所: …  
- 出典: …

NG
- 誤り: …  
- 正しい情報: …  
- 出典: …

OK
入力文は主観的感想であり客観的事実ではないため。
────────────────────────────────
        `,
			},
			{
				role: "user",
				content: statement,
			},
		],
	});

	/* ───────── 出典を整形 ───────── */
	const citationBlocks: string[] = [];

	for (const item of res.output ?? []) {
		if (item.type === "file_search_call" && item.results) {
			for (const r of item.results) {
				citationBlocks.push(
					`- **${r.filename ?? r.file_id}**\n  > ${r.text?.trim()}`,
				);
			}
		}
	}

	/* ① まず本文だけをトリムして保持 */
	const body = res.output_text.trim();

	const ng = /^NG/i.test(body);
	const ok = !ng;

	/* ③ 表示用の answer は出典を加えて組み立て */
	const answer = citationBlocks.length
		? `${body}

---

<details>
<summary>📚 出典</summary>

${citationBlocks.join("\n\n")}

</details>`
		: body;

	return { ok, answer, citations: citationBlocks };
}
