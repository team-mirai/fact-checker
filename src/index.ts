import { Hono } from 'hono'
import { factCheck } from './lib/fact-check'
// import { notifySlack } from './lib/slack'
import { TwitterApi } from 'twitter-api-v2'
import { verifyCron } from './middlewares/verify-cron'
import { serve } from '@hono/node-server'

/* ------------------------------------------------------------------ */
/*  Hono ルーティング定義                                             */
/* ------------------------------------------------------------------ */
const app = new Hono()

const haveOAuth1 =
  process.env.X_APP_KEY &&
  process.env.X_APP_SECRET &&
  process.env.X_ACCESS_TOKEN &&
  process.env.X_ACCESS_SECRET;

const twitter = haveOAuth1
  /* 1) OAuth1.0a（読み書き両方） */
  ? new TwitterApi({
    appKey: process.env.X_APP_KEY!,
    appSecret: process.env.X_APP_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  })
  /* 2) OAuth2 Bearer（読み取り専用） */
  : new TwitterApi(process.env.X_BEARER_TOKEN!);

app.get('/', (c) => c.text('Hello Hono!'))

// 1. cron 用エンドポイント (Vercel / Cloudflare Cron でも OK)
app.get('/cron/fetch', verifyCron, async (c) => {
  const query =
    '("チームみらい" OR "安野たかひろ") -is:retweet -is:quote -is:reply -"RT @" lang:ja';

  const res = await twitter.v2.search(query, { max_results: 10 });

  for (const tweet of res.tweets ?? []) {
    const check = await factCheck(tweet.text);

    /* ↓ 追加: 判定結果と全文をコンソールに出力 */
    const label = check.ok ? '✅ OK' : '❌ NG';
    console.log('────────────────────────────────');
    console.log(`${label} tweetId=${tweet.id}`);
    console.log('> ', tweet.text.replace(/\n/g, ' '));
    console.log(check.answer);           // ← ここに詳細（全文＋出典）が出る
    console.log('────────────────────────────────\n');

    /* NG だった場合に Slack 通知したいならここで呼ぶ */
    // if (!check.ok) await notifySlack(check, tweet.text);
  }

  return c.json({ ok: true });
})


// // 2. Slack interactive endpoint
// app.post('/slack/actions', verifyRequestSignature(), async (c) => {
//   const payload = JSON.parse(c.req.param('payload') as string)
//   if (payload.type !== 'block_actions') return c.json({})

//   const action = payload.actions[0]
//   if (action.action_id !== 'post_factcheck') return c.json({})

//   const { diff, original } = JSON.parse(action.value)

//   // X へポスト
//   const status = [
//     '✅ ファクトチェック結果',
//     '',
//     original.length > 200 ? original.slice(0, 200) + '…' : original,
//     '',
//     '—– 誤りの指摘 —–',
//     diff,
//   ].join('\n')

//   await twitter.v2.tweet(status)

//   // Slack 上でボタンを更新
//   return c.json({
//     response_action: 'update',
//     blocks: [
//       {
//         type: 'section',
//         text: { type: 'mrkdwn', text: ':white_check_mark: 投稿しました。' },
//       },
//     ],
//   })
// })


/* 型互換のために一応 export も残しておく */


export default {
  fetch: app.fetch,
  port: Number(process.env.PORT) || 8080,
  hostname: '0.0.0.0',
};

if (process.env.NODE_ENV !== 'production') {
  serve({ fetch: app.fetch, port: 8080 })
  console.log('🚀  Hono dev server on http://localhost:8080')
}
