import { spawn } from 'child_process';
import { promisify } from 'util';

export type SpindumpFormat = 'heavy' | 'timeline';
export type SpindumpTarget = number | string | '-notarget';

export interface SpindumpBasicOptions {
  target?: SpindumpTarget;
  duration?: number;
  interval?: number;
}

export interface SpindumpFileOptions {
  inputPath?: string;
  outputPath?: string;
  indexRange?: { start: number; end: number };
  startIndex?: number;
  endIndex?: number;
}

export interface SpindumpDisplayOptions {
  format?: SpindumpFormat;
  onlyRunnable?: boolean;
  onlyBlocked?: boolean;
  onlyTarget?: boolean;
  additionalProcs?: (number | string)[];
  sampleWithoutTarget?: boolean;
}

export interface SpindumpOutputOptions {
  stdout?: boolean;
  noFile?: boolean;
  noBinary?: boolean;
  noText?: boolean;
  open?: string;
  reveal?: boolean;
}

export interface SpindumpControlOptions {
  wait?: boolean;
  timeLimit?: number;
  siginfo?: boolean;
  delayOnSignal?: number;
  threadPriorityThreshold?: number;
  noThrottle?: boolean;
  noProcessingWhileSampling?: boolean;
}

export interface SpindumpFilterOptions {
  displayIdleWorkQueueThreads?: boolean;
  aggregateCallTreesByThread?: boolean;
  aggregateCallTreesByProcess?: boolean;
  omitFramesBelowSampleCount?: number;
}

export interface SpindumpMicrostackshotOptions {
  microstackshots?: boolean;
  microstackshotsIo?: boolean;
  microstackshotsDatastore?: string;
  microstackshoptsSave?: boolean;
  microstackshotsStartTime?: string | number;
  microstackshotsEndTime?: string | number;
  microstackshoptsPid?: number;
  microstackshotsThreadId?: number;
  microstackshoptsDscPath?: string;
  batteryOnly?: boolean;
  acOnly?: boolean;
  userIdleOnly?: boolean;
  userActiveOnly?: boolean;
}

export interface SpindumpOptions extends 
  SpindumpBasicOptions,
  SpindumpFileOptions, 
  SpindumpDisplayOptions,
  SpindumpOutputOptions,
  SpindumpControlOptions,
  SpindumpFilterOptions,
  SpindumpMicrostackshotOptions {
  // Auto-privilege escalation options
  autoSudo?: boolean;
  sudoPrompt?: string;
}

export interface SpindumpResult {
  output: string;
  exitCode: number;
  stderr?: string;
}

// Parsing interfaces
export interface SpindumpHeader {
  dateTime: string;
  endTime: string;
  osVersion: string;
  architecture: string;
  reportVersion: number;
  shareWithDevs: boolean;
  dataSource: string;
  sharedCaches: SharedCache[];
  command?: string;
  path?: string;
  codesigningId?: string;
  teamId?: string;
  parent?: ProcessReference;
  responsible?: ProcessReference;
  pid?: number;
  timeSinceFork?: string;
  duration: string;
  steps: number;
  samplingInterval: string;
  hardwareModel: string;
  activeCpus: number;
  memorySize: string;
  hwPageSize: number;
  vmPageSize: number;
  sharedCacheResidency: string;
  timeSinceBoot: string;
  timeAwakeSinceBoot: string;
  timeSinceWake: string;
  fanSpeed: string;
  totalCpuTime: string;
  advisoryLevels: AdvisoryLevels;
  freeDiskSpace: string;
  vnodesAvailable: string;
  models: string;
  launchdThrottledProcesses: string[];
  preferredUserLanguage: string;
  countryCode: string;
  keyboards: string;
  osCryptexFileExtents: number;
}

export interface SharedCache {
  uuid: string;
  slidBaseAddress: string;
  slide: string;
  type: string;
}

export interface ProcessReference {
  name: string;
  pid: number;
  uniquePid?: number;
}

export interface AdvisoryLevels {
  battery: number;
  user: number;
  thermalPressure: number;
  combined: number;
}

