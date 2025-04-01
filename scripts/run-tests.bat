@echo off
echo Running integration tests in sequence...
set NODE_ENV=test
set PORT=3001
node scripts/run-integration-tests.js 