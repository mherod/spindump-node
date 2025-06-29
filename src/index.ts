// noinspection JSUnusedGlobalSymbols

import { spawn } from 'node:child_process';

// Regex patterns defined at top level for performance
const PROCESS_REFERENCE_REGEX = /^(.+?)\s+\[(\d+)](?:\s+\[unique pid (\d+)])?/;
const BATTERY_REGEX = /Battery\s*->\s*(\d+)/;
const USER_REGEX = /User\s*->\s*(\d+)/;
const THERMAL_REGEX = /ThermalPressure\s*->\s*(\d+)/;
const COMBINED_REGEX = /Combined\s*->\s*(\d+)/;
const COUNT_MATCH_REGEX = /^(\d+)\s+(.+)$/;
const FULL_MATCH_REGEX =
  /^(.+?)\s+\+\s+(\d+)\s+\((.+?)\s+\+\s+(\d+)\)\s+\[([0-9a-fx]+)](?:\s+(.+))?$/;
const SIMPLE_MATCH_REGEX = /^(.+?)\s+\[([0-9a-fx]+)](?:\s+(.+))?$/;
const STEPS_REGEX = /(\d+)\s+\((.+?)\)/;
const PROCESS_REGEX = /Process:\s+(.+?)\s+\[(\d+)](?:\s+\[unique pid (\d+)])?/;
const THREAD_REGEX =
  /Thread\s+(0x[0-9a-f]+)(?:\s+DispatchQueue\s+"?([^"]+)"?(?:\(\d+\))?)?(?:\s+Thread name\s+"([^"]+)")?.*?(\d+)\s+samples\s+\(([^)]+)\).*?priority\s+(\d+)/;
const THREAD_MATCH_REGEX = /^\s*Thread\s+0x[0-9a-f]+/;
const STACK_FRAME_DIGITS_REGEX = /^\s*\d+\s+/;
const STACK_FRAME_KERNEL_REGEX = /^\s*\*\d+\s+/;
const STACK_FRAME_SPACES_REGEX = /^\s+/;
const BINARY_IMAGE_START_REGEX = /^\s*0x[0-9a-f]+/;
const BINARY_IMAGE_REGEX =
  /^\s*(0x[0-9a-f]+\s*-\s*(?:0x[0-9a-f]+|\?\?\?))\s+(.+?)\s+<([^>]+)>\s+(.+)$/;
const BINARY_IMAGE_VERSION_REGEX = /^(.+?)\s+\(([^)]+)\)$/;

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