export interface SpindumpProcess {
  name: string;
  pid: number;
  uniquePid?: number;
  uuid: string;
  path: string;
  identifier?: string;
  version?: string;
  codesigningId?: string;
  teamId?: string;
  isFirstParty?: boolean;
  betaIdentifier?: string;
  sharedCache: string;
  architecture: string;
  parent?: ProcessReference;
  responsible?: ProcessReference;
  uid: number;
  footprint: string;
  timeSinceFork: string;
  numSamples: string;
  cpuTime?: string;
  numThreads: number;
  threads: SpindumpThread[];
  binaryImages: BinaryImage[];
  note?: string;
}

export interface SpindumpThread {
  threadId: string;
  dispatchQueue?: string;
  threadName?: string;
  samples: string;
  priority: string;
  basePriority?: string;
  cpuTime?: string;
  qosInfo?: string;
  stackFrames: StackFrame[];
}

export interface StackFrame {
  count?: number;
  sampleRange?: string;
  indentLevel: number;
  function: string;
  offset?: string;
  library?: string;
  libraryOffset?: string;
  address?: string;
  isKernel: boolean;
}

export interface BinaryImage {
  addressRange: string;
  name: string;
  version?: string;
  uuid: string;
  path: string;
}

export interface ParsedSpindumpReport {
  header: SpindumpHeader;
  format: SpindumpFormat;
  processes: SpindumpProcess[];
  raw: string;
}

// Watcher interfaces
export interface SpindumpWatcherOptions {
  target?: SpindumpTarget;
  pollInterval?: number; // milliseconds between samples
  sampleDuration?: number; // seconds per sample
  sampleInterval?: number; // milliseconds between stackshots within a sample
  maxSamples?: number; // maximum number of samples to keep in history
  autoSudo?: boolean;
  onSample?: (report: ParsedSpindumpReport, analysis: SampleAnalysis) => void;
  onError?: (error: Error) => void;
}

export interface SampleAnalysis {
  timestamp: Date;
  sampleNumber: number;
  processCount: number;
  targetProcess?: ProcessAnalysis;
  systemMetrics: SystemMetrics;
  changes?: SampleComparison;
}

export interface ProcessAnalysis {
  name: string;
  pid: number;
  footprint: string;
  threadCount: number;
  cpuTime?: string;
  hotFunctions: HotFunction[];
  threadActivity: ThreadActivity[];
}

export interface HotFunction {
  function: string;
  library?: string;
  sampleCount: number;
  percentage: number;
}

export interface ThreadActivity {
  threadId: string;
  name?: string;
  sampleCount: number;
  topFunction: string;
  state: 'running' | 'blocked' | 'unknown';
}

export interface SystemMetrics {
  activeCpus: number;
  memorySize: string;
  freeDiskSpace?: string;
  fanSpeed?: string;
  totalCpuTime?: string;
  advisoryLevels?: AdvisoryLevels;
}

export interface SampleComparison {
  processCountDelta: number;
  footprintDelta?: string;
  newThreads: string[];
  exitedThreads: string[];
  functionChanges: FunctionChange[];
}

export interface FunctionChange {
  function: string;
  library?: string;
  countDelta: number;
  percentageDelta: number;
}

export class Spindump {
  private isLiveSampling(options: SpindumpOptions): boolean {
    // Live sampling is when we're not reading from a file (-i option)
    return !options.inputPath;
  }

  private needsRootPrivileges(): boolean {
    return process.getuid?.() !== 0;
  }

  private parseProcessReference(text: string): ProcessReference | undefined {
    // Parse "processName [pid] [unique pid uniquePid]" or "processName [pid]"
    const match = text.match(/^(.+?)\s+\[(\d+)\](?:\s+\[unique pid (\d+)\])?/);
    if (!match || !match[1] || !match[2]) return undefined;
    
    return {
      name: match[1].trim(),
      pid: parseInt(match[2]),
      uniquePid: match[3] ? parseInt(match[3]) : undefined
    };
  }

