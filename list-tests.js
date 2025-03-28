const fs = require('fs');
const path = require('path');

function safeListTestFiles(dir) {
  try {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      
      const tests = files.filter(file => file.endsWith('.test.js'));
      console.log(`Tests in ${dir}:`);
      tests.forEach(test => {
        console.log(`  - ${test}`);
      });
      console.log(`Total: ${tests.length} tests\n`);
      
      return tests;
    } else {
      console.log(`Directory does not exist: ${dir}`);
      return [];
    }
  } catch (error) {
    console.error(`Error listing files in ${dir}:`, error);
    return [];
  }
}

// List controllers
const controllersDir = path.join(__dirname, 'test', 'unit', 'controllers');
const controllerTests = safeListTestFiles(controllersDir);

// List services
const servicesDir = path.join(__dirname, 'test', 'unit', 'services');
const serviceTests = safeListTestFiles(servicesDir);

// List middleware
const middlewareDir = path.join(__dirname, 'test', 'unit', 'middleware');
const middlewareTests = safeListTestFiles(middlewareDir);

// List integration tests
const integrationDir = path.join(__dirname, 'test', 'integration');
const integrationTests = safeListTestFiles(integrationDir);

// Print summary
console.log('Summary:');
console.log(`Controllers: ${controllerTests.length} tests`);
console.log(`Services: ${serviceTests.length} tests`);
console.log(`Middleware: ${middlewareTests.length} tests`);
console.log(`Integration: ${integrationTests.length} tests`);
console.log(`Total: ${controllerTests.length + serviceTests.length + middlewareTests.length + integrationTests.length} tests`);

// Check for specific controller tests
console.log('\nController Coverage:');
const controllers = [
  { name: 'User Profile Controller', files: controllerTests.filter(f => f.includes('userProfile.controller')) },
  { name: 'Search Controller', files: controllerTests.filter(f => f.includes('search.controller')) },
  { name: 'Payment Controller', files: controllerTests.filter(f => f.includes('payment.controller')) },
  { name: 'Notification Controller', files: controllerTests.filter(f => f.includes('notification.controller')) },
  { name: 'Settings Controller', files: controllerTests.filter(f => f.includes('settings.controller')) },
  { name: 'Activity Controller', files: controllerTests.filter(f => f.includes('activity.controller')) }
];

controllers.forEach(controller => {
  if (controller.files.length > 0) {
    console.log(`✅ ${controller.name} (${controller.files.join(', ')})`);
  } else {
    console.log(`❌ ${controller.name}`);
  }
});

// Check for index service test
console.log('\nService Coverage:');
if (serviceTests.includes('indexService.test.js')) {
  console.log('✅ Index Service (indexService.test.js)');
} else {
  console.log('❌ Index Service');
} 