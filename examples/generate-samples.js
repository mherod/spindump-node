const { Spindump } = require('../dist');
const fs = require('fs');
const path = require('path');

async function generateSampleData() {
  console.log('🔬 Generating spindump sample data for analysis...\n');

  const samples = [
    {
      name: 'node-heavy-sample',
      description: 'Node.js process in heavy format',
      options: {
        target: 'node',
        duration: 3,
        interval: 50,
        format: 'heavy',
        outputPath: './samples/node-heavy.spindump'
      }
    },
    {
      name: 'node-timeline-sample',
      description: 'Node.js process in timeline format',
      options: {
        target: 'node',
        duration: 3,
        interval: 50,
        format: 'timeline',
        outputPath: './samples/node-timeline.spindump'
      }
    },
    {
      name: 'system-sample',
      description: 'System-wide sample (short duration)',
      options: {
        target: '-notarget',
        duration: 2,
        interval: 100,
        format: 'heavy',
        outputPath: './samples/system-wide.spindump'
      }
    },
    {
      name: 'stdout-sample',
      description: 'Sample with stdout output for parsing',
      options: {
        target: 'node',
        duration: 2,
        interval: 100,
        format: 'heavy',
        stdout: true,
        noFile: true
      }
    }
  ];

  // Create samples directory
  if (!fs.existsSync('./samples')) {
    fs.mkdirSync('./samples');
    console.log('📁 Created ./samples directory');
  }

  const spindump = new Spindump();

  for (const sample of samples) {
    console.log(`\n📊 Generating ${sample.description}...`);

    try {
      const result = await spindump.run({
        ...sample.options,
        autoSudo: true,
        sudoPrompt: `🔬 Generating ${sample.name}: `
      });

      console.log(`✅ ${sample.name} completed successfully`);
      console.log(`   Exit code: ${result.exitCode}`);

      if (sample.options.stdout || sample.options.noFile) {
        // Save stdout output to file for analysis
        const outputFile = `./samples/${sample.name}.txt`;
        fs.writeFileSync(outputFile, result.output);
        console.log(`   Output saved to: ${outputFile}`);
        console.log(`   Output length: ${result.output.length} characters`);
      } else {
        console.log(`   File saved to: ${sample.options.outputPath}`);

        // Also get a copy with stdout for analysis
        try {
          const stdoutResult = await spindump.run({
            inputPath: sample.options.outputPath,
            stdout: true,
            format: sample.options.format
          });

          const analysisFile = `./samples/${sample.name}-analysis.txt`;
          fs.writeFileSync(analysisFile, stdoutResult.output);
          console.log(`   Analysis copy: ${analysisFile}`);
        } catch (err) {
          console.log(`   ⚠️  Could not create analysis copy: ${err.message}`);
        }
      }

    } catch (error) {
      console.error(`❌ Failed to generate ${sample.name}:`, error.message);
    }
  }

  console.log('\n📋 Sample generation completed!');
  console.log('\n📁 Generated files in ./samples/:');

  if (fs.existsSync('./samples')) {
    const files = fs.readdirSync('./samples');
    files.forEach(file => {
      const filePath = path.join('./samples', file);
      const stats = fs.statSync(filePath);
      console.log(`   ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    });
  }

  console.log('\n💡 Next steps:');
  console.log('   1. Examine the generated files to understand structure');
  console.log('   2. Identify patterns in heavy vs timeline formats');
  console.log('   3. Design parsing interfaces based on the data');
}

generateSampleData().catch(err => {
  console.error('💥 Generation failed:', err);
  process.exit(1);
});
