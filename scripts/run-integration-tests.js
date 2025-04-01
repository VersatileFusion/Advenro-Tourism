#!/usr/bin/env node

/**
 * Script to run integration tests in sequence
 * Ensures proper setup/teardown between test files
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = 3001; // Use a different port for tests

// Directory containing integration tests
const testDir = path.join(__dirname, '..', 'test', 'integration', 'routes');

// Function to run a single test file
function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n\n============================================`);
    console.log(`Running test: ${testFile}`);
    console.log(`============================================\n`);

    const command = `npx mocha ${testFile} --timeout 10000`;
    
    const child = exec(command, { env: process.env });
    
    // Pipe output to console
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    
    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`\n✅ Test passed: ${testFile}`);
        resolve();
      } else {
        console.error(`\n❌ Test failed: ${testFile} with code ${code}`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });
  });
}

// Main function to run all tests
async function runAllTests() {
  try {
    // Get all test files in the directory
    const files = fs.readdirSync(testDir)
      .filter(file => file.endsWith('.test.js'))
      .map(file => path.join(testDir, file));
    
    console.log(`Found ${files.length} test files to run\n`);
    
    // Start with auth tests since many other tests depend on it
    const authTest = files.find(file => file.includes('auth.test.js'));
    const otherTests = files.filter(file => !file.includes('auth.test.js'));
    
    const testFiles = authTest ? [authTest, ...otherTests] : files;
    
    // Run tests in sequence
    let passed = 0;
    let failed = 0;
    const failedTests = [];

    for (const file of testFiles) {
      try {
        await runTest(file);
        passed++;
      } catch (error) {
        failed++;
        failedTests.push(path.basename(file));
        
        // Continue with other tests even if one fails
        console.error(`Continuing with next test...`);
      }
    }
    
    // Print summary
    console.log('\n============================================');
    console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      console.log('\nFailed tests:');
      failedTests.forEach(test => console.log(`- ${test}`));
      process.exit(1);
    } else {
      console.log('\nAll tests passed! 🎉');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run the tests
runAllTests(); 