export interface SpindumpOptions
  extends SpindumpBasicOptions,
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
    const match = text.match(PROCESS_REFERENCE_REGEX);
    if (!(match?.[1] && match[2])) {
      return;
    }

    return {
      name: match[1].trim(),
      pid: Number.parseInt(match[2], 10),
      uniquePid: match[3] ? Number.parseInt(match[3], 10) : undefined,
    };
  }

  private parseAdvisoryLevels(text: string): AdvisoryLevels {
    // Parse "Battery -> 2, User -> 2, ThermalPressure -> 0, Combined -> 2"
    const defaults = { battery: 0, user: 0, thermalPressure: 0, combined: 0 };

    const batteryMatch = text.match(BATTERY_REGEX);
    const userMatch = text.match(USER_REGEX);
    const thermalMatch = text.match(THERMAL_REGEX);
    const combinedMatch = text.match(COMBINED_REGEX);

    return {
      battery: batteryMatch?.[1] ? Number.parseInt(batteryMatch[1], 10) : defaults.battery,
      user: userMatch?.[1] ? Number.parseInt(userMatch[1], 10) : defaults.user,
      thermalPressure: thermalMatch?.[1]
        ? Number.parseInt(thermalMatch[1], 10)
        : defaults.thermalPressure,
      combined: combinedMatch?.[1] ? Number.parseInt(combinedMatch[1], 10) : defaults.combined,
    };
  }

  private parseStackFrame(line: string): StackFrame | null {
    const trimmed = line.trim();
    if (!trimmed) {
      return null;
    }

    // Count leading spaces for indent level
    const indentLevel = line.length - line.trimStart().length;

    // Handle kernel frames (start with *)
    const isKernel = trimmed.startsWith('*');
    const cleanLine = isKernel ? trimmed.substring(1) : trimmed;

    // Parse different formats:
    // "21  start + 6076 (dyld + 27544) [0x197bcab98]"
    // "21  start + 6076 (dyld + 27544) [0x197bcab98] 1-61"

    const countMatch = cleanLine.match(COUNT_MATCH_REGEX);
    if (!(countMatch?.[1] && countMatch[2])) {
      // No count, might be a continuation or different format
      return {
        indentLevel,
        function: cleanLine,
        isKernel,
      };
    }

    const count = Number.parseInt(countMatch[1], 10);
    const rest = countMatch[2];

    // Try to parse full format: "function + offset (library + libraryOffset) [address] range"
    const fullMatch = rest.match(FULL_MATCH_REGEX);
    if (fullMatch?.[1]) {
      return {
        count,
        indentLevel,
        function: fullMatch[1],
        offset: fullMatch[2] || undefined,
        library: fullMatch[3] || undefined,
        libraryOffset: fullMatch[4] || undefined,
        address: fullMatch[5] || undefined,
        sampleRange: fullMatch[6] || undefined,
        isKernel,
      };
    }

    // Simpler format without library info
    const simpleMatch = rest.match(SIMPLE_MATCH_REGEX);
    if (simpleMatch?.[1]) {
      return {
        count,
        indentLevel,
        function: simpleMatch[1],
        address: simpleMatch[2] || undefined,
        sampleRange: simpleMatch[3] || undefined,
        isKernel,
      };
    }

    return {
      count,
      indentLevel,
      function: rest,
      isKernel,
    };
  }

  private parseBasicHeaderFields(line: string, header: Partial<SpindumpHeader>): boolean {
    if (line.startsWith('Date/Time:')) {
      header.dateTime = line.substring('Date/Time:'.length).trim();
      return true;
    }
    if (line.startsWith('End time:')) {
      header.endTime = line.substring('End time:'.length).trim();
      return true;
    }
    if (line.startsWith('OS Version:')) {
      header.osVersion = line.substring('OS Version:'.length).trim();
      return true;
    }
    if (line.startsWith('Architecture:') && !header.architecture) {
      header.architecture = line.substring('Architecture:'.length).trim();
      return true;
    }
    if (line.startsWith('Report Version:')) {
      header.reportVersion = Number.parseInt(line.substring('Report Version:'.length).trim(), 10);
      return true;
    }
    if (line.startsWith('Duration:')) {
      header.duration = line.substring('Duration:'.length).trim();
      return true;
    }
    return false;
  }

  private parseSystemHeaderFields(line: string, header: Partial<SpindumpHeader>): boolean {
    if (line.startsWith('Hardware model:')) {
      header.hardwareModel = line.substring('Hardware model:'.length).trim();
      return true;
    }
    if (line.startsWith('Active cpus:')) {
      header.activeCpus = Number.parseInt(line.substring('Active cpus:'.length).trim(), 10);
      return true;
    }
    if (line.startsWith('Memory size:')) {
      header.memorySize = line.substring('Memory size:'.length).trim();
      return true;
    }
    if (line.startsWith('Steps:')) {
      const stepsText = line.substring('Steps:'.length).trim();
      const match = stepsText.match(STEPS_REGEX);
      if (match?.[1] && match[2]) {
        header.steps = Number.parseInt(match[1], 10);
        header.samplingInterval = match[2];
      }
      return true;
    }
    return false;
  }

  private parseHeaderLine(line: string, header: Partial<SpindumpHeader>): SpindumpFormat | null {
    if (this.parseBasicHeaderFields(line, header)) {
      return null;
    }
    if (this.parseSystemHeaderFields(line, header)) {
      return null;
    }

    if (line.startsWith('Advisory levels:')) {
      header.advisoryLevels = this.parseAdvisoryLevels(
        line.substring('Advisory levels:'.length).trim()
      );
    } else if (line.startsWith('Parent:')) {
      header.parent = this.parseProcessReference(line.substring('Parent:'.length).trim());
    } else if (line.startsWith('Responsible:')) {
      header.responsible = this.parseProcessReference(line.substring('Responsible:'.length).trim());
    } else if (line.trim().includes('format: stacks are sorted by count')) {
      return 'heavy';
    } else if (line.trim().includes('format: stacks are sorted chronologically')) {
      return 'timeline';
    }
    return null;
  }

  private createNewProcess(
    line: string,
    currentProcess: Partial<SpindumpProcess> | null,
    processes: SpindumpProcess[]
  ): Partial<SpindumpProcess> | null {
    // Save previous process
    if (currentProcess?.name) {
      processes.push(currentProcess as SpindumpProcess);
    }

    // Start new process
    const processMatch = line.match(PROCESS_REGEX);
    if (processMatch?.[1] && processMatch[2]) {
      return {
        name: processMatch[1],
        pid: Number.parseInt(processMatch[2], 10),
        uniquePid: processMatch[3] ? Number.parseInt(processMatch[3], 10) : undefined,
        threads: [],
        binaryImages: [],
      };
    }
    return null;
  }

  private parseProcessLine(
    line: string,
    currentProcess: Partial<SpindumpProcess> | null,
    processes: SpindumpProcess[]
  ): { process: Partial<SpindumpProcess> | null; inBinaryImages: boolean } {
    if (line.startsWith('Process:')) {
      const newProcess = this.createNewProcess(line, currentProcess, processes);
      return { process: newProcess, inBinaryImages: false };
    }

    if (!currentProcess) {
      return { process: currentProcess, inBinaryImages: false };
    }

    if (line.startsWith('Path:')) {
      currentProcess.path = line.substring('Path:'.length).trim();
    } else if (line.startsWith('UUID:')) {
      currentProcess.uuid = line.substring('UUID:'.length).trim();
    } else if (line.startsWith('Footprint:')) {
      currentProcess.footprint = line.substring('Footprint:'.length).trim();
    } else if (line.startsWith('Num threads:')) {
      currentProcess.numThreads = Number.parseInt(line.substring('Num threads:'.length).trim(), 10);
    }
    return { process: currentProcess, inBinaryImages: false };
  }

  private handleThreadLine(
    line: string,
    currentThread: Partial<SpindumpThread> | null,
    currentProcess: Partial<SpindumpProcess> | null
  ): Partial<SpindumpThread> | null {
    if (line.match(THREAD_MATCH_REGEX)) {
      // Save previous thread
      if (currentThread?.threadId && currentProcess) {
        currentProcess.threads?.push(currentThread as SpindumpThread);
      }

      // Parse thread header
      const threadMatch = line.match(THREAD_REGEX);
      if (threadMatch) {
        return {
          threadId: threadMatch[1],
          dispatchQueue: threadMatch[2],
          threadName: threadMatch[3],
          samples: `${threadMatch[4]} (${threadMatch[5]})`,
          priority: threadMatch[6],
          stackFrames: [],
        };
      }
    }
    return currentThread;
  }

  private handleBinaryImageLine(
    line: string,
    inBinaryImages: boolean,
    currentThread: Partial<SpindumpThread> | null,
    currentProcess: Partial<SpindumpProcess> | null
  ): { inBinaryImages: boolean; currentThread: Partial<SpindumpThread> | null } {
    if (line.trim() === 'Binary Images:') {
      // Save current thread if exists
      if (currentThread?.threadId && currentProcess) {
        currentProcess.threads?.push(currentThread as SpindumpThread);
      }
      return { inBinaryImages: true, currentThread: null };
    }

    if (inBinaryImages && currentProcess && line.match(BINARY_IMAGE_START_REGEX)) {
      const binaryMatch = line.match(BINARY_IMAGE_REGEX);
      if (binaryMatch?.[1] && binaryMatch[2] && binaryMatch[3] && binaryMatch[4]) {
        // Parse name and version from the middle part
        const nameVersionPart = binaryMatch[2].trim();
        const versionMatch = nameVersionPart.match(BINARY_IMAGE_VERSION_REGEX);

        let name = nameVersionPart;
        let version = '';

        if (versionMatch?.[1] && versionMatch[2]) {
          name = versionMatch[1].trim();
          version = versionMatch[2].trim();
        }

        currentProcess.binaryImages?.push({
          addressRange: binaryMatch[1].trim(),
          name,
          version,
          uuid: binaryMatch[3].trim(),
          path: binaryMatch[4].trim(),
        });
      }
    }
    return { inBinaryImages, currentThread };
  }

  private isProcessLine(line: string, currentProcess: Partial<SpindumpProcess> | null): boolean {
    return (
      line.startsWith('Process:') ||
      ((line.startsWith('Path:') ||
        line.startsWith('UUID:') ||
        line.startsWith('Footprint:') ||
        line.startsWith('Num threads:')) &&
        Boolean(currentProcess))
    );
  }

  private isStackFrameLine(line: string): boolean {
    // Don't treat "Binary Images:" as a stack frame line
    if (line.trim() === 'Binary Images:') {
      return false;
    }

    return (
      line.match(STACK_FRAME_DIGITS_REGEX) !== null ||
      line.match(STACK_FRAME_KERNEL_REGEX) !== null ||
      line.match(STACK_FRAME_SPACES_REGEX) !== null
    );
  }

  private processLine(
    line: string,
    state: {
      header: Partial<SpindumpHeader>;
      processes: SpindumpProcess[];
      currentProcess: Partial<SpindumpProcess> | null;
      currentThread: Partial<SpindumpThread> | null;
      inBinaryImages: boolean;
      format: SpindumpFormat;
    }
  ): void {
    // Parse header information
    const headerFormat = this.parseHeaderLine(line, state.header);
    if (headerFormat) {
      state.format = headerFormat;
      return;
    }

    // Parse process information
    if (this.isProcessLine(line, state.currentProcess)) {
      const result = this.parseProcessLine(line, state.currentProcess, state.processes);
      state.currentProcess = result.process;
      state.inBinaryImages = result.inBinaryImages;
      return;
    }

    // Parse thread information
    const newThread = this.handleThreadLine(line, state.currentThread, state.currentProcess);
    if (newThread !== state.currentThread) {
      state.currentThread = newThread;
      return;
    }

    // Parse stack frames
    if (state.currentThread && this.isStackFrameLine(line)) {
      const frame = this.parseStackFrame(line);
      if (frame) {
        state.currentThread.stackFrames?.push(frame);
      }
      return;
    }

    // Parse binary images
    const binaryResult = this.handleBinaryImageLine(
      line,
      state.inBinaryImages,
      state.currentThread,
      state.currentProcess
    );
    state.inBinaryImages = binaryResult.inBinaryImages;
    state.currentThread = binaryResult.currentThread;
  }

  parse(spindumpOutput: string): ParsedSpindumpReport {
    const lines = spindumpOutput.split('\n');
    const state = {
      header: {} as Partial<SpindumpHeader>,
      processes: [] as SpindumpProcess[],
      currentProcess: null as Partial<SpindumpProcess> | null,
      currentThread: null as Partial<SpindumpThread> | null,
      inBinaryImages: false,
      format: 'heavy' as SpindumpFormat,
    };

    for (const line of lines) {
      if (line?.trim()) {
        this.processLine(line, state);
      }
    }

    // Save final process
    if (state.currentProcess?.name) {
      if (state.currentThread?.threadId) {
        state.currentProcess.threads?.push(state.currentThread as SpindumpThread);
      }
      state.processes.push(state.currentProcess as SpindumpProcess);
    }

    return {
      header: state.header as SpindumpHeader,
      format: state.format,
      processes: state.processes,
      raw: spindumpOutput,
    };
  }

  private addBasicArgs(args: string[], options: SpindumpOptions): void {
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
  }

  private addFileArgs(args: string[], options: SpindumpOptions): void {
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
  }

  private addDisplayArgs(args: string[], options: SpindumpOptions): void {
    if (options.format === 'heavy') {
      args.push('-heavy');
    } else if (options.format === 'timeline') {
      args.push('-timeline');
    }

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
      for (const proc of options.additionalProcs) {
        args.push('-proc', proc.toString());
      }
    }

    if (options.sampleWithoutTarget) {
      args.push('-sampleWithoutTarget');
    }
  }

  private addControlArgs(args: string[], options: SpindumpOptions): void {
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
  }

  private addOutputArgs(args: string[], options: SpindumpOptions): void {
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
  }

  private addFilterArgs(args: string[], options: SpindumpOptions): void {
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
  }

  private addMicrostackshotArgs(args: string[], options: SpindumpOptions): void {
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
  }

  private buildCommand(options: SpindumpOptions): string[] {
    const args: string[] = [];

    this.addBasicArgs(args, options);
    this.addFileArgs(args, options);
    this.addDisplayArgs(args, options);
    this.addControlArgs(args, options);
    this.addOutputArgs(args, options);
    this.addFilterArgs(args, options);
    this.addMicrostackshotArgs(args, options);

    return args;
  }

  run(options: SpindumpOptions = {}): Promise<SpindumpResult> {
    // Validate options
    if (options.duration !== undefined && (options.duration < 0 || options.duration > 3600)) {
      throw new Error('Duration must be between 0 and 3600 seconds');
    }

    if (options.interval !== undefined && (options.interval < 1 || options.interval > 1000)) {
      throw new Error('Interval must be between 1 and 1000 milliseconds');
    }

    if (options.inputPath !== undefined && !options.inputPath.trim()) {
      throw new Error('Input path cannot be empty');
    }

    return new Promise((resolve, reject) => {
      const args = this.buildCommand(options);

      // Determine if we need sudo
      const needsSudo = this.isLiveSampling(options) && this.needsRootPrivileges();
      const shouldUseSudo = needsSudo && options.autoSudo !== false;

      let command: string;
      let finalArgs: string[];

      if (shouldUseSudo) {
        command = 'sudo';
        const sudoArgs: string[] = [];

        if (options.sudoPrompt) {
          sudoArgs.push('-p', options.sudoPrompt);
        }

        finalArgs = [...sudoArgs, 'spindump', ...args];
      } else {
        command = 'spindump';
        finalArgs = args;
      }

      const child = spawn(command, finalArgs, {
        stdio: ['inherit', 'pipe', 'pipe'],
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
            errorMessage +=
              '\n\nHint: This operation requires root privileges. Try setting { autoSudo: true } in options.';
          }

          reject(new Error(errorMessage));
        }
      });

      child.on('error', (error: NodeJS.ErrnoException) => {
        let errorMessage = `Failed to spawn ${command}: ${error.message}`;

        if (error.code === 'ENOENT' && command === 'sudo') {
          errorMessage += '\n\nHint: sudo is not available. Please run as root or install sudo.';
        } else if (error.code === 'ENOENT' && command === 'spindump') {
          errorMessage +=
            '\n\nHint: spindump command not found. Make sure you are running on macOS.';
        }

        reject(new Error(errorMessage));
      });
    });
  }

  static async sample(
    target?: SpindumpTarget,
    duration?: number,
    interval?: number,
    autoSudo = true
  ): Promise<SpindumpResult> {
    const spindump = new Spindump();
    return await spindump.run({
      target,
      duration,
      interval,
      autoSudo,
      sudoPrompt: '🔬 spindump-node requires root privileges: ',
    });
  }

  static async parseFile(inputPath: string, format?: SpindumpFormat): Promise<SpindumpResult> {
    const spindump = new Spindump();
    return await spindump.run({ inputPath, format, stdout: true });
  }

  static async sampleAndParse(
    target?: SpindumpTarget,
    duration?: number,
    interval?: number,
    autoSudo = true
  ): Promise<ParsedSpindumpReport> {
    const spindump = new Spindump();
    const result = await spindump.run({
      target,
      duration,
      interval,
      autoSudo,
      stdout: true,
      noFile: true,
      sudoPrompt: '🔬 spindump-node requires root privileges: ',
    });

    return spindump.parse(result.output);
  }

  static async parseFileAndGet(
    inputPath: string,
    format?: SpindumpFormat
  ): Promise<ParsedSpindumpReport> {
    const spindump = new Spindump();
    const result = await spindump.run({ inputPath, format, stdout: true });
    return spindump.parse(result.output);
  }

  static parseText(spindumpOutput: string): ParsedSpindumpReport {
    const spindump = new Spindump();
    return spindump.parse(spindumpOutput);
  }
}