  private parseAdvisoryLevels(text: string): AdvisoryLevels {
    // Parse "Battery -> 2, User -> 2, ThermalPressure -> 0, Combined -> 2"
    const defaults = { battery: 0, user: 0, thermalPressure: 0, combined: 0 };
    
    const batteryMatch = text.match(/Battery\s*->\s*(\d+)/);
    const userMatch = text.match(/User\s*->\s*(\d+)/);
    const thermalMatch = text.match(/ThermalPressure\s*->\s*(\d+)/);
    const combinedMatch = text.match(/Combined\s*->\s*(\d+)/);
    
    return {
      battery: batteryMatch?.[1] ? parseInt(batteryMatch[1]) : defaults.battery,
      user: userMatch?.[1] ? parseInt(userMatch[1]) : defaults.user,
      thermalPressure: thermalMatch?.[1] ? parseInt(thermalMatch[1]) : defaults.thermalPressure,
      combined: combinedMatch?.[1] ? parseInt(combinedMatch[1]) : defaults.combined
    };
  }

  private parseStackFrame(line: string): StackFrame | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // Count leading spaces for indent level
    const indentLevel = line.length - line.trimStart().length;
    
    // Handle kernel frames (start with *)
    const isKernel = trimmed.startsWith('*');
    const cleanLine = isKernel ? trimmed.substring(1) : trimmed;
    
    // Parse different formats:
    // "21  start + 6076 (dyld + 27544) [0x197bcab98]"
    // "21  start + 6076 (dyld + 27544) [0x197bcab98] 1-61"
    
    const countMatch = cleanLine.match(/^(\d+)\s+(.+)$/);
    if (!countMatch || !countMatch[1] || !countMatch[2]) {
      // No count, might be a continuation or different format
      return {
        indentLevel,
        function: cleanLine,
        isKernel
      };
    }
    
    const count = parseInt(countMatch[1]);
    const rest = countMatch[2];
    
    // Try to parse full format: "function + offset (library + libraryOffset) [address] range"
    const fullMatch = rest.match(/^(.+?)\s+\+\s+(\d+)\s+\((.+?)\s+\+\s+(\d+)\)\s+\[([0-9a-fx]+)\](?:\s+(.+))?$/);
    if (fullMatch && fullMatch[1]) {
      return {
        count,
        indentLevel,
        function: fullMatch[1],
        offset: fullMatch[2] || undefined,
        library: fullMatch[3] || undefined,
        libraryOffset: fullMatch[4] || undefined,
        address: fullMatch[5] || undefined,
        sampleRange: fullMatch[6] || undefined,
        isKernel
      };
    }
    
    // Simpler format without library info
    const simpleMatch = rest.match(/^(.+?)\s+\[([0-9a-fx]+)\](?:\s+(.+))?$/);
    if (simpleMatch && simpleMatch[1]) {
      return {
        count,
        indentLevel,
        function: simpleMatch[1],
        address: simpleMatch[2] || undefined,
        sampleRange: simpleMatch[3] || undefined,
        isKernel
      };
    }
    
