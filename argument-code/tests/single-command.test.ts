import { SingleCommandExecutor } from '../src/commands/single-command';
import { ArgumentConfig } from '../src/config/parser';

describe('SingleCommandExecutor', () => {
  describe('basic command execution', () => {
    it('should execute a simple command successfully', async () => {
      const executor = new SingleCommandExecutor('echo "hello world"');
      const result = await executor.execute({});
      
      expect(result.success).toBe(true);
      expect(result.stdout).toBe('hello world');
      expect(result.exitCode).toBe(0);
    });

    it('should handle command failure', async () => {
      const executor = new SingleCommandExecutor('exit 1');
      const result = await executor.execute({});
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });
  });

  describe('parameter substitution', () => {
    it('should substitute string parameters', async () => {
      const args: Record<string, ArgumentConfig> = {
        message: {
          type: 'string',
          description: 'Message to echo',
          optional: false,
        },
      };
      
      const executor = new SingleCommandExecutor('echo $message', args);
      const result = await executor.execute({ message: 'test message' });
      
      expect(result.success).toBe(true);
      expect(result.stdout).toBe('test message');
    });

    it('should substitute integer parameters', async () => {
      const args: Record<string, ArgumentConfig> = {
        count: {
          type: 'int',
          description: 'Count parameter',
          optional: false,
        },
      };
      
      const executor = new SingleCommandExecutor('echo $count', args);
      const result = await executor.execute({ count: 42 });
      
      expect(result.success).toBe(true);
      expect(result.stdout).toBe('42');
    });

    it('should handle optional parameters with defaults', async () => {
      const args: Record<string, ArgumentConfig> = {
        message: {
          type: 'string',
          description: 'Message to echo',
          optional: true,
          default: 'default message',
        },
      };
      
      const executor = new SingleCommandExecutor('echo $message', args);
      const result = await executor.execute({});
      
      expect(result.success).toBe(true);
      expect(result.stdout).toBe('default message');
    });
  });

  describe('security validation', () => {
    it('should reject dangerous commands', () => {
      expect(() => {
        new SingleCommandExecutor('rm -rf /');
      }).toThrow();
    });

    it('should reject commands with dangerous patterns', () => {
      expect(() => {
        new SingleCommandExecutor('echo test; rm file');
      }).toThrow();
    });
  });

  describe('timeout handling', () => {
    it('should timeout long-running commands', async () => {
      const executor = new SingleCommandExecutor('sleep 10', {}, 1000);
      
      await expect(executor.execute({})).rejects.toThrow('timed out');
    }, 15000);
  });

  describe('tool definition generation', () => {
    it('should generate correct tool definition', () => {
      const args: Record<string, ArgumentConfig> = {
        file: {
          type: 'string',
          description: 'File to process',
          optional: false,
        },
        count: {
          type: 'int',
          description: 'Number of items',
          optional: true,
          default: 10,
        },
      };
      
      const executor = new SingleCommandExecutor('wc -l $file', args);
      const toolDef = executor.getToolDefinition('count_lines', 'Count lines in file');
      
      expect(toolDef.name).toBe('count_lines');
      expect(toolDef.description).toBe('Count lines in file');
      expect(toolDef.args).toEqual(args);
    });
  });
});
