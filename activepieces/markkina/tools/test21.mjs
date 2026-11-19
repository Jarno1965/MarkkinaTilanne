// Testi step_21:lle: synteettinen aineisto, joka jaljittelee oikeita syotteita.
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const build = path.dirname(fileURLToPath(import.meta.url));

async function loadCode(jsFile) {
  const src = fs.readFileSync(path.join(build, jsFile), 'utf8');
  const tmp = path.join(build, '_t_' + jsFile);
  fs.writeFileSync(tmp, src, 'utf8');
  const mod = await import(pathToFileURL(tmp).href);
  return { code: mod.code, tmp };
}

const s21 = await loadCode('step21.js');

const GN = 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en';
const GNFI = 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=fi&gl=FI&ceid=FI:fi';
const NASDAQ = 'https://www.nasdaq.com/feed/rssoutbound?category=Markets';
const YLE = 'https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss';

const iso = (hoursAgo) => new Date(Date.now() - hoursAgo * 3600000).toISOString();

const front = [
  { title: 'Anthropic Raises $81 Billion in Biggest IPO Ever - WSJ', link: 'https://news.google.com/rss/articles/AAA1', published_at: iso(0.5), feed_url: GN, feed_title: 'Business - Latest - Google News' },
  { title: 'Anthropic IPO raises over $81 billion in largest offering on record - CNBC', link: 'https://news.google.com/rss/articles/AAA2', published_at: iso(1), feed_url: GN, feed_title: 'Business - Latest - Google News' },
  { title: 'AI giant Anthropic valued at up to $1.5tn ahead of stock market debut - BBC', link: 'https://news.google.com/rss/articles/AAA3', published_at: iso(2), feed_url: GN, feed_title: 'Business - Latest - Google News' },
  { title: 'Anthropic clinches biggest IPO ever with $81 billion offering - Reuters', link: 'https://news.google.com/rss/articles/AAA4', published_at: iso(3), feed_url: GN, feed_title: 'Business - Latest - Google News' },
  { title: 'European Shares Likely To Open On Firm Note Ahead Of Anthropic Debut', link: 'https://www.nasdaq.com/articles/european-shares-open-anthropic', published_at: iso(0.4), feed_url: NASDAQ, feed_title: 'Markets Feed' },
  { title: 'Nvidia Earnings Fail to Soothe AI Investors - WSJ', link: 'https://news.google.com/rss/articles/AAA5', published_at: iso(4), feed_url: GN, feed_title: 'Business - Latest - Google News' },
  { title: 'Fed officials expect more rate hikes, worry about AI impact on inflation - CNBC', link: 'https://news.google.com/rss/articles/AAA6', published_at: iso(5), feed_url: GN, feed_title: 'Business - Latest - Google News' },
  { title: 'Gold Steadies Near 14-Month Low as Fed Signals More Rate Hikes - Bloomberg', link: 'https://news.google.com/rss/articles/AAA7', published_at: iso(6), feed_url: GN, feed_title: 'Business - Latest - Google News' },
  { title: 'Anthropic nostamassa listautumishintaa - Trump Kiinassa - Kauppalehti', link: 'https://news.google.com/rss/articles/AAA8', published_at: iso(2.5), feed_url: GNFI, feed_title: 'Talous - Viimeisin - Google Uutiset' },
  { title: 'Ennatysmaara Ukrainaa tukevia johtajia koolla Berliinissa tanaan', link: 'https://yle.fi/a/74-20256797', published_at: iso(1.5), feed_url: YLE, feed_title: 'Yle Uutiset | Paauutiset' },
  { title: 'Anthropic Raises $81 Billion in Biggest IPO Ever - WSJ', link: 'https://news.google.com/rss/articles/AAA1', published_at: iso(0.5), feed_url: GNFI, feed_title: 'Talous - Viimeisin - Google Uutiset' },
  { title: 'Vanha juttu kolmen paivan takaa - Testilehti', link: 'https://news.google.com/rss/articles/OLD', published_at: iso(72), feed_url: GN, feed_title: 'Business - Latest - Google News' }
];

const quality = [
  { url: 'https://www.wsj.com/finance/stocks/anthropic-sells-more-shares-4b511002', title: 'Anthropic Sells More Shares Than Planned at a Higher Price Than Expected', published_date: iso(8), score: 0.45 },
  { url: 'https://www.bloomberg.com/news/articles/2026-11-18/stock-market-today', title: 'Asian Stocks Set to Fall Ahead of Anthropic Debut: Markets Wrap', published_date: iso(9), score: 0.36 },
  { url: 'https://www.reuters.com/legal/transactional/anthropic-prices-blockbuster-ipo', title: 'Anthropic clinches biggest IPO ever with $81 billion offering', published_date: iso(10), score: 0.07 }
];

const now = new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
const res = await s21.code({ front_items: front, quality_results: quality, quality_answer: 'Anthropic priced at $83 a share.', now: now });

const has = (text, needle) => text.indexOf(needle) >= 0;
const checks = [];
checks.push(['teemalista syntyi', res.prominenceBlock.length > 200]);
checks.push(['tekoaly tai listautumiset karkea', /Tekoäly|Listautumiset/.test(res.prominenceBlock)]);
checks.push(['pisteet mukana', /NÄKYVYYS: (vahva|kohtalainen|heikko)/.test(res.prominenceBlock)]);
checks.push(['valittyminen mukana', has(res.prominenceBlock, 'Välittyminen avaukseen')]);
checks.push(['duplikaatti poistettu (sama otsikko kahdesta syotteesta)', res.itemCount === 12]);
checks.push(['yli 30 h vanha pois', !has(res.prominenceBlock, 'Vanha juttu kolmen')]);
checks.push(['hakukoneen redirect ei linkkina', !has(res.prominenceBlock, 'news.google.com/rss/articles')]);
checks.push(['laatulehden suora linkki mukana', has(res.prominenceBlock, 'https://www.wsj.com/')]);
checks.push(['publisher otsikosta', has(res.prominenceBlock, 'WSJ,')]);
checks.push(['diagnostiikka', /etusivut=12/.test(res.diagnostics)]);

const empty = await s21.code({});
checks.push(['tyhja syote ei kaada', empty.prominenceBlock.indexOf('ei saatu') >= 0]);

const asString = await s21.code({ front_items: JSON.stringify(front), quality_results: JSON.stringify(quality), now: now });
checks.push(['merkkijonona annettu syote', asString.itemCount === res.itemCount]);

let ok = 0;
for (const [name, pass] of checks) {
  console.log((pass ? 'OK   ' : 'VIRHE') + '  ' + name);
  if (pass) { ok++; }
}
console.log('');
console.log('tarkistukset: ' + ok + '/' + checks.length);
console.log('topThemes: ' + res.topThemes);
console.log('diagnostics: ' + res.diagnostics);
console.log('');
console.log('--- prominenceBlock (alku) ---');
console.log(res.prominenceBlock.split('\n').slice(0, 24).join('\n'));

fs.unlinkSync(s21.tmp);
process.exitCode = ok === checks.length ? 0 : 1;
