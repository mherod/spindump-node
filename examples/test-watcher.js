const { SpindumpWatcher } = require('../dist');

async function testWatcher() {
  console.log('⏱️  Testing SpindumpWatcher functionality...\n');

  // Create watcher with custom options
  const watcher = new SpindumpWatcher({
    target: 'node',
    pollInterval: 3000, // 3 seconds between samples
    sampleDuration: 1, // 1 second per sample
    sampleInterval: 100, // 100ms between stackshots
    maxSamples: 5, // Keep last 5 samples
    autoSudo: true,

    onSample: (report, analysis) => {
      console.log(`\n📊 Sample ${analysis.sampleNumber} @ ${analysis.timestamp.toLocaleTimeString()}`);
      console.log(`   System: ${analysis.processCount} processes, ${analysis.systemMetrics.activeCpus} CPUs`);

      if (analysis.targetProcess) {
        const target = analysis.targetProcess;
        console.log(`   Target: ${target.name} [${target.pid}] - ${target.footprint}`);
        console.log(`   Threads: ${target.threadCount} (${target.threadActivity.filter(t => t.state === 'running').length} running, ${target.threadActivity.filter(t => t.state === 'blocked').length} blocked)`);

        // Show top 3 hot functions
        if (target.hotFunctions.length > 0) {
          console.log(`   Hot functions:`);
          target.hotFunctions.slice(0, 3).forEach((func, i) => {
            console.log(`      ${i + 1}. ${func.function} (${func.percentage.toFixed(1)}%)`);
          });
        }

        // Show thread activity
        const activeThreads = target.threadActivity.filter(t => t.sampleCount > 0);
        if (activeThreads.length > 0) {
          console.log(`   Active threads:`);
          activeThreads.slice(0, 3).forEach(thread => {
            console.log(`      ${thread.threadId}: ${thread.topFunction} (${thread.state})`);
          });
        }
      }

      // Show changes from previous sample
      if (analysis.changes) {
        const changes = analysis.changes;
        let changeMsg = [];

        if (changes.processCountDelta !== 0) {
          changeMsg.push(`${changes.processCountDelta > 0 ? '+' : ''}${changes.processCountDelta} processes`);
        }

        if (changes.footprintDelta) {
          changeMsg.push(`memory: ${changes.footprintDelta}`);
        }

        if (changes.newThreads.length > 0) {
          changeMsg.push(`+${changes.newThreads.length} threads`);
        }

        if (changes.exitedThreads.length > 0) {
          changeMsg.push(`-${changes.exitedThreads.length} threads`);
        }

        if (changeMsg.length > 0) {
          console.log(`   Changes: ${changeMsg.join(', ')}`);
        }
      }
    },

    onError: (error) => {
      console.error(`❌ Watcher error: ${error.message}`);
    }
  });

  console.log('🚀 Starting watcher for Node.js processes...');
  console.log('   Press Ctrl+C to stop\n');

  try {
    await watcher.start();

    // Let it run for a while, then show summary
    setTimeout(() => {
      console.log('\n📋 Watcher Summary:');

      const history = watcher.getHistory();
      console.log(`   Total samples taken: ${history.length}`);

      if (history.length > 0) {
        const latest = watcher.getLatestAnalysis();
        console.log(`   Latest analysis at: ${latest?.timestamp.toLocaleString()}`);

        // Calculate trends
        const processCounts = history.map(h => h.processCount);
        const avgProcesses = processCounts.reduce((a, b) => a + b, 0) / processCounts.length;
        console.log(`   Average process count: ${avgProcesses.toFixed(1)}`);

        // Show target process trends
        const targetSamples = history.filter(h => h.targetProcess);
        if (targetSamples.length > 1) {
          const firstTarget = targetSamples[0].targetProcess;
          const lastTarget = targetSamples[targetSamples.length - 1].targetProcess;

          console.log(`\n🎯 Target Process Trends:`);
          console.log(`   Process: ${lastTarget?.name} [${lastTarget?.pid}]`);
          console.log(`   Memory: ${firstTarget?.footprint} → ${lastTarget?.footprint}`);
          console.log(`   Threads: ${firstTarget?.threadCount} → ${lastTarget?.threadCount}`);

          // Find most consistent hot functions
          const functionCounts = new Map();
          targetSamples.forEach(sample => {
            sample.targetProcess?.hotFunctions.slice(0, 3).forEach(func => {
              functionCounts.set(func.function, (functionCounts.get(func.function) || 0) + 1);
            });
          });

          const consistentFunctions = Array.from(functionCounts.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

          if (consistentFunctions.length > 0) {
            console.log(`   Most consistent hot functions:`);
            consistentFunctions.forEach(([func, count]) => {
              console.log(`      ${func} (appeared in ${count}/${targetSamples.length} samples)`);
            });
          }
        }
      }

      console.log('\n⏹️  Stopping watcher in 3 seconds...');

      setTimeout(() => {
        watcher.stop();
        console.log('\n✨ Watcher test completed!');
        console.log('\n💡 SpindumpWatcher features:');
        console.log('   - Continuous process monitoring');
        console.log('   - Hot function analysis');
        console.log('   - Thread state tracking');
        console.log('   - Change detection between samples');
        console.log('   - Configurable polling intervals');
        console.log('   - Sample history management');
        process.exit(0);
      }, 3000);

    }, 15000); // Run for 15 seconds

  } catch (error) {
    console.error('❌ Failed to start watcher:', error.message);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Stopping watcher...');
  process.exit(0);
});

testWatcher();
