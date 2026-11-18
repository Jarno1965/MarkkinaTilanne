import { code as parseTrends } from './parse_trends.js';
import { code as processArticles } from './process_articles.js';
import { code as extractJson } from './extract_json.js';

// Test the Polish market parsing functions

async function testParseTrends() {
  console.log('Testing parse_trends.js...');
  try {
    const result = await parseTrends({});
    console.log('Result:', result);
    console.log('✓ parse_trends.js passed');
  } catch (error) {
    console.error('✗ parse_trends.js failed:', error.message);
  }
}

async function testProcessArticles() {
  console.log('\nTesting process_articles.js...');
  try {
    const result = await processArticles({});
    console.log('Result:', result);
    console.log('✓ process_articles.js passed');
  } catch (error) {
    console.error('✗ process_articles.js failed:', error.message);
  }
}

async function testExtractJson() {
  console.log('\nTesting extract_json.js...');
  try {
    const result = await extractJson({
      raw: '{"events": [{"name": "Test Event", "query": "test market query"}]}'
    });
    console.log('Result:', result);
    console.log('✓ extract_json.js passed');
  } catch (error) {
    console.error('✗ extract_json.js failed:', error.message);
  }
}

// Run all tests
await testParseTrends();
await testProcessArticles();
await testExtractJson();

console.log('\nAll tests completed.');