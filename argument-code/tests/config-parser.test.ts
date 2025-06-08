import { ConfigParser } from '../src/config/parser';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('ConfigParser', () => {
  const testConfigPath = join(__dirname, 'test-config.json');

  afterEach(() => {
    try {
      unlinkSync(testConfigPath);
    } catch (error) {
      // File might not exist, ignore
    }
  });

  describe('parseConfigFile', () => {
    it('should parse valid configuration file', () => {
      const config = {
        test_command: {
          cmd: 'echo $message',
          description: 'Test command',
          args: {
            message: {
              type: 'string',
              description: 'Message to echo',
              optional: false,
            },
          },
          timeout: 5000,
        },
      };

      writeFileSync(testConfigPath, JSON.stringify(config, null, 2));
      const parsed = ConfigParser.parseConfigFile(testConfigPath);

      expect(parsed).toEqual(config);
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        test_command: {
          cmd: 'echo test',
          args: {
            message: {
              type: 'invalid_type', // Invalid type
              description: 'Message',
            },
          },
        },
      };

      writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));
      
      expect(() => ConfigParser.parseConfigFile(testConfigPath)).toThrow();
    });

    it('should handle missing file', () => {
      expect(() => ConfigParser.parseConfigFile('nonexistent.json')).toThrow();
    });
  });

  describe('parseArgumentString', () => {
    it('should parse valid argument strings', () => {
      const result = ConfigParser.parseArgumentString('name:string:Description text');
      expect(result).toEqual({
        type: 'string',
        description: 'Description text',
        optional: false,
      });
    });

    it('should parse argument strings with quoted descriptions', () => {
      const result = ConfigParser.parseArgumentString("name:int:'Number of items'");
      expect(result).toEqual({
        type: 'int',
        description: 'Number of items',
        optional: false,
      });
    });

    it('should handle descriptions with colons', () => {
      const result = ConfigParser.parseArgumentString('name:string:URL like http://example.com');
      expect(result).toEqual({
        type: 'string',
        description: 'URL like http://example.com',
        optional: false,
      });
    });

    it('should reject invalid argument strings', () => {
      expect(() => ConfigParser.parseArgumentString('invalid')).toThrow();
      expect(() => ConfigParser.parseArgumentString('name:invalid_type:desc')).toThrow();
    });

    it('should handle all supported types', () => {
      expect(ConfigParser.parseArgumentString('str:string:String param').type).toBe('string');
      expect(ConfigParser.parseArgumentString('num:int:Integer param').type).toBe('int');
      expect(ConfigParser.parseArgumentString('float:float:Float param').type).toBe('float');
      expect(ConfigParser.parseArgumentString('bool:boolean:Boolean param').type).toBe('boolean');
    });
  });

  describe('generateDefaultDescription', () => {
    it('should generate description for named commands', () => {
      const desc = ConfigParser.generateDefaultDescription('list_files', 'ls -la');
      expect(desc).toBe("Execute 'ls -la' command");
    });

    it('should generate description for unnamed commands', () => {
      const desc = ConfigParser.generateDefaultDescription('ls', 'ls -la');
      expect(desc).toBe("Execute 'ls -la' command");
    });
  });

  describe('generateDefaultName', () => {
    it('should generate name from simple command', () => {
      expect(ConfigParser.generateDefaultName('ls')).toBe('ls');
      expect(ConfigParser.generateDefaultName('echo')).toBe('echo');
    });

    it('should generate name from command with arguments', () => {
      expect(ConfigParser.generateDefaultName('ls -la')).toBe('ls');
      expect(ConfigParser.generateDefaultName('echo hello')).toBe('echo');
    });

    it('should generate name from path commands', () => {
      expect(ConfigParser.generateDefaultName('/bin/ls')).toBe('ls');
      expect(ConfigParser.generateDefaultName('./script.sh')).toBe('script');
    });

    it('should sanitize names', () => {
      expect(ConfigParser.generateDefaultName('my-script')).toBe('my_script');
      expect(ConfigParser.generateDefaultName('script.py')).toBe('script');
    });
  });
});
