import { Hono } from 'hono'
import { factCheck } from './lib/fact-check'
import { notifySlack, slackApp } from './lib/slack'
import { TwitterApi } from 'twitter-api-v2'
// import { verifyRequestSignature } from 'hono-slack-verify'

/* ------------------------------------------------------------------ */
/*  Hono ルーティング定義                                             */
/* ------------------------------------------------------------------ */
const app = new Hono()

const haveOAuth1 =
  process.env.X_APP_KEY &&
  process.env.X_APP_SECRET &&
  process.env.X_ACCESS_TOKEN &&
  process.env.X_ACCESS_SECRET

const twitter = haveOAuth1
  ? /* 1) OAuth1.0a（読み書き両方） */
    new TwitterApi({
      appKey: process.env.X_APP_KEY!,
      appSecret: process.env.X_APP_SECRET!,
      accessToken: process.env.X_ACCESS_TOKEN!,
      accessSecret: process.env.X_ACCESS_SECRET!,
    })
  : /* 2) OAuth2 Bearer（読み取り専用） */
    new TwitterApi(process.env.X_BEARER_TOKEN!)

app.get('/', (c) => c.text('Hello Hono!'))

// // Slack通知テスト用エンドポイント
//
// localの動作確認用で一旦設置
//
// app.get('/test/slack', async (c) => {
//   try {
//     const type = c.req.query('type') || 'ng';

//     if (type === 'ok') {
//       // OK（成功）ケースのテスト
//       const testTweet = 'チームみらいはデジタル母子パスポートを提案しており、子育て支援の切れ目ないサポートを目指しています。';
//       const testResult = 'OK - マニフェストに記載されている内容と一致しています。デジタル母子パスポートによる子育て支援は、政策の重要な柱の一つです。\n\n---\n\n<details>\n<summary>📚 出典</summary>\n\n- **manifest.md**\n  > デジタル母子パスポートの推進 - 出産から子育てまで切れ目なくサポートするためのデジタル化を推進します\n\n</details>';

//       await notifySlack(testResult, testTweet, 'https://twitter.com/i/status/1234567891');
//       return c.json({ ok: true, message: 'Slack通知（OK）を送信しました' });
//     } else {
//       // NG（失敗）ケースのテスト（デフォルト）
//       const testTweet = 'チームみらいの政策では、教育予算をGDP比5%まで引き上げると発表しています。これは世界最高水準の投資です。';
//       const testResult = 'NG - マニフェストには「対GDP費をOECD平均より上げる」との記載はありますが、「GDP比5%」という具体的な数値は記載されていません。現在の日本の教育費はGDP比約3.2%で、OECD平均は約4.9%です。\n\n---\n\n<details>\n<summary>📚 出典</summary>\n\n- **manifest.md**\n  > 教育に投資する。現状、国家が投入する教育費は、対GDP費だとOECD平均より低いが、これを世界水準にする\n\n</details>';

//       await notifySlack(testResult, testTweet, 'https://twitter.com/i/status/1234567890');
//       return c.json({ ok: true, message: 'Slack通知（NG）を送信しました' });
//     }
//   } catch (error) {
//     console.error('テスト通知エラー:', error);
//     return c.json({ ok: false, error: String(error) }, 500);
//   }
// })

// 1. cron 用エンドポイント (Vercel / Cloudflare Cron でも OK)
app.get('/cron/fetch', async (c) => {
  // keyword で最近 50 件取得
  const res = await twitter.v2.search('チームみらい', { max_results: 10 })
  console.log(res.tweets)
  // res.data は 1 ページぶんだけ
  for (const tweet of res.tweets ?? []) {
    const check = await factCheck(tweet.text)
    if (!check.ok) {
      await notifySlack(
        check.answer,
        tweet.text,
        `https://twitter.com/i/status/${tweet.id}`
      )
    }
  }
  return c.json({ ok: true })
})

// 2. Slack interactive endpoint
app.post('/slack/actions', async (c) => {
  try {
    const payload = JSON.parse(c.req.param('payload') as string)
    if (payload.type !== 'block_actions') return c.json({})

    // Use the slackApp's processEvent handler to delegate to our action handlers
    await slackApp.processEvent(payload)
    return c.json({})
  } catch (error) {
    console.error('Error handling Slack action:', error)
    return c.json({ error: 'Failed to process action' })
  }
})

/* 型互換のために一応 export も残しておく */
export default app
