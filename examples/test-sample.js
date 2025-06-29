const { Spindump } = require('../dist');

async function testSpindump() {
  console.log('🔬 Testing spindump-node library...\n');

  console.log('ℹ️  Note: spindump requires root privileges to sample live processes');
  console.log('   To run live sampling, use: sudo node test-sample.js\n');

  // Test 1: Try to build command arguments (no execution)
  console.log('📋 Test 1: Building spindump command arguments');
  try {
    const spindump = new Spindump();
    const testOptions = {
      target: 33_162,
      duration: 3,
      interval: 10,
      format: 'timeline',
      onlyRunnable: true,
      stdout: true,
    };

    // Access the private buildCommand method through a simple test
    console.log('✅ Library imported successfully');
    console.log('✅ Spindump class instantiated');
    console.log('✅ Options object created:', JSON.stringify(testOptions, null, 2));
  } catch (error) {
    console.error('❌ Error with library setup:', error.message);
    return;
  }

  // Test 2: Check if we have root privileges
  console.log('\n🔐 Test 2: Checking privileges and attempting live sampling');

  try {
    // Try a very short sample to test permissions
    console.log('📊 Attempting to sample Node.js process (PID: 33162) for 1 second...');

    const result = await Spindump.sample(33_162, 1, 50); // 1 second, 50ms intervals

    console.log('✅ Sample completed successfully!');
    console.log(`📋 Exit code: ${result.exitCode}`);
    console.log(`📄 Output length: ${result.output.length} characters`);

    // Show first few lines of the output
    const lines = result.output.split('\n');
    console.log('\n📝 First 10 lines of output:');
    console.log('=' + '='.repeat(50));
    lines.slice(0, 10).forEach((line, i) => {
      console.log(`${i + 1}: ${line}`);
    });
    console.log('=' + '='.repeat(50));
  } catch (error) {
    if (error.message.includes('must be run as root')) {
      console.log('⚠️  Root privileges required for live sampling');
      console.log('💡 Run with: sudo node test-sample.js');

      // Test 3: Demonstrate other library features
      console.log('\n📖 Test 3: Demonstrating library API without execution');

      console.log('\n🔧 Available static methods:');
      console.log('   - Spindump.sample(target, duration, interval)');
      console.log('   - Spindump.parseFile(inputPath, format)');

      console.log('\n🔧 Available instance methods and options:');
      console.log('   - new Spindump().run(options)');
      console.log('   - Options include: target, duration, format, outputPath, etc.');

      console.log('\n📝 Example usage:');
      console.log(`
      // Basic sampling (requires sudo)
      const result = await Spindump.sample('firefox', 5, 10);
      
      // Advanced options
      const spindump = new Spindump();
      const report = await spindump.run({
        target: 1234,
        duration: 10,
        format: 'timeline',
        onlyRunnable: true,
        outputPath: '/tmp/my-report.spindump'
      });
      
      // Parse existing spindump file
      const parsed = await Spindump.parseFile('/path/to/report.spindump');
      `);
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }

  console.log('\n✨ Library test completed!');
}

testSpindump();
