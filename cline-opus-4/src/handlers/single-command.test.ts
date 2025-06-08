import { SingleCommandHandler } from './single-command';

// Mock the logger
jest.mock('../utils/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

import { spawn } from 'child_process';

describe('SingleCommandHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create handler with valid command', () => {
      expect(() => new SingleCommandHandler('test', 'echo hello', 'Test command', {})).not.toThrow();
    });

    it('should throw for dangerous commands', () => {
      expect(() => new SingleCommandHandler('test', 'echo hello && rm -rf /', 'Test command', {})).toThrow();
    });
  });

  describe('getParameterSchema', () => {
    it('should return correct schema for parameters', () => {
      const handler = new SingleCommandHandler('test', 'echo $MSG', 'Test command', {
        MSG: {
          type: 'string',
          description: 'Message to echo',
          required: true
        },
        COUNT: {
          type: 'number',
          description: 'Count',
          required: false,
          default: 1
        }
      });

      const schema = handler.getParameterSchema();
      
      expect(schema.MSG).toEqual({
        type: 'string',
        description: 'Message to echo',
        required: true
      });
      
      expect(schema.COUNT).toEqual({
        type: 'number',
        description: 'Count',
        required: false,
        default: 1
      });
    });
  });

  describe('execute', () => {
    it('should execute command successfully', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn(),
        killed: false
      };

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      const handler = new SingleCommandHandler('test', 'echo $MSG', 'Test command', {
        MSG: { type: 'string', required: true }
      });

      // Simulate successful execution
      setTimeout(() => {
        const stdoutCallback = mockProcess.stdout.on.mock.calls[0][1];
        stdoutCallback(Buffer.from('Hello World'));
        
        const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
        closeCallback(0);
      }, 10);

      const result = await handler.execute({ MSG: 'Hello World' });
      
      expect(result).toBe('Hello World');
      expect(spawn).toHaveBeenCalledWith('sh', ['-c', "echo 'Hello World'"], expect.any(Object));
    });

    it('should handle command errors', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn(),
        killed: false
      };

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      const handler = new SingleCommandHandler('test', 'false', 'Test command', {});

      // Simulate error
      setTimeout(() => {
        const stderrCallback = mockProcess.stderr.on.mock.calls[0][1];
        stderrCallback(Buffer.from('Command failed'));
        
        const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
        closeCallback(1);
      }, 10);

      const result = await handler.execute({});
      
      expect(result).toContain('Error:');
      expect(result).toContain('Command failed');
    });

    it('should validate parameters for dangerous content', async () => {
      const handler = new SingleCommandHandler('test', 'echo $MSG', 'Test command', {
        MSG: { type: 'string', required: true }
      });

      await expect(handler.execute({ MSG: 'hello && rm -rf /' })).rejects.toThrow();
    });
  });
});
