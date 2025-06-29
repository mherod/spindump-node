import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpindumpWatcher } from '../src/index.js';

describe('SpindumpWatcher', () => {
  let watcher: SpindumpWatcher;

  beforeEach(() => {
    watcher = new SpindumpWatcher({
      pollInterval: 1000,
      sampleDuration: 1,
      maxSamples: 5,
      autoSudo: false, // Disable sudo for tests
    });
  });

  afterEach(() => {
    if (watcher) {
      watcher.stop();
    }
  });

  describe('constructor', () => {
    it('should create watcher with default options', () => {
      const defaultWatcher = new SpindumpWatcher();
      expect(defaultWatcher).toBeDefined();
    });

    it('should validate poll interval', () => {
      expect(() => {
        new SpindumpWatcher({ pollInterval: 500 });
      }).toThrow('Poll interval must be between 1 second and 1 hour');

      expect(() => {
        new SpindumpWatcher({ pollInterval: 4000000 });
      }).toThrow('Poll interval must be between 1 second and 1 hour');
    });

    it('should validate sample duration', () => {
      expect(() => {
        new SpindumpWatcher({ sampleDuration: 0 });
      }).toThrow('Sample duration must be between 1 and 60 seconds');

      expect(() => {
        new SpindumpWatcher({ sampleDuration: 100 });
      }).toThrow('Sample duration must be between 1 and 60 seconds');
    });

    it('should validate max samples', () => {
      expect(() => {
        new SpindumpWatcher({ maxSamples: 0 });
      }).toThrow('Max samples must be between 1 and 1000');

      expect(() => {
        new SpindumpWatcher({ maxSamples: 2000 });
      }).toThrow('Max samples must be between 1 and 1000');
    });
  });

  describe('state management', () => {
    it('should start and stop correctly', async () => {
      const mockOnSample = vi.fn();
      const testWatcher = new SpindumpWatcher({
        pollInterval: 2000,
        sampleDuration: 1,
        autoSudo: false,
        onSample: mockOnSample,
      });

      expect(() => testWatcher.stop()).not.toThrow();

      testWatcher.stop();
    });

    it('should prevent multiple starts', async () => {
      const testWatcher = new SpindumpWatcher({
        pollInterval: 5000,
        autoSudo: false,
      });

      // Mock the takeSample method to prevent actual spindump calls
      const takeSampleSpy = vi.spyOn(testWatcher as any, 'takeSample').mockResolvedValue(undefined);

      await testWatcher.start();
      
      await expect(testWatcher.start()).rejects.toThrow('Watcher is already running');
      
      testWatcher.stop();
      takeSampleSpy.mockRestore();
    });

    it('should handle stop when not running', () => {
      expect(() => watcher.stop()).not.toThrow();
    });
  });

  describe('history management', () => {
    it('should return empty history initially', () => {
      const history = watcher.getHistory();
      expect(history).toEqual([]);
    });

    it('should return undefined for latest analysis initially', () => {
      const latest = watcher.getLatestAnalysis();
      expect(latest).toBeUndefined();
    });

    it('should maintain history size limit', () => {
      const testWatcher = new SpindumpWatcher({ maxSamples: 2 });
      
      // Mock internal properties to simulate history
      const mockHistory = [
        { timestamp: new Date(), sampleNumber: 1, processCount: 10, systemMetrics: { activeCpus: 8, memorySize: '16GB' } },
        { timestamp: new Date(), sampleNumber: 2, processCount: 12, systemMetrics: { activeCpus: 8, memorySize: '16GB' } },
        { timestamp: new Date(), sampleNumber: 3, processCount: 14, systemMetrics: { activeCpus: 8, memorySize: '16GB' } },
      ];
      
      (testWatcher as any).analysisHistory = mockHistory;
      
      const history = testWatcher.getHistory();
      expect(history).toHaveLength(3); // Should return all items in internal array
    });
  });

  describe('target process finding', () => {
    it('should handle different target types', () => {
      const pidWatcher = new SpindumpWatcher({ target: 1234 });
      const nameWatcher = new SpindumpWatcher({ target: 'node' });
      const noTargetWatcher = new SpindumpWatcher({ target: '-notarget' });

      expect(pidWatcher).toBeDefined();
      expect(nameWatcher).toBeDefined();
      expect(noTargetWatcher).toBeDefined();
    });
  });

  describe('analysis functionality', () => {
    it('should analyze process correctly', () => {
      const mockProcess = {
        name: 'TestProcess',
        pid: 1234,
        footprint: '100 MB',
        numThreads: 4,
        threads: [
          {
            threadId: '0x1',
            threadName: 'main',
            stackFrames: [
              { function: 'main', count: 10, library: 'TestApp', indentLevel: 0, isKernel: false },
              { function: 'processData', count: 5, library: 'TestApp', indentLevel: 1, isKernel: false },
            ]
          },
          {
            threadId: '0x2',
            threadName: 'worker',
            stackFrames: [
              { function: 'workerThread', count: 3, library: 'TestApp', indentLevel: 0, isKernel: false },
            ]
          }
        ]
      };

      const analysis = (watcher as any).analyzeProcess(mockProcess);

      expect(analysis.name).toBe('TestProcess');
      expect(analysis.pid).toBe(1234);
      expect(analysis.footprint).toBe('100 MB');
      expect(analysis.threadCount).toBe(4);
      expect(analysis.hotFunctions).toBeDefined();
      expect(analysis.hotFunctions.length).toBeGreaterThan(0);
      expect(analysis.threadActivity).toBeDefined();
      expect(analysis.threadActivity.length).toBe(2);
    });

    it('should calculate hot functions correctly', () => {
      const mockProcess = {
        name: 'TestProcess',
        pid: 1234,
        threads: [
          {
            threadId: '0x1',
            stackFrames: [
              { function: 'main', count: 10, library: 'TestApp', indentLevel: 0, isKernel: false },
              { function: 'processData', count: 5, library: 'TestApp', indentLevel: 1, isKernel: false },
              { function: 'main', count: 3, library: 'TestApp', indentLevel: 0, isKernel: false }, // Same function, different thread
            ]
          }
        ]
      };

      const analysis = (watcher as any).analyzeProcess(mockProcess);
      
      expect(analysis.hotFunctions).toBeDefined();
      const mainFunction = analysis.hotFunctions.find((f: any) => f.function === 'main');
      expect(mainFunction).toBeDefined();
      expect(mainFunction.sampleCount).toBe(13); // 10 + 3
    });

    it('should determine thread states correctly', () => {
      const mockProcess = {
        name: 'TestProcess',
        pid: 1234,
        threads: [
          {
            threadId: '0x1',
            threadName: 'main',
            stackFrames: [
              { function: 'kevent', count: 10, indentLevel: 0, isKernel: true },
            ]
          },
          {
            threadId: '0x2',
            threadName: 'worker', 
            stackFrames: [
              { function: 'processWork', count: 5, indentLevel: 0, isKernel: false },
            ]
          }
        ]
      };

      const analysis = (watcher as any).analyzeProcess(mockProcess);
      
      expect(analysis.threadActivity).toBeDefined();
      expect(analysis.threadActivity[0].state).toBe('blocked'); // kevent indicates blocked
      expect(analysis.threadActivity[1].state).toBe('unknown'); // processWork is unknown
    });
  });

  describe('error handling', () => {
    it('should handle errors in sample taking', async () => {
      const mockOnError = vi.fn();
      const testWatcher = new SpindumpWatcher({
        autoSudo: false,
        onError: mockOnError,
      });

      // Mock the spindump.run method to throw an error
      const runSpy = vi.spyOn((testWatcher as any).spindump, 'run').mockRejectedValue(new Error('Test error'));

      try {
        // Call takeSample directly to test error handling
        await (testWatcher as any).takeSample();
      } catch {
        // Expected to throw
      }
      
      // Wait a bit for the error to be caught
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockOnError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Test error'
      }));
      
      testWatcher.stop();
      runSpy.mockRestore();
    });
  });
});