import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { Spindump } from '../src/index.js';

describe('Spindump Async Operations', () => {
  let fixturesPath: string;

  beforeAll(() => {
    fixturesPath = join(__dirname, 'fixtures');
  });

  describe('parseFile', () => {
    it('should parse spindump file successfully', async () => {
      const systemSamplePath = join(fixturesPath, 'system-sample.spindump');
      expect(existsSync(systemSamplePath)).toBe(true);

      const result = await Spindump.parseFile(systemSamplePath);
      
      expect(result).toBeDefined();
      expect(result.output).toBeDefined();
      expect(result.exitCode).toBe(0);
    });

    it('should parse text file successfully', async () => {
      const systemSamplePath = join(fixturesPath, 'system-sample.txt');
      expect(existsSync(systemSamplePath)).toBe(true);

      const result = await Spindump.parseFile(systemSamplePath);
      
      expect(result).toBeDefined();
      expect(result.output).toBeDefined();
      expect(result.exitCode).toBe(0);
    });

    it('should handle non-existent file gracefully', async () => {
      const nonExistentPath = join(fixturesPath, 'non-existent.spindump');
      
      await expect(Spindump.parseFile(nonExistentPath)).rejects.toThrow();
    });
  });

  describe('parseFileAndGet', () => {
    it('should parse and return parsed spindump report', async () => {
      const systemSamplePath = join(fixturesPath, 'system-sample.spindump');
      
      const result = await Spindump.parseFileAndGet(systemSamplePath);
      
      expect(result).toBeDefined();
      expect(result.header).toBeDefined();
      expect(result.processes).toBeDefined();
      expect(result.processes.length).toBeGreaterThan(0);
    });

    it('should handle different spindump file formats', async () => {
      const heavySamplePath = join(fixturesPath, 'heavy-sample.spindump');
      const timelineSamplePath = join(fixturesPath, 'timeline-sample.spindump');
      
      const heavyResult = await Spindump.parseFileAndGet(heavySamplePath);
      const timelineResult = await Spindump.parseFileAndGet(timelineSamplePath);
      
      expect(heavyResult.format).toBeDefined();
      expect(timelineResult.format).toBeDefined();
      
      expect(heavyResult.processes.length).toBeGreaterThan(0);
      expect(timelineResult.processes.length).toBeGreaterThan(0);
    });
  });

  describe('run method', () => {
    it('should handle file input options', async () => {
      const spindump = new Spindump();
      const systemSamplePath = join(fixturesPath, 'system-sample.spindump');
      
      const result = await spindump.run({
        inputPath: systemSamplePath,
        stdout: true
      });
      
      expect(result.exitCode).toBe(0);
      expect(result.output).toBeDefined();
      expect(result.output.length).toBeGreaterThan(0);
    });

    it('should validate duration parameter', () => {
      const spindump = new Spindump();
      
      expect(() => spindump.run({ duration: -1 })).toThrow('Duration must be between 0 and 3600 seconds');
      expect(() => spindump.run({ duration: 4000 })).toThrow('Duration must be between 0 and 3600 seconds');
    });

    it('should validate interval parameter', () => {
      const spindump = new Spindump();
      
      expect(() => spindump.run({ interval: 0 })).toThrow('Interval must be between 1 and 1000 milliseconds');
      expect(() => spindump.run({ interval: 2000 })).toThrow('Interval must be between 1 and 1000 milliseconds');
    });

    it('should validate input path parameter', () => {
      const spindump = new Spindump();
      
      expect(() => spindump.run({ inputPath: '' })).toThrow('Input path cannot be empty');
      expect(() => spindump.run({ inputPath: '   ' })).toThrow('Input path cannot be empty');
    });
  });

  describe('static convenience methods', () => {
    it('should handle parseText with real fixture data', async () => {
      const systemSamplePath = join(fixturesPath, 'system-sample.spindump');
      const fileResult = await Spindump.parseFileAndGet(systemSamplePath);
      
      const textResult = Spindump.parseText(fileResult.raw);
      
      expect(textResult.header.dateTime).toBe(fileResult.header.dateTime);
      expect(textResult.processes.length).toBe(fileResult.processes.length);
    });
  });

  describe('error handling', () => {
    it('should provide helpful error messages for missing spindump command', async () => {
      // This test will only fail on non-macOS systems
      if (process.platform !== 'darwin') {
        const spindump = new Spindump();
        
        await expect(spindump.run({ target: 'test' })).rejects.toThrow(/spindump command not found/);
      }
    });
  });
});