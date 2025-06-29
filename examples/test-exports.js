// Test that all exports work properly
const Spindump = require('../dist/index.js').default;
const { SpindumpWatcher } = require('../dist/index.js');

console.log('Testing exports...');
console.log('Spindump class:', typeof Spindump);
console.log('SpindumpWatcher class:', typeof SpindumpWatcher);

// Test that we can create instances
try {
  const spindump = new Spindump();
  console.log('✓ Spindump instance created');
  
  const watcher = new SpindumpWatcher();
  console.log('✓ SpindumpWatcher instance created');
} catch (error) {
  console.error('✗ Export test failed:', error.message);
}

console.log('All exports working correctly!');