// Testaa company_news.js:ta oikealla datalla ja kirjoittaa tuloksen JSON-tiedostoon.
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(dir, 'company_news.js'), 'utf8');
const tmp = path.join(dir, '_t_company_news.js');
fs.writeFileSync(tmp, src, 'utf8');

const mod = await import(pathToFileURL(tmp).href);
const started = Date.now();
const out = await mod.code({ date: '2026-11-19 18:00:00' });
const ms = Date.now() - started;

fs.writeFileSync(path.join(dir, '_company_news_result.json'), JSON.stringify({ ms, ...out }, null, 2), 'utf8');
console.log('OK ms=' + ms + ' significant=' + out.stats.significant + ' fetched=' + out.stats.fetched);
fs.unlinkSync(tmp);