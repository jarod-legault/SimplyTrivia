import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  verifyAllFiles,
  verifyManifest,
  verifyCategoryConsistency,
  verifyQuestionFileConsistency,
} from './json-validation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

const runTests = async () => {
  console.log('Starting JSON validation tests...\n');

  // Test 1: Verify manifest
  console.log('Test 1: Verifying manifest.json...');
  const manifestResult = await verifyManifest();
  console.log('Result:', manifestResult ? 'PASS' : 'FAIL', '\n');

  // Test 2: Verify categories
  console.log('Test 2: Verifying categories.json...');
  const categoriesResult = await verifyCategoryConsistency();
  console.log('Result:', categoriesResult ? 'PASS' : 'FAIL', '\n');

  // Test 3: Verify each category's questions file
  console.log('Test 3: Verifying individual category files...');
  const categories = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'categories.json'), 'utf-8')
  ) as {
    mainCategory: string;
    subcategory: string;
    id: string;
    createdAt: number;
  }[];
  const mainCategories = [...new Set(categories.map((c) => c.mainCategory))];

  for (const mainCategory of mainCategories) {
    console.log(`Checking ${mainCategory}...`);
    const result = await verifyQuestionFileConsistency(mainCategory);
    console.log('Result:', result ? 'PASS' : 'FAIL');
  }
  console.log();

  // Test 4: Verify all files together
  console.log('Test 4: Verifying all files together...');
  const allFilesResult = await verifyAllFiles();
  console.log('Result:', allFilesResult ? 'PASS' : 'FAIL', '\n');

  console.log('All tests completed.');
};

// Run the tests if this is the main module
if (import.meta.url === new URL(import.meta.url).href) {
  runTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { runTests };
