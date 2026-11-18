import { code as scrapeMedia } from './scrape_polish_media.js';
import { code as analyzeTrends } from './analyze_polish_trends.js';
import { code as formatReport } from './format_polish_report.js';

// Test the REAL Polish media scraping functions

async function testScrapeMedia() {
  console.log('Testing scrape_polish_media.js (REAL scraping logic)...');
  try {
    const result = await scrapeMedia({});
    console.log('Scraped articles:', JSON.parse(result.articles || '[]').length);
    console.log('Sources:', JSON.parse(result.sources || '[]'));
    console.log('✓ scrape_polish_media.js passed');
    return result;
  } catch (error) {
    console.error('✗ scrape_polish_media.js failed:', error.message);
    return null;
  }
}

async function testAnalyzeTrends(scrapedData) {
  console.log('\nTesting analyze_polish_trends.js...');
  try {
    const result = await analyzeTrends(scrapedData);
    console.log('Main topics:', result.main_topics);
    console.log('Sentiment:', result.polish_sentiment);
    console.log('✓ analyze_polish_trends.js passed');
    return result;
  } catch (error) {
    console.error('✗ analyze_polish_trends.js failed:', error.message);
    return null;
  }
}

async function testFormatReport(analyzedData) {
  console.log('\nTesting format_polish_report.js...');
  try {
    const result = await formatReport(analyzedData);
    console.log('Report title:', result.title);
    console.log('Summary points:', result.summary_points);
    console.log('✓ format_polish_report.js passed');
    return result;
  } catch (error) {
    console.error('✗ format_polish_report.js failed:', error.message);
    return null;
  }
}

// Run all tests
const scraped = await testScrapeMedia();
if (scraped) {
  const analyzed = await testAnalyzeTrends(scraped);
  if (analyzed) {
    await testFormatReport(analyzed);
  }
}

console.log('\nAll REAL Polish media tests completed.');