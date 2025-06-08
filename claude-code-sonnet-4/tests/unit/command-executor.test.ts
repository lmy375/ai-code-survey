import { CommandExecutor } from '../../src/core/command-executor';

describe('CommandExecutor', () => {
  describe('execute', () => {
    it('should execute simple commands successfully', async () => {
      const result = await CommandExecutor.execute('echo', ['hello world']);
      
      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toBe('hello world');
      expect(result.exitCode).toBe(0);
    });

    it('should handle command failures', async () => {
      const result = await CommandExecutor.execute('false');
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it('should timeout long-running commands', async () => {
      const result = await CommandExecutor.execute('sleep', ['10'], { timeout: 1000 });
      
      expect(result.success).toBe(false);
      expect(result.timeout).toBe(true);
    }, 10000);

    it('should handle non-existent commands', async () => {
      const result = await CommandExecutor.execute('this-command-does-not-exist');
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('ENOENT');
    });

    it('should reject dangerous commands', async () => {
      const result = await CommandExecutor.execute('echo hello; rm -rf /');
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('validation failed');
    });
  });

  describe('interpolateCommand', () => {
    it('should interpolate variables correctly', () => {
      const template = 'echo $GREETING $NAME';
      const variables = { GREETING: 'Hello', NAME: 'World' };
      
      const result = CommandExecutor.interpolateCommand(template, variables);
      expect(result).toBe('echo Hello World');
    });

    it('should handle missing variables', () => {
      const template = 'echo $GREETING $MISSING';
      const variables = { GREETING: 'Hello' };
      
      const result = CommandExecutor.interpolateCommand(template, variables);
      expect(result).toBe('echo Hello $MISSING');
    });

    it('should handle numeric variables', () => {
      const template = 'echo $(($NUM1 + $NUM2))';
      const variables = { NUM1: 5, NUM2: 3 };
      
      const result = CommandExecutor.interpolateCommand(template, variables);
      expect(result).toBe('echo $((5 + 3))');
    });
  });
});