import { validateCommandSafety, sanitizeEnvironment, escapeShellArg, buildSafeCommand } from './security';

describe('Security Utils', () => {
  describe('validateCommandSafety', () => {
    it('should pass for safe commands', () => {
      expect(() => validateCommandSafety('echo hello')).not.toThrow();
      expect(() => validateCommandSafety('date')).not.toThrow();
      expect(() => validateCommandSafety('ls -la')).not.toThrow();
    });

    it('should throw for commands with dangerous patterns', () => {
      expect(() => validateCommandSafety('echo hello && rm -rf /')).toThrow();
      expect(() => validateCommandSafety('echo hello; cat /etc/passwd')).toThrow();
      expect(() => validateCommandSafety('echo hello | grep secret')).toThrow();
      expect(() => validateCommandSafety('echo `whoami`')).toThrow();
      expect(() => validateCommandSafety('echo $(whoami)')).toThrow();
      expect(() => validateCommandSafety('cat ../../etc/passwd')).toThrow();
      expect(() => validateCommandSafety('echo hello > /tmp/file')).toThrow();
      expect(() => validateCommandSafety('cat < /etc/passwd')).toThrow(/dangerous pattern/);
    });

    it('should validate arguments as well', () => {
      expect(() => validateCommandSafety('echo', { msg: 'hello && rm -rf /' })).toThrow();
      expect(() => validateCommandSafety('echo', { msg: 'hello' })).not.toThrow();
    });
  });

  describe('sanitizeEnvironment', () => {
    it('should only keep allowed environment variables', () => {
      const env = {
        PATH: '/usr/bin',
        HOME: '/home/user',
        SECRET_KEY: 'secret',
        API_TOKEN: 'token',
        USER: 'testuser'
      };

      const sanitized = sanitizeEnvironment(env);
      
      expect(sanitized.PATH).toBe('/usr/bin');
      expect(sanitized.HOME).toBe('/home/user');
      expect(sanitized.USER).toBe('testuser');
      expect(sanitized.SECRET_KEY).toBeUndefined();
      expect(sanitized.API_TOKEN).toBeUndefined();
    });
  });

  describe('escapeShellArg', () => {
    it('should escape single quotes properly', () => {
      expect(escapeShellArg("hello")).toBe("'hello'");
      expect(escapeShellArg("hello'world")).toBe("'hello'\\''world'");
      expect(escapeShellArg("it's")).toBe("'it'\\''s'");
    });

    it('should handle special characters', () => {
      expect(escapeShellArg('hello$world')).toBe("'hello$world'");
      expect(escapeShellArg('hello`world`')).toBe("'hello`world`'");
      expect(escapeShellArg('hello;world')).toBe("'hello;world'");
    });
  });

  describe('buildSafeCommand', () => {
    it('should replace placeholders with escaped values', () => {
      const command = 'echo $MSG';
      const args = { MSG: "hello'world" };
      
      expect(buildSafeCommand(command, args)).toBe("echo 'hello'\\''world'");
    });

    it('should handle multiple placeholders', () => {
      const command = 'echo $GREETING $NAME';
      const args = { GREETING: 'Hello', NAME: "O'Brien" };
      
      expect(buildSafeCommand(command, args)).toBe("echo 'Hello' 'O'\\''Brien'");
    });

    it('should handle numeric values', () => {
      const command = 'echo $(($NUM1 + $NUM2))';
      const args = { NUM1: 5, NUM2: 3 };
      
      expect(buildSafeCommand(command, args)).toBe("echo $(('5' + '3'))");
    });
  });
});