export class SpindumpWatcher {
  private options: SpindumpWatcherOptions;
  private isWatching = false;
  private sampleHistory: ParsedSpindumpReport[] = [];
  private analysisHistory: SampleAnalysis[] = [];
  private currentSample = 0;
  private spindump: Spindump;
  private intervalId?: NodeJS.Timeout;

  constructor(options: SpindumpWatcherOptions = {}) {
    // Validate watcher options
    if (
      options.pollInterval !== undefined &&
      (options.pollInterval < 1000 || options.pollInterval > 3_600_000)
    ) {
      throw new Error('Poll interval must be between 1 second and 1 hour');
    }

    if (
      options.sampleDuration !== undefined &&
      (options.sampleDuration < 1 || options.sampleDuration > 60)
    ) {
      throw new Error('Sample duration must be between 1 and 60 seconds');
    }

    if (options.maxSamples !== undefined && (options.maxSamples < 1 || options.maxSamples > 1000)) {
      throw new Error('Max samples must be between 1 and 1000');
    }

    this.options = {
      pollInterval: 5000, // 5 seconds
      sampleDuration: 2, // 2 seconds
      sampleInterval: 50, // 50ms
      maxSamples: 10,
      autoSudo: true,
      ...options,
    };
    this.spindump = new Spindump();
  }

