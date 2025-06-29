const { Spindump } = require('../dist');

async function testAutoSudo() {
  console.log('🔐 Testing automatic sudo functionality...\n');

  // Find a Node.js process to sample
  console.log('🔍 Looking for Node.js processes...');

  try {
    // Test with auto-sudo enabled (default)
    console.log('📊 Attempting to sample Node.js process with auto-sudo...');
    console.log('   (You may be prompted for your password)\n');

    const result = await Spindump.sample('node', 2, 50); // 2 seconds, 50ms intervals

    console.log('✅ Sample completed successfully with auto-sudo!');
    console.log(`📋 Exit code: ${result.exitCode}`);
    console.log(`📄 Output length: ${result.output.length} characters\n`);

    // Show some interesting parts of the output
    const lines = result.output.split('\n');
    const headerLines = lines.slice(0, 15);

    console.log('📝 Report header:');
    console.log('=' + '='.repeat(60));
    headerLines.forEach((line, i) => {
      if (line.trim()) {
        console.log(`${String(i + 1).padStart(2)}: ${line}`);
      }
    });
    console.log('=' + '='.repeat(60));

    // Look for interesting process information
    const processLines = lines.filter(
      (line) =>
        line.includes('Process:') ||
        line.includes('node') ||
        line.includes('Path:') ||
        line.includes('Identifier:')
    );

    if (processLines.length > 0) {
      console.log('\n🎯 Key process information:');
      processLines.slice(0, 8).forEach((line) => {
        console.log(`   ${line.trim()}`);
      });
    }

    // Test advanced options with auto-sudo
    console.log('\n\n🔧 Testing advanced options with auto-sudo...');

    const spindump = new Spindump();
    const advancedResult = await spindump.run({
      target: 'node',
      duration: 1,
      interval: 100,
      format: 'heavy',
      onlyRunnable: true,
      autoSudo: true,
      sudoPrompt: '🚀 Advanced spindump test needs privileges: ',
    });

    console.log('✅ Advanced sample completed!');
    console.log(`📋 Exit code: ${advancedResult.exitCode}`);
    console.log(`📄 Output length: ${advancedResult.output.length} characters`);
  } catch (error) {
    console.error('❌ Error during auto-sudo test:', error.message);

    if (error.message.includes('User cancelled')) {
      console.log('ℹ️  User cancelled sudo prompt - this is expected behavior');
    } else if (error.message.includes('incorrect password')) {
      console.log('ℹ️  Incorrect password entered - this is expected behavior for testing');
    }
  }

  console.log('\n✨ Auto-sudo test completed!');
  console.log('\n💡 Usage tips:');
  console.log('   - Use Spindump.sample(target, duration, interval) for automatic sudo');
  console.log('   - Set autoSudo: false to disable automatic privilege escalation');
  console.log('   - Customize sudoPrompt for your own prompt message');
}

testAutoSudo();
