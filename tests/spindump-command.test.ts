import { describe, it, expect } from 'vitest';
import { Spindump } from '../src/index.js';

describe('Spindump Command Building', () => {
  let spindump: Spindump;

  beforeEach(() => {
    spindump = new Spindump();
  });

  describe('buildCommand', () => {
    it('should build basic command with no options', () => {
      const args = (spindump as any).buildCommand({});
      expect(args).toEqual([]);
    });

    it('should handle target options correctly', () => {
      const pidArgs = (spindump as any).buildCommand({ target: 1234 });
      expect(pidArgs).toContain('1234');

      const nameArgs = (spindump as any).buildCommand({ target: 'node' });
      expect(nameArgs).toContain('node');

      const noTargetArgs = (spindump as any).buildCommand({ target: '-notarget' });
      expect(noTargetArgs).toContain('-notarget');
    });

    it('should handle timing options correctly', () => {
      const args = (spindump as any).buildCommand({ 
        duration: 5, 
        interval: 100 
      });
      
      expect(args).toContain('5');
      expect(args).toContain('100');
    });

    it('should handle file options correctly', () => {
      const args = (spindump as any).buildCommand({
        inputPath: '/path/to/input.spindump',
        outputPath: '/path/to/output.spindump',
        startIndex: 1,
        endIndex: 10
      });

      expect(args).toContain('-i');
      expect(args).toContain('/path/to/input.spindump');
      expect(args).toContain('-o');
      expect(args).toContain('/path/to/output.spindump');
      expect(args).toContain('-startIndex');
      expect(args).toContain('1');
      expect(args).toContain('-endIndex');
      expect(args).toContain('10');
    });

    it('should handle index range option correctly', () => {
      const args = (spindump as any).buildCommand({
        indexRange: { start: 5, end: 15 }
      });

      expect(args).toContain('-indexRange');
      expect(args).toContain('5-15');
    });

    it('should handle format options correctly', () => {
      const heavyArgs = (spindump as any).buildCommand({ format: 'heavy' });
      expect(heavyArgs).toContain('-heavy');

      const timelineArgs = (spindump as any).buildCommand({ format: 'timeline' });
      expect(timelineArgs).toContain('-timeline');
    });

    it('should handle display filter options correctly', () => {
      const args = (spindump as any).buildCommand({
        onlyRunnable: true,
        onlyBlocked: true,
        onlyTarget: true,
        sampleWithoutTarget: true
      });

      expect(args).toContain('-onlyRunnable');
      expect(args).toContain('-onlyBlocked');
      expect(args).toContain('-onlyTarget');
      expect(args).toContain('-sampleWithoutTarget');
    });

    it('should handle additional processes correctly', () => {
      const args = (spindump as any).buildCommand({
        additionalProcs: [123, 456, 'processName']
      });

      expect(args).toContain('-proc');
      expect(args).toContain('123');
      expect(args).toContain('-proc');
      expect(args).toContain('456');
      expect(args).toContain('-proc');
      expect(args).toContain('processName');
    });

    it('should handle control options correctly', () => {
      const args = (spindump as any).buildCommand({
        wait: true,
        timeLimit: 300,
        siginfo: true,
        delayOnSignal: 5,
        threadPriorityThreshold: 10,
        noThrottle: true,
        noProcessingWhileSampling: true
      });

      expect(args).toContain('-wait');
      expect(args).toContain('-timelimit');
      expect(args).toContain('300');
      expect(args).toContain('-siginfo');
      expect(args).toContain('-delayonsignal');
      expect(args).toContain('5');
      expect(args).toContain('-threadprioritythreshold');
      expect(args).toContain('10');
      expect(args).toContain('-nothrottle');
      expect(args).toContain('-noProcessingWhileSampling');
    });

    it('should handle output options correctly', () => {
      const args = (spindump as any).buildCommand({
        stdout: true,
        noFile: true,
        noBinary: true,
        noText: true,
        open: 'application',
        reveal: true
      });

      expect(args).toContain('-stdout');
      expect(args).toContain('-noFile');
      expect(args).toContain('-noBinary');
      expect(args).toContain('-noText');
      expect(args).toContain('-open');
      expect(args).toContain('application');
      expect(args).toContain('-reveal');
    });

    it('should handle filter options correctly', () => {
      const args = (spindump as any).buildCommand({
        displayIdleWorkQueueThreads: true,
        aggregateCallTreesByThread: true,
        aggregateCallTreesByProcess: true,
        omitFramesBelowSampleCount: 5
      });

      expect(args).toContain('-displayIdleWorkQueueThreads');
      expect(args).toContain('-aggregateCallTreesByThread');
      expect(args).toContain('-aggregateCallTreesByProcess');
      expect(args).toContain('-omitFramesBelowSampleCount');
      expect(args).toContain('5');
    });

    it('should handle microstackshot options correctly', () => {
      const args = (spindump as any).buildCommand({
        microstackshots: true,
        microstackshotsIo: true,
        microstackshotsDatastore: '/path/to/datastore',
        microstackshoptsSave: true,
        microstackshotsStartTime: 1234567890,
        microstackshotsEndTime: '2023-01-01',
        microstackshoptsPid: 123,
        microstackshotsThreadId: 456,
        microstackshoptsDscPath: '/path/to/dsc',
        batteryOnly: true,
        acOnly: true,
        userIdleOnly: true,
        userActiveOnly: true
      });

      expect(args).toContain('-microstackshots');
      expect(args).toContain('-microstackshots_io');
      expect(args).toContain('-microstackshots_datastore');
      expect(args).toContain('/path/to/datastore');
      expect(args).toContain('-microstackshots_save');
      expect(args).toContain('-microstackshots_starttime');
      expect(args).toContain('1234567890');
      expect(args).toContain('-microstackshots_endtime');
      expect(args).toContain('2023-01-01');
      expect(args).toContain('-microstackshots_pid');
      expect(args).toContain('123');
      expect(args).toContain('-microstackshots_threadid');
      expect(args).toContain('456');
      expect(args).toContain('-microstackshots_dsc_path');
      expect(args).toContain('/path/to/dsc');
      expect(args).toContain('-batteryonly');
      expect(args).toContain('-aconly');
      expect(args).toContain('-useridleonly');
      expect(args).toContain('-useractiveonly');
    });

    it('should build complex command with multiple options', () => {
      const args = (spindump as any).buildCommand({
        target: 'node',
        duration: 5,
        format: 'heavy',
        stdout: true,
        noFile: true,
        additionalProcs: [123, 'otherProcess'],
        onlyRunnable: true,
        threadPriorityThreshold: 15
      });

      expect(args).toContain('node');
      expect(args).toContain('5');
      expect(args).toContain('-heavy');
      expect(args).toContain('-stdout');
      expect(args).toContain('-noFile');
      expect(args).toContain('-proc');
      expect(args).toContain('123');
      expect(args).toContain('-proc');
      expect(args).toContain('otherProcess');
      expect(args).toContain('-onlyRunnable');
      expect(args).toContain('-threadprioritythreshold');
      expect(args).toContain('15');
    });
  });

  describe('command validation helpers', () => {
    it('should identify live sampling correctly', () => {
      const isLive1 = (spindump as any).isLiveSampling({});
      expect(isLive1).toBe(true);

      const isLive2 = (spindump as any).isLiveSampling({ target: 'node' });
      expect(isLive2).toBe(true);

      const isNotLive = (spindump as any).isLiveSampling({ inputPath: '/path/to/file' });
      expect(isNotLive).toBe(false);
    });

    it('should check root privileges correctly', () => {
      const needsRoot = (spindump as any).needsRootPrivileges();
      expect(typeof needsRoot).toBe('boolean');
    });
  });
});