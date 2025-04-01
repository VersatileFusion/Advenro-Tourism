const Mocha = require('mocha');

// Create a new Mocha instance
const mocha = new Mocha({
  ui: 'bdd',
  timeout: 10000,
  reporter: 'spec'
});

// Add the test file
mocha.addFile('./test/unit/services/export.service.isolated.test.js');

// Run the tests
mocha.run((failures) => {
  process.exit(failures ? 1 : 0);
}); 