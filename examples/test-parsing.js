const { Spindump } = require('../dist');
const fs = require('fs');

async function testParsing() {
  console.log('🔍 Testing spindump parsing functionality...\n');

  try {
    // Test 1: Parse existing sample file
    console.log('📄 Test 1: Parsing existing sample file');
    const sampleData = fs.readFileSync('./samples/stdout-sample.txt', 'utf8');

    console.log(`   Raw data length: ${sampleData.length} characters`);

    const parsed = Spindump.parseText(sampleData);

    console.log('✅ Parsing completed successfully!');
    console.log(`   Format: ${parsed.format}`);
    console.log(`   Processes found: ${parsed.processes.length}`);

    // Show header information
    console.log('\n📋 Header Information:');
    console.log(`   Date/Time: ${parsed.header.dateTime}`);
    console.log(`   OS Version: ${parsed.header.osVersion}`);
    console.log(`   Architecture: ${parsed.header.architecture}`);
    console.log(`   Duration: ${parsed.header.duration}`);
    console.log(`   Steps: ${parsed.header.steps}`);
    console.log(`   Hardware: ${parsed.header.hardwareModel}`);
    console.log(`   Active CPUs: ${parsed.header.activeCpus}`);
    console.log(`   Memory: ${parsed.header.memorySize}`);

    // Show process details
    console.log('\n🔍 Process Details:');
    parsed.processes.slice(0, 3).forEach((process, i) => {
      console.log(`   ${i + 1}. ${process.name} [${process.pid}]`);
      console.log(`      Path: ${process.path}`);
      console.log(`      Footprint: ${process.footprint}`);
      console.log(`      Threads: ${process.threads.length}`);
      console.log(`      Binary Images: ${process.binaryImages.length}`);

      // Show first thread details
      if (process.threads.length > 0) {
        const thread = process.threads[0];
        console.log(`      First Thread: ${thread.threadId} (${thread.samples})`);
        console.log(`         Priority: ${thread.priority}`);
        console.log(`         Stack frames: ${thread.stackFrames.length}`);

        // Show top stack frames
        thread.stackFrames.slice(0, 3).forEach((frame, j) => {
          const indent = '  '.repeat(Math.floor(frame.indentLevel / 2));
          console.log(
            `         ${j + 1}. ${indent}${frame.function}${frame.count ? ` (${frame.count})` : ''}`
          );
        });
      }
      console.log('');
    });

    // Test 2: Live sampling with parsing
    console.log('\n📊 Test 2: Live sampling with automatic parsing');

    const liveResult = await Spindump.sampleAndParse('node', 1, 100);

    console.log('✅ Live sample parsed successfully!');
    console.log(`   Format: ${liveResult.format}`);
    console.log(`   Processes found: ${liveResult.processes.length}`);
    console.log(`   Target process threads: ${liveResult.processes[0]?.threads.length || 0}`);

    // Show stack trace for main thread
    const mainProcess = liveResult.processes[0];
    if (mainProcess && mainProcess.threads.length > 0) {
      const mainThread = mainProcess.threads[0];
      console.log(`\n🧵 Main thread stack trace for ${mainProcess.name}:`);
      mainThread.stackFrames.slice(0, 8).forEach((frame, i) => {
        const indent = '  '.repeat(Math.floor(frame.indentLevel / 4));
        const kernel = frame.isKernel ? '*' : ' ';
        console.log(
          `   ${kernel}${indent}${frame.function}${frame.count ? ` (${frame.count})` : ''}`
        );
      });
    }

    // Test 3: Parse file method
    console.log('\n\n📁 Test 3: Parse existing spindump file');

    const fileResult = await Spindump.parseFileAndGet('./samples/node-heavy.spindump', 'heavy');

    console.log('✅ File parsed successfully!');
    console.log(`   Format: ${fileResult.format}`);
    console.log(`   Processes found: ${fileResult.processes.length}`);

    // Performance comparison
    const nodeProcesses = fileResult.processes.filter((p) => p.name.includes('node'));
    console.log(`   Node.js processes: ${nodeProcesses.length}`);

    nodeProcesses.forEach((process) => {
      console.log(
        `   - ${process.name} [${process.pid}]: ${process.footprint}, ${process.threads.length} threads`
      );
    });
  } catch (error) {
    console.error('❌ Parsing test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  console.log('\n✨ Parsing tests completed!');
  console.log('\n💡 Available parsing methods:');
  console.log('   - Spindump.parseText(output) - Parse raw spindump text');
  console.log(
    '   - Spindump.sampleAndParse(target, duration, interval) - Sample and parse in one call'
  );
  console.log('   - Spindump.parseFileAndGet(path, format) - Load and parse spindump file');
  console.log('   - new Spindump().parse(output) - Instance method for parsing');
}

testParsing();
