# spindump-node

A TypeScript library for interfacing with macOS `spindump` to analyze process performance and system behavior.

## Features

- **Process sampling**: Sample specific processes or system-wide performance
- **Report parsing**: Parse and analyze spindump output with TypeScript interfaces
- **Continuous monitoring**: Watch processes over time with automatic sampling
- **Auto-sudo**: Automatic privilege escalation when needed
- **Flexible output**: Support for both heavy and timeline formats

## Installation

```bash
npm install spindump-node
```

## Quick Start

```typescript
import { Spindump } from 'spindump-node';

// Sample a process by PID for 5 seconds
const result = await Spindump.sampleAndParse(1234, 5);
console.log(`Process: ${result.processes[0].name}`);
console.log(`Threads: ${result.processes[0].numThreads}`);

// Parse an existing spindump file
const parsed = await Spindump.parseFileAndGet('/path/to/spindump.txt');
console.log(`Found ${parsed.processes.length} processes`);
```

## API Reference

### Static Methods

#### `Spindump.sample(target?, duration?, interval?, autoSudo?)`
Take a spindump sample and return raw output.

#### `Spindump.sampleAndParse(target?, duration?, interval?, autoSudo?)`
Take a spindump sample and return parsed results.

#### `Spindump.parseFile(inputPath, format?)`
Parse a spindump file and return raw output.

#### `Spindump.parseFileAndGet(inputPath, format?)`
Parse a spindump file and return parsed results.

#### `Spindump.parseText(spindumpOutput)`
Parse spindump text output into structured data.

### SpindumpWatcher

Monitor processes continuously:

```typescript
import { SpindumpWatcher } from 'spindump-node';

const watcher = new SpindumpWatcher({
  target: 'MyApp',
  pollInterval: 5000,
  sampleDuration: 2,
  onSample: (report, analysis) => {
    console.log(`CPU hotspots:`);
    analysis.targetProcess?.hotFunctions.forEach(func => {
      console.log(`  ${func.function} - ${func.percentage.toFixed(1)}%`);
    });
  }
});

await watcher.start();
// ... monitoring happens automatically
watcher.stop();
```

## Options

### SpindumpOptions

```typescript
interface SpindumpOptions {
  target?: number | string | '-notarget';  // PID, process name, or no target
  duration?: number;                       // Sample duration in seconds
  interval?: number;                       // Sample interval in milliseconds
  format?: 'heavy' | 'timeline';          // Output format
  autoSudo?: boolean;                      // Auto privilege escalation
  // ... many more options available
}
```

## Requirements

- macOS (spindump is a macOS system tool)
- Node.js 16+
- Root privileges for live sampling (handled automatically with `autoSudo: true`)

## License

ISC