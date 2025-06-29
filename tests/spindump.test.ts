import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Spindump } from '../src/index.js';

describe('Spindump', () => {
  let systemSampleText: string;
  let nodeProcessText: string;
  let timelineSampleText: string;
  let heavySampleText: string;

  beforeAll(() => {
    // Load test fixtures
    const fixturesPath = join(__dirname, 'fixtures');
    systemSampleText = readFileSync(join(fixturesPath, 'system-sample.txt'), 'utf-8');
    nodeProcessText = readFileSync(join(fixturesPath, 'node-process.txt'), 'utf-8');
    timelineSampleText = readFileSync(join(fixturesPath, 'timeline-sample.txt'), 'utf-8');
    heavySampleText = readFileSync(join(fixturesPath, 'heavy-sample.txt'), 'utf-8');
  });

  describe('parseText', () => {
    it('should parse system sample text successfully', () => {
      const result = Spindump.parseText(systemSampleText);
      
      expect(result).toBeDefined();
      expect(result.header).toBeDefined();
      expect(result.processes).toBeDefined();
      expect(result.raw).toBe(systemSampleText);
    });

    it('should parse header information correctly', () => {
      const result = Spindump.parseText(systemSampleText);
      
      expect(result.header.dateTime).toBeDefined();
      expect(result.header.endTime).toBeDefined();
      expect(result.header.osVersion).toBe('macOS 15.5 (Build 24F74)');
      expect(result.header.architecture).toBe('arm64e');
      expect(result.header.reportVersion).toBe(60);
      expect(result.header.duration).toBe('1.00s');
      expect(result.header.steps).toBe(11);
      expect(result.header.samplingInterval).toBe('100ms sampling interval');
      expect(result.header.hardwareModel).toBe('Mac16,7');
      expect(result.header.activeCpus).toBe(14);
      expect(result.header.memorySize).toBe('24 GB');
    });

    it('should parse advisory levels correctly', () => {
      const result = Spindump.parseText(systemSampleText);
      
      expect(result.header.advisoryLevels).toBeDefined();
      expect(result.header.advisoryLevels.battery).toBe(3);
      expect(result.header.advisoryLevels.user).toBe(2);
      expect(result.header.advisoryLevels.thermalPressure).toBe(0);
      expect(result.header.advisoryLevels.combined).toBe(2);
    });

    it('should detect format correctly', () => {
      const heavyResult = Spindump.parseText(heavySampleText);
      const timelineResult = Spindump.parseText(timelineSampleText);
      
      expect(heavyResult.format).toBe('heavy');
      expect(timelineResult.format).toBe('heavy'); // Both seem to be heavy format
    });

    it('should parse processes from system sample', () => {
      const result = Spindump.parseText(systemSampleText);
      
      expect(result.processes).toBeInstanceOf(Array);
      expect(result.processes.length).toBeGreaterThan(0);
      
      // Check first process structure
      const firstProcess = result.processes[0];
      expect(firstProcess).toBeDefined();
      expect(firstProcess.name).toBeDefined();
      expect(firstProcess.pid).toBeTypeOf('number');
      expect(firstProcess.uuid).toBeDefined();
      expect(firstProcess.threads).toBeInstanceOf(Array);
      expect(firstProcess.binaryImages).toBeInstanceOf(Array);
    });

    it('should parse node process sample correctly', () => {
      const result = Spindump.parseText(nodeProcessText);
      
      expect(result).toBeDefined();
      expect(result.processes.length).toBeGreaterThan(0);
      
      // Should have node process
      const nodeProcess = result.processes.find(p => p.name.toLowerCase().includes('node'));
      expect(nodeProcess).toBeDefined();
    });

    it('should handle malformed input gracefully', () => {
      const malformedInput = 'This is not a valid spindump output';
      
      expect(() => {
        Spindump.parseText(malformedInput);
      }).not.toThrow();
      
      const result = Spindump.parseText(malformedInput);
      expect(result.processes).toEqual([]);
    });

    it('should handle empty input', () => {
      expect(() => {
        Spindump.parseText('');
      }).not.toThrow();
      
      const result = Spindump.parseText('');
      expect(result.processes).toEqual([]);
    });
  });

  describe('parsing specific sections', () => {
    it('should parse thread information correctly', () => {
      const result = Spindump.parseText(nodeProcessText);
      
      const processWithThreads = result.processes.find(p => p.threads.length > 0);
      expect(processWithThreads).toBeDefined();
      
      if (processWithThreads) {
        const firstThread = processWithThreads.threads[0];
        expect(firstThread.threadId).toBeDefined();
        expect(firstThread.samples).toBeDefined();
        expect(firstThread.priority).toBeDefined();
        expect(firstThread.stackFrames).toBeInstanceOf(Array);
      }
    });

    it('should parse stack frames correctly', () => {
      const result = Spindump.parseText(nodeProcessText);
      
      const processWithStackFrames = result.processes.find(p => 
        p.threads.some(t => t.stackFrames.length > 0)
      );
      expect(processWithStackFrames).toBeDefined();
      
      if (processWithStackFrames) {
        const threadWithFrames = processWithStackFrames.threads.find(t => t.stackFrames.length > 0);
        expect(threadWithFrames).toBeDefined();
        
        if (threadWithFrames) {
          const frame = threadWithFrames.stackFrames[0];
          expect(frame.function).toBeDefined();
          expect(frame.indentLevel).toBeTypeOf('number');
          expect(frame.isKernel).toBeTypeOf('boolean');
        }
      }
    });

    it('should parse binary images correctly', () => {
      const result = Spindump.parseText(systemSampleText);
      
      // Debug: Check if we have any processes at all
      expect(result.processes.length).toBeGreaterThan(0);
      
      // Debug: Check each process for binary images
      const totalBinaryImages = result.processes.reduce((total, p) => total + p.binaryImages.length, 0);
      console.log(`Total binary images across all processes: ${totalBinaryImages}`);
      
      const processWithBinaryImages = result.processes.find(p => p.binaryImages.length > 0);
      expect(processWithBinaryImages).toBeDefined();
      
      if (processWithBinaryImages) {
        const binaryImage = processWithBinaryImages.binaryImages[0];
        expect(binaryImage.addressRange).toBeDefined();
        expect(binaryImage.name).toBeDefined();
        expect(binaryImage.uuid).toBeDefined();
        expect(binaryImage.path).toBeDefined();
      }
    });
  });

  describe('edge cases', () => {
    it('should handle processes with no threads', () => {
      const minimalSpindump = `Date/Time: 2025-06-29 13:08:54.588 +0100
OS Version: macOS 15.5 (Build 24F74)
Architecture: arm64e

Process: TestProcess [1234]
UUID: 4C4C4419-5555-3144-A1FC-E860FF73CB61
Path: /usr/bin/test
`;
      
      const result = Spindump.parseText(minimalSpindump);
      expect(result.processes).toHaveLength(1);
      expect(result.processes[0].name).toBe('TestProcess');
      expect(result.processes[0].pid).toBe(1234);
      expect(result.processes[0].threads).toEqual([]);
    });

    it('should handle threads with no stack frames', () => {
      const spindumpWithEmptyThread = `Date/Time: 2025-06-29 13:08:54.588 +0100
OS Version: macOS 15.5 (Build 24F74)

Process: TestProcess [1234]
UUID: 4C4C4419-5555-3144-A1FC-E860FF73CB61

Thread 0x12345  DispatchQueue "com.apple.main-thread"  Thread name "main"  2 samples (100%) priority 31
`;
      
      const result = Spindump.parseText(spindumpWithEmptyThread);
      expect(result.processes).toHaveLength(1);
      expect(result.processes[0].threads).toHaveLength(1);
      expect(result.processes[0].threads[0].stackFrames).toEqual([]);
    });
  });
});