    return {
      count,
      indentLevel,
      function: rest,
      isKernel
    };
  }

  public parse(spindumpOutput: string): ParsedSpindumpReport {
    const lines = spindumpOutput.split('\n');
    const header: Partial<SpindumpHeader> = {};
    const processes: SpindumpProcess[] = [];
    let currentProcess: Partial<SpindumpProcess> | null = null;
    let currentThread: Partial<SpindumpThread> | null = null;
    let inBinaryImages = false;
    let format: SpindumpFormat = 'heavy';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const trimmed = line.trim();
      
      if (!trimmed) continue;
      
      // Parse header information
      if (line.startsWith('Date/Time:')) {
        header.dateTime = line.substring('Date/Time:'.length).trim();
      } else if (line.startsWith('End time:')) {
        header.endTime = line.substring('End time:'.length).trim();
      } else if (line.startsWith('OS Version:')) {
        header.osVersion = line.substring('OS Version:'.length).trim();
      } else if (line.startsWith('Architecture:') && !header.architecture) {
        header.architecture = line.substring('Architecture:'.length).trim();
      } else if (line.startsWith('Report Version:')) {
        header.reportVersion = parseInt(line.substring('Report Version:'.length).trim());
      } else if (line.startsWith('Duration:')) {
        header.duration = line.substring('Duration:'.length).trim();
      } else if (line.startsWith('Steps:')) {
        const stepsText = line.substring('Steps:'.length).trim();
        const match = stepsText.match(/(\d+)\s+\((.+?)\)/);
        if (match && match[1] && match[2]) {
          header.steps = parseInt(match[1]);
          header.samplingInterval = match[2];
        }
      } else if (line.startsWith('Hardware model:')) {
        header.hardwareModel = line.substring('Hardware model:'.length).trim();
      } else if (line.startsWith('Active cpus:')) {
        header.activeCpus = parseInt(line.substring('Active cpus:'.length).trim());
      } else if (line.startsWith('Memory size:')) {
        header.memorySize = line.substring('Memory size:'.length).trim();
      } else if (line.startsWith('Advisory levels:')) {
        header.advisoryLevels = this.parseAdvisoryLevels(line.substring('Advisory levels:'.length).trim());
      } else if (trimmed.includes('format: stacks are sorted by count')) {
        format = 'heavy';
      } else if (trimmed.includes('format: stacks are sorted chronologically')) {
        format = 'timeline';
      }
      
      // Parse process information
      else if (line.startsWith('Process:')) {
        // Save previous process
        if (currentProcess && currentProcess.name) {
          processes.push(currentProcess as SpindumpProcess);
        }
        
        // Start new process
        const processMatch = line.match(/Process:\s+(.+?)\s+\[(\d+)\](?:\s+\[unique pid (\d+)\])?/);
        if (processMatch && processMatch[1] && processMatch[2]) {
          currentProcess = {
            name: processMatch[1],
            pid: parseInt(processMatch[2]),
            uniquePid: processMatch[3] ? parseInt(processMatch[3]) : undefined,
            threads: [],
            binaryImages: []
          };
        }
        inBinaryImages = false;
      } else if (line.startsWith('Path:') && currentProcess) {
        currentProcess.path = line.substring('Path:'.length).trim();
      } else if (line.startsWith('UUID:') && currentProcess) {
        currentProcess.uuid = line.substring('UUID:'.length).trim();
      } else if (line.startsWith('Footprint:') && currentProcess) {
        currentProcess.footprint = line.substring('Footprint:'.length).trim();
      } else if (line.startsWith('Num threads:') && currentProcess) {
        currentProcess.numThreads = parseInt(line.substring('Num threads:'.length).trim());
      }
      
      // Parse thread information
      else if (line.match(/^\s*Thread\s+0x[0-9a-f]+/)) {
        // Save previous thread
        if (currentThread && currentThread.threadId && currentProcess) {
          currentProcess.threads!.push(currentThread as SpindumpThread);
        }
        
        // Parse thread header
        const threadMatch = line.match(/Thread\s+(0x[0-9a-f]+)(?:\s+DispatchQueue\s+"?([^"]+)"?(?:\(\d+\))?)?(?:\s+Thread name\s+"([^"]+)")?.*?(\d+)\s+samples\s+\(([^)]+)\).*?priority\s+(\d+)/);
        if (threadMatch) {
          currentThread = {
            threadId: threadMatch[1],
            dispatchQueue: threadMatch[2],
            threadName: threadMatch[3],
            samples: threadMatch[4] + ' (' + threadMatch[5] + ')',
            priority: threadMatch[6],
            stackFrames: []
          };
        }
      }
      
      // Parse stack frames
      else if (currentThread && (line.match(/^\s*\d+\s+/) || line.match(/^\s*\*\d+\s+/) || line.match(/^\s+/))) {
        const frame = this.parseStackFrame(line);
        if (frame) {
          currentThread.stackFrames!.push(frame);
        }
      }
      
      // Parse binary images
      else if (line.trim() === 'Binary Images:') {
        inBinaryImages = true;
        // Save current thread if exists
        if (currentThread && currentThread.threadId && currentProcess) {
          currentProcess.threads!.push(currentThread as SpindumpThread);
          currentThread = null;
        }
      } else if (inBinaryImages && currentProcess && line.match(/^\s*0x[0-9a-f]+/)) {
        // Parse binary image line
        const binaryMatch = line.match(/^\s*(0x[0-9a-f]+\s*-\s*0x[0-9a-f]+)\s+(.+?)\s+\(([^)]+)\)\s+<([^>]+)>\s+(.+)$/);
        if (binaryMatch && binaryMatch[1] && binaryMatch[2] && binaryMatch[3] && binaryMatch[4] && binaryMatch[5]) {
          currentProcess.binaryImages?.push({
            addressRange: binaryMatch[1].trim(),
            name: binaryMatch[2].trim(),
            version: binaryMatch[3].trim(),
            uuid: binaryMatch[4].trim(),
            path: binaryMatch[5].trim()
          });
        }
      }
    }
    
    // Save final process
    if (currentProcess && currentProcess.name) {
      if (currentThread && currentThread.threadId) {
        currentProcess.threads!.push(currentThread as SpindumpThread);
      }
      processes.push(currentProcess as SpindumpProcess);
    }
    
    return {
      header: header as SpindumpHeader,
      format,
      processes,
      raw: spindumpOutput
    };
  }

  private buildCommand(options: SpindumpOptions): string[] {
    const args: string[] = [];

    // Basic options
    if (options.target !== undefined) {
      if (options.target === '-notarget') {
        args.push('-notarget');
      } else {
        args.push(options.target.toString());
      }
    }

    if (options.duration !== undefined) {
      args.push(options.duration.toString());
    }

    if (options.interval !== undefined) {
      args.push(options.interval.toString());
    }

    // File options
    if (options.inputPath) {
      args.push('-i', options.inputPath);
    }

    if (options.outputPath) {
      args.push('-o', options.outputPath);
    }

    if (options.indexRange) {
      args.push('-indexRange', `${options.indexRange.start}-${options.indexRange.end}`);
    }

    if (options.startIndex !== undefined) {
      args.push('-startIndex', options.startIndex.toString());
    }

    if (options.endIndex !== undefined) {
      args.push('-endIndex', options.endIndex.toString());
    }

    // Display format
    if (options.format === 'heavy') {
      args.push('-heavy');
    } else if (options.format === 'timeline') {
      args.push('-timeline');
    }

    // Display filters
    if (options.onlyRunnable) {
      args.push('-onlyRunnable');
    }

    if (options.onlyBlocked) {
      args.push('-onlyBlocked');
    }

    if (options.onlyTarget) {
      args.push('-onlyTarget');
    }

    if (options.additionalProcs) {
      options.additionalProcs.forEach(proc => {
        args.push('-proc', proc.toString());
      });
    }

    if (options.sampleWithoutTarget) {
      args.push('-sampleWithoutTarget');
    }

    // Control options
    if (options.wait) {
      args.push('-wait');
    }

    if (options.timeLimit !== undefined) {
      args.push('-timelimit', options.timeLimit.toString());
    }

    if (options.siginfo) {
      args.push('-siginfo');
    }

    if (options.delayOnSignal !== undefined) {
      args.push('-delayonsignal', options.delayOnSignal.toString());
    }

    if (options.threadPriorityThreshold !== undefined) {
      args.push('-threadprioritythreshold', options.threadPriorityThreshold.toString());
    }

    if (options.noThrottle) {
      args.push('-nothrottle');
    }

    if (options.noProcessingWhileSampling) {
      args.push('-noProcessingWhileSampling');
    }

    // Output options
    if (options.stdout) {
      args.push('-stdout');
    }

    if (options.noFile) {
      args.push('-noFile');
    }

    if (options.noBinary) {
      args.push('-noBinary');
    }

    if (options.noText) {
      args.push('-noText');
    }

    if (options.open) {
      args.push('-open', options.open);
    }

    if (options.reveal) {
      args.push('-reveal');
    }

    // Filter options
    if (options.displayIdleWorkQueueThreads) {
      args.push('-displayIdleWorkQueueThreads');
    }

    if (options.aggregateCallTreesByThread) {
      args.push('-aggregateCallTreesByThread');
    }

    if (options.aggregateCallTreesByProcess) {
      args.push('-aggregateCallTreesByProcess');
    }

    if (options.omitFramesBelowSampleCount !== undefined) {
      args.push('-omitFramesBelowSampleCount', options.omitFramesBelowSampleCount.toString());
    }

    // Microstackshot options
    if (options.microstackshots) {
      args.push('-microstackshots');
    }

    if (options.microstackshotsIo) {
      args.push('-microstackshots_io');
    }

    if (options.microstackshotsDatastore) {
      args.push('-microstackshots_datastore', options.microstackshotsDatastore);
    }

    if (options.microstackshoptsSave) {
      args.push('-microstackshots_save');
    }

    if (options.microstackshotsStartTime !== undefined) {
      args.push('-microstackshots_starttime', options.microstackshotsStartTime.toString());
    }

    if (options.microstackshotsEndTime !== undefined) {
      args.push('-microstackshots_endtime', options.microstackshotsEndTime.toString());
    }

    if (options.microstackshoptsPid !== undefined) {
      args.push('-microstackshots_pid', options.microstackshoptsPid.toString());
    }

    if (options.microstackshotsThreadId !== undefined) {
      args.push('-microstackshots_threadid', options.microstackshotsThreadId.toString());
    }

    if (options.microstackshoptsDscPath) {
      args.push('-microstackshots_dsc_path', options.microstackshoptsDscPath);
    }

    if (options.batteryOnly) {
      args.push('-batteryonly');
    }

    if (options.acOnly) {
      args.push('-aconly');
    }

    if (options.userIdleOnly) {
      args.push('-useridleonly');
    }

    if (options.userActiveOnly) {
      args.push('-useractiveonly');
    }

    return args;
  }

  public async run(options: SpindumpOptions = {}): Promise<SpindumpResult> {
    return new Promise((resolve, reject) => {
      const args = this.buildCommand(options);
      
      // Determine if we need sudo
      const needsSudo = this.isLiveSampling(options) && this.needsRootPrivileges();
      const shouldUseSudo = needsSudo && (options.autoSudo !== false);
      
      let command: string;
      let finalArgs: string[];
      
      if (shouldUseSudo) {
        command = 'sudo';
        const sudoArgs = [];
        
        if (options.sudoPrompt) {
          sudoArgs.push('-p', options.sudoPrompt);
        }
        
        finalArgs = [...sudoArgs, 'spindump', ...args];
      } else {
        command = 'spindump';
        finalArgs = args;
      }

      const child = spawn(command, finalArgs, {
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code: number | null) => {
        const result: SpindumpResult = {
          output: stdout,
          exitCode: code ?? -1,
          stderr: stderr || undefined,
        };

        if (code === 0) {
          resolve(result);
        } else {
          // Provide helpful error messages
          let errorMessage = `spindump exited with code ${code}`;
          
          if (stderr) {
            errorMessage += `: ${stderr}`;
          }
          
          if (needsSudo && !shouldUseSudo) {
            errorMessage += '\n\nHint: This operation requires root privileges. Try setting { autoSudo: true } in options.';
          }
          
          reject(new Error(errorMessage));
        }
      });

      child.on('error', (error: NodeJS.ErrnoException) => {
        let errorMessage = `Failed to spawn ${command}: ${error.message}`;
        
        if (error.code === 'ENOENT' && command === 'sudo') {
          errorMessage += '\n\nHint: sudo is not available. Please run as root or install sudo.';
        } else if (error.code === 'ENOENT' && command === 'spindump') {
          errorMessage += '\n\nHint: spindump command not found. Make sure you are running on macOS.';
        }
        
        reject(new Error(errorMessage));
      });
    });
  }

  public static async sample(
    target?: SpindumpTarget, 
    duration?: number, 
    interval?: number,
    autoSudo: boolean = true
  ): Promise<SpindumpResult> {
    const spindump = new Spindump();
    return spindump.run({ 
      target, 
      duration, 
      interval, 
      autoSudo,
      sudoPrompt: '🔬 spindump-node requires root privileges: '
    });
  }

  public static async parseFile(inputPath: string, format?: SpindumpFormat): Promise<SpindumpResult> {
    const spindump = new Spindump();
    return spindump.run({ inputPath, format, stdout: true });
  }

  public static async sampleAndParse(
    target?: SpindumpTarget, 
    duration?: number, 
    interval?: number,
    autoSudo: boolean = true
  ): Promise<ParsedSpindumpReport> {
    const spindump = new Spindump();
    const result = await spindump.run({ 
      target, 
      duration, 
      interval, 
      autoSudo,
      stdout: true,
      noFile: true,
      sudoPrompt: '🔬 spindump-node requires root privileges: '
    });
    
    return spindump.parse(result.output);
  }

  public static async parseFileAndGet(inputPath: string, format?: SpindumpFormat): Promise<ParsedSpindumpReport> {
    const spindump = new Spindump();
    const result = await spindump.run({ inputPath, format, stdout: true });
    return spindump.parse(result.output);
  }

  public static parseText(spindumpOutput: string): ParsedSpindumpReport {
    const spindump = new Spindump();
    return spindump.parse(spindumpOutput);
  }
}

