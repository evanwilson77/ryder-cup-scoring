#!/usr/bin/env node

/**
 * Test Runner Script
 * Runs tests and generates a readable report for humans and AI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Ryder Cup Scoring App - Test Suite Runner\n');
console.log('='.repeat(60));
console.log('\n');

// Configuration
const reportFile = 'test-report.txt';
const jsonFile = 'test-results.json';

try {
  console.log('Running tests with coverage...\n');

  // Run tests with coverage
  const output = execSync(
    'npm test -- --coverage --watchAll=false --verbose --json --outputFile=' + jsonFile,
    {
      encoding: 'utf-8',
      stdio: 'pipe'
    }
  );

  console.log(output);

  // Read the JSON results
  let results = {};
  if (fs.existsSync(jsonFile)) {
    results = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  }

  // Generate human-readable report
  generateReport(output, results);

  console.log('\n✅ All tests passed!\n');
  console.log(`📊 Report saved to: ${reportFile}`);
  console.log(`📄 JSON results saved to: ${jsonFile}`);

} catch (error) {
  console.error('\n❌ Tests failed!\n');

  // Try to read partial results
  if (fs.existsSync(jsonFile)) {
    const results = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    generateReport(error.stdout?.toString() || '', results);
  }

  console.error(error.stdout?.toString() || error.message);
  process.exit(1);
}

function generateReport(output, results) {
  const report = [];
  const timestamp = new Date().toISOString();

  report.push('='.repeat(80));
  report.push('RYDER CUP SCORING APP - TEST REPORT');
  report.push('='.repeat(80));
  report.push('');
  report.push(`Generated: ${timestamp}`);
  report.push('');

  // Summary
  report.push('SUMMARY');
  report.push('-'.repeat(80));

  if (results.success) {
    report.push('✅ Status: ALL TESTS PASSED');
  } else {
    report.push('❌ Status: SOME TESTS FAILED');
  }

  if (results.numTotalTests) {
    report.push(`Total Tests: ${results.numTotalTests}`);
    report.push(`  ✅ Passed: ${results.numPassedTests || 0}`);
    report.push(`  ❌ Failed: ${results.numFailedTests || 0}`);
    report.push(`  ⏭️  Skipped: ${results.numPendingTests || 0}`);
  }

  report.push('');

  // Coverage summary
  report.push('CODE COVERAGE');
  report.push('-'.repeat(80));

  const coveragePath = path.join(__dirname, 'coverage', 'coverage-summary.json');
  if (fs.existsSync(coveragePath)) {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
    const total = coverage.total;

    if (total) {
      report.push(`Statements:   ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);
      report.push(`Branches:     ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
      report.push(`Functions:    ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
      report.push(`Lines:        ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`);

      report.push('');

      // Coverage by file
      report.push('Coverage by File:');
      Object.entries(coverage).forEach(([file, data]) => {
        if (file !== 'total' && data.statements) {
          const filename = path.basename(file);
          const pct = data.statements.pct;
          const indicator = pct >= 80 ? '✅' : pct >= 60 ? '⚠️' : '❌';
          report.push(`  ${indicator} ${filename.padEnd(40)} ${pct}%`);
        }
      });
    }
  } else {
    report.push('Coverage data not available');
  }

  report.push('');

  // Test suites
  report.push('TEST SUITES');
  report.push('-'.repeat(80));

  if (results.testResults) {
    results.testResults.forEach(suite => {
      const suiteName = path.basename(suite.name);
      const status = suite.status === 'passed' ? '✅' : '❌';
      report.push(`${status} ${suiteName}`);

      if (suite.assertionResults) {
        suite.assertionResults.forEach(test => {
          const testStatus = test.status === 'passed' ? '  ✅' : '  ❌';
          report.push(`  ${testStatus} ${test.title}`);

          if (test.status === 'failed' && test.failureMessages) {
            test.failureMessages.forEach(msg => {
              report.push(`      ${msg.split('\n')[0]}`);
            });
          }
        });
      }

      report.push('');
    });
  }

  // Recommendations
  report.push('RECOMMENDATIONS');
  report.push('-'.repeat(80));

  if (results.success) {
    report.push('✅ All tests passing - great job!');
    report.push('');
    report.push('Next steps:');
    report.push('  1. Review coverage report for gaps');
    report.push('  2. Consider adding integration tests');
    report.push('  3. Add tests for new features before implementation');
  } else {
    report.push('❌ Some tests are failing. Here\'s what to do:');
    report.push('');
    report.push('  1. Review failed test output above');
    report.push('  2. Check the expected vs actual values');
    report.push('  3. Run specific test file: npm test <filename>');
    report.push('  4. Fix the implementation or update the test');
    report.push('  5. Re-run tests to verify fix');
  }

  report.push('');
  report.push('='.repeat(80));
  report.push('END OF REPORT');
  report.push('='.repeat(80));

  // Save to file
  fs.writeFileSync(reportFile, report.join('\n'));

  // Also print to console (shortened version)
  console.log('\n' + report.slice(0, 30).join('\n'));
  if (report.length > 30) {
    console.log('\n... (see ' + reportFile + ' for full report)\n');
  }
}
