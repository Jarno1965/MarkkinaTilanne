import { code as parseMedia } from './parse_polish_media.js';
import { code as translateMedia } from './translate_to_finnish.js';
import { code as summarizeMedia } from './summarize_polish_media.js';

// Test the Polish media parsing functions

async function testParseMedia() {
  console.log('Testing parse_polish_media.js...');
  try {
    const result = await parseMedia({});
    console.log('Result:', result);
    console.log('✓ parse_polish_media.js passed');
  } catch (error) {
    console.error('✗ parse_polish_media.js failed:', error.message);
  }
}

async function testTranslateMedia() {
  console.log('\nTesting translate_to_finnish.js...');
  try {
    const result = await translateMedia({
      articles: '[{"title": "Polish Story", "content": "Polish content"}]'
    });
    console.log('Result:', result);
    console.log('✓ translate_to_finnish.js passed');
  } catch (error) {
    console.error('✗ translate_to_finnish.js failed:', error.message);
  }
}

async function testSummarizeMedia() {
  console.log('\nTesting summarize_polish_media.js...');
  try {
    const result = await summarizeMedia({
      raw: '{"articles": [{"title": "Suomennettu juttu", "content": "Suomennettu sisältö"}]}'
    });
    console.log('Result:', result);
    console.log('✓ summarize_polish_media.js passed');
  } catch (error) {
    console.error('✗ summarize_polish_media.js failed:', error.message);
  }
}

// Run all tests
await testParseMedia();
await testTranslateMedia();
await testSummarizeMedia();

console.log('\nAll media tests completed.');