  async start(): Promise<void> {
    if (this.isWatching) {
      throw new Error('Watcher is already running');
    }

    this.isWatching = true;
    this.currentSample = 0;

    // Take initial sample
    await this.takeSample();

    // Set up polling
    this.intervalId = setInterval(async () => {
      if (this.isWatching) {
        await this.takeSample();
      }
    }, this.options.pollInterval);
  }

  stop(): void {
    if (!this.isWatching) {
      return;
    }

    this.isWatching = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  getHistory(): SampleAnalysis[] {
    return [...this.analysisHistory];
  }

  getLatestAnalysis(): SampleAnalysis | undefined {
    return this.analysisHistory.at(-1);
  }

  private async takeSample(): Promise<void> {
    try {
      // const startTime = Date.now();

      const report = await this.spindump.run({
        target: this.options.target,
        duration: this.options.sampleDuration,
        interval: this.options.sampleInterval,
        autoSudo: this.options.autoSudo,
        stdout: true,
        noFile: true,
        format: 'heavy',
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

      // const duration = Date.now() - startTime;

      // Call user callback
      if (this.options.onSample) {
        this.options.onSample(parsed, analysis);
      }
    } catch (error) {
      // const errorMsg = error instanceof Error ? error.message : String(error);
      if (this.options.onError) {
        this.options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private analyzeReport(report: ParsedSpindumpReport): SampleAnalysis {
    this.currentSample++;

    const targetProcess = this.options.target ? this.findTargetProcess(report) : undefined;

    const systemMetrics: SystemMetrics = {
      activeCpus: report.header.activeCpus || 0,
      memorySize: report.header.memorySize || 'Unknown',
      freeDiskSpace: report.header.freeDiskSpace,
      fanSpeed: report.header.fanSpeed,
      totalCpuTime: report.header.totalCpuTime,
      advisoryLevels: report.header.advisoryLevels,
    };

    return {
      timestamp: new Date(),
      sampleNumber: this.currentSample,
      processCount: report.processes.length,
      targetProcess: targetProcess ? this.analyzeProcess(targetProcess) : undefined,
      systemMetrics,
      changes: this.compareWithPrevious(report),
    };
  }

  private findTargetProcess(report: ParsedSpindumpReport): SpindumpProcess | undefined {
    if (!this.options.target) {
      return;
    }

    if (typeof this.options.target === 'number') {
      return report.processes.find((p) => p.pid === this.options.target);
    }
    if (this.options.target !== '-notarget') {
      return report.processes.find((p) => p.name.includes(this.options.target as string));
    }

    return;
  }

  private analyzeProcess(process: SpindumpProcess): ProcessAnalysis {
    // Calculate hot functions across all threads
    const functionCounts = new Map<string, { count: number; library?: string }>();
    let totalSamples = 0;

    for (const thread of process.threads) {
      for (const frame of thread.stackFrames) {
        if (frame.count) {
          const key = frame.function;
          const existing = functionCounts.get(key) || { count: 0 };
          functionCounts.set(key, {
            count: existing.count + frame.count,
            library: frame.library || existing.library,
          });
          totalSamples += frame.count;
        }
      }
    }

    // Sort and get top functions
    const hotFunctions: HotFunction[] = Array.from(functionCounts.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([func, data]) => ({
        function: func,
        library: data.library,
        sampleCount: data.count,
        percentage: totalSamples > 0 ? (data.count / totalSamples) * 100 : 0,
      }));

    // Analyze thread activity
    const threadActivity: ThreadActivity[] = process.threads.map((thread) => {
      const topFrame = thread.stackFrames.find((f) => f.count && f.count > 0);
      const sampleCount = thread.stackFrames.reduce((sum, f) => sum + (f.count || 0), 0);

      // Determine thread state based on top function
      let state: 'running' | 'blocked' | 'unknown' = 'unknown';
      if (topFrame) {
        const func = topFrame.function.toLowerCase();
        if (
          func.includes('kevent') ||
          func.includes('wait') ||
          func.includes('sleep') ||
          func.includes('blocked')
        ) {
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
        state,
      };
    });

    return {
      name: process.name,
      pid: process.pid,
      footprint: process.footprint || 'Unknown',
      threadCount: process.numThreads || process.threads.length,
      cpuTime: process.cpuTime,
      hotFunctions,
      threadActivity,
    };
  }

  private compareWithPrevious(current: ParsedSpindumpReport): SampleComparison | undefined {
    if (this.sampleHistory.length === 0) {
      return;
    }

    const previous = this.sampleHistory.at(-1);
    if (!previous) {
      return;
    }

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
      const currentThreadIds = new Set(currentTarget.threads.map((t) => t.threadId));
      const previousThreadIds = new Set(previousTarget.threads.map((t) => t.threadId));

      newThreads = currentTarget.threads
        .filter((t) => !previousThreadIds.has(t.threadId))
        .map((t) => t.threadId);

      exitedThreads = previousTarget.threads
        .filter((t) => !currentThreadIds.has(t.threadId))
        .map((t) => t.threadId);
    }

    return {
      processCountDelta,
      footprintDelta,
      newThreads,
      exitedThreads,
      functionChanges: [], // TODO: Implement function-level comparison
    };
  }
}

// Default export for convenience - allows `import Spindump from 'spindump-node'`
export default Spindump;