export class SpindumpWatcher {
  private options: SpindumpWatcherOptions;
  private isWatching: boolean = false;
  private sampleHistory: ParsedSpindumpReport[] = [];
  private analysisHistory: SampleAnalysis[] = [];
  private currentSample: number = 0;
  private spindump: Spindump;
  private intervalId?: NodeJS.Timeout;

  constructor(options: SpindumpWatcherOptions = {}) {
    this.options = {
      pollInterval: 5000, // 5 seconds
      sampleDuration: 2, // 2 seconds
      sampleInterval: 50, // 50ms
      maxSamples: 10,
      autoSudo: true,
      ...options
    };
    this.spindump = new Spindump();
  }

  public async start(): Promise<void> {
    if (this.isWatching) {
      throw new Error('Watcher is already running');
    }

    this.isWatching = true;
    this.currentSample = 0;
    console.log(`🔍 Starting spindump watcher (polling every ${this.options.pollInterval}ms)`);
    
    // Take initial sample
    await this.takeSample();
    
    // Set up polling
    this.intervalId = setInterval(async () => {
      if (this.isWatching) {
        await this.takeSample();
      }
    }, this.options.pollInterval);
  }

  public stop(): void {
    if (!this.isWatching) {
      return;
    }

    this.isWatching = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('⏹️  Spindump watcher stopped');
  }

  public getHistory(): SampleAnalysis[] {
    return [...this.analysisHistory];
  }

  public getLatestAnalysis(): SampleAnalysis | undefined {
    return this.analysisHistory[this.analysisHistory.length - 1];
  }

  private async takeSample(): Promise<void> {
    try {
      const startTime = Date.now();
      
      const report = await this.spindump.run({
        target: this.options.target,
        duration: this.options.sampleDuration,
        interval: this.options.sampleInterval,
        autoSudo: this.options.autoSudo,
        stdout: true,
        noFile: true,
        format: 'heavy'
      });

      const parsed = this.spindump.parse(report.output);
      const analysis = this.analyzeReport(parsed);
      
      // Store in history
      this.sampleHistory.push(parsed);
      this.analysisHistory.push(analysis);
      
      // Trim history if needed
      if (this.options.maxSamples && this.sampleHistory.length > this.options.maxSamples) {
        this.sampleHistory.shift();
        this.analysisHistory.shift();
      }

      const duration = Date.now() - startTime;
      console.log(`📊 Sample ${analysis.sampleNumber} completed in ${duration}ms`);
      
      // Call user callback
      if (this.options.onSample) {
        this.options.onSample(parsed, analysis);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Sample failed:`, errorMsg);
      if (this.options.onError) {
        this.options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private analyzeReport(report: ParsedSpindumpReport): SampleAnalysis {
    this.currentSample++;
    
    const targetProcess = this.options.target 
      ? this.findTargetProcess(report) 
      : undefined;

    const systemMetrics: SystemMetrics = {
      activeCpus: report.header.activeCpus || 0,
      memorySize: report.header.memorySize || 'Unknown',
      freeDiskSpace: report.header.freeDiskSpace,
      fanSpeed: report.header.fanSpeed,
      totalCpuTime: report.header.totalCpuTime,
      advisoryLevels: report.header.advisoryLevels
    };

    const analysis: SampleAnalysis = {
      timestamp: new Date(),
      sampleNumber: this.currentSample,
      processCount: report.processes.length,
      targetProcess: targetProcess ? this.analyzeProcess(targetProcess) : undefined,
      systemMetrics,
      changes: this.compareWithPrevious(report)
    };

    return analysis;
  }

  private findTargetProcess(report: ParsedSpindumpReport): SpindumpProcess | undefined {
    if (!this.options.target) return undefined;
    
    if (typeof this.options.target === 'number') {
      return report.processes.find(p => p.pid === this.options.target);
    } else if (typeof this.options.target === 'string' && this.options.target !== '-notarget') {
      return report.processes.find(p => p.name.includes(this.options.target as string));
    }
    
    return undefined;
  }

  private analyzeProcess(process: SpindumpProcess): ProcessAnalysis {
    // Calculate hot functions across all threads
    const functionCounts = new Map<string, { count: number; library?: string }>();
    let totalSamples = 0;

    process.threads.forEach(thread => {
      thread.stackFrames.forEach(frame => {
        if (frame.count) {
          const key = frame.function;
          const existing = functionCounts.get(key) || { count: 0 };
          functionCounts.set(key, {
            count: existing.count + frame.count,
            library: frame.library || existing.library
          });
          totalSamples += frame.count;
        }
      });
    });

    // Sort and get top functions
    const hotFunctions: HotFunction[] = Array.from(functionCounts.entries())
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([func, data]) => ({
        function: func,
        library: data.library,
        sampleCount: data.count,
        percentage: totalSamples > 0 ? (data.count / totalSamples) * 100 : 0
      }));

    // Analyze thread activity
    const threadActivity: ThreadActivity[] = process.threads.map(thread => {
      const topFrame = thread.stackFrames.find(f => f.count && f.count > 0);
      const sampleCount = thread.stackFrames.reduce((sum, f) => sum + (f.count || 0), 0);
      
      // Determine thread state based on top function
      let state: 'running' | 'blocked' | 'unknown' = 'unknown';
      if (topFrame) {
        const func = topFrame.function.toLowerCase();
        if (func.includes('kevent') || func.includes('wait') || func.includes('sleep') || func.includes('blocked')) {
          state = 'blocked';
        } else if (topFrame.isKernel || func.includes('run') || func.includes('exec')) {
          state = 'running';
        }
      }

      return {
        threadId: thread.threadId,
        name: thread.threadName || thread.dispatchQueue,
        sampleCount,
        topFunction: topFrame?.function || 'Unknown',
        state
      };
    });

    return {
      name: process.name,
      pid: process.pid,
      footprint: process.footprint || 'Unknown',
      threadCount: process.numThreads || process.threads.length,
      cpuTime: process.cpuTime,
      hotFunctions,
      threadActivity
    };
  }

  private compareWithPrevious(current: ParsedSpindumpReport): SampleComparison | undefined {
    if (this.sampleHistory.length === 0) {
      return undefined;
    }

    const previous = this.sampleHistory[this.sampleHistory.length - 1];
    if (!previous) return undefined;
    
    const processCountDelta = current.processes.length - previous.processes.length;
    
    // Find target process in both samples for detailed comparison
    const currentTarget = this.findTargetProcess(current);
    const previousTarget = this.findTargetProcess(previous);
    
    let footprintDelta: string | undefined;
    let newThreads: string[] = [];
    let exitedThreads: string[] = [];
    
    if (currentTarget && previousTarget) {
      // Compare footprints (basic string comparison for now)
      if (currentTarget.footprint !== previousTarget.footprint) {
        footprintDelta = `${previousTarget.footprint} → ${currentTarget.footprint}`;
      }
      
      // Compare threads
      const currentThreadIds = new Set(currentTarget.threads.map(t => t.threadId));
      const previousThreadIds = new Set(previousTarget.threads.map(t => t.threadId));
      
      newThreads = currentTarget.threads
        .filter(t => !previousThreadIds.has(t.threadId))
        .map(t => t.threadId);
        
      exitedThreads = previousTarget.threads
        .filter(t => !currentThreadIds.has(t.threadId))
        .map(t => t.threadId);
    }

    return {
      processCountDelta,
      footprintDelta,
      newThreads,
      exitedThreads,
      functionChanges: [] // TODO: Implement function-level comparison
    };
  }
}

export default Spindump;