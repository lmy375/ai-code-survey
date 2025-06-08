import { ConfigParser } from '../../src/utils/config-parser';
import { CommandLineArgs } from '../../src/types';

describe('ConfigParser', () => {
  describe('parseCommandLineArgs', () => {
    it('should parse single command configuration', () => {
      const args: CommandLineArgs = {
        cmd: 'echo hello',
        name: 'greet',
        description: 'Say hello',
      };

      const config = ConfigParser.parseCommandLineArgs(args);
      
      expect(config.commands).toBeDefined();
      expect(config.commands!['greet']).toBeDefined();
      expect(config.commands!['greet'].cmd).toBe('echo hello');
      expect(config.commands!['greet'].description).toBe('Say hello');
    });

    it('should parse command with arguments', () => {
      const args: CommandLineArgs = {
        cmd: 'echo $MESSAGE',
        name: 'echo_msg',
        args: ['MESSAGE:string:The message to echo'],
      };

      const config = ConfigParser.parseCommandLineArgs(args);
      
      expect(config.commands!['echo_msg'].args).toBeDefined();
      expect(config.commands!['echo_msg'].args!['MESSAGE']).toEqual({
        type: 'string',
        description: 'The message to echo',
      });
    });

    it('should parse REPL configuration', () => {
      const args: CommandLineArgs = {
        repl: 'python',
        description: 'Python REPL',
      };

      const config = ConfigParser.parseCommandLineArgs(args);
      
      expect(config.repl).toBeDefined();
      expect(config.repl!.command).toBe('python');
      expect(config.repl!.description).toBe('Python REPL');
    });

    it('should generate tool names automatically', () => {
      const args: CommandLineArgs = {
        cmd: '/usr/bin/date',
      };

      const config = ConfigParser.parseCommandLineArgs(args);
      
      expect(config.commands!['date']).toBeDefined();
    });
  });

  describe('argument parsing', () => {
    it('should parse various argument types', () => {
      const argStrings = [
        'NAME:string:Your name',
        'COUNT:int:Number of items',
        'PRICE:float:Item price',
        'ENABLED:boolean:Enable feature',
        'TAGS:string[]:List of tags',
      ];

      const result = (ConfigParser as any).parseArgumentStrings(argStrings);

      expect(result['NAME'].type).toBe('string');
      expect(result['COUNT'].type).toBe('int');
      expect(result['PRICE'].type).toBe('float');
      expect(result['ENABLED'].type).toBe('boolean');
      expect(result['TAGS'].type).toBe('string[]');
    });

    it('should handle quoted descriptions', () => {
      const argStrings = [
        'MSG:string:"A quoted message"',
        "MSG2:string:'Another quoted message'",
      ];

      const result = (ConfigParser as any).parseArgumentStrings(argStrings);

      expect(result['MSG'].description).toBe('A quoted message');
      expect(result['MSG2'].description).toBe('Another quoted message');
    });

    it('should reject invalid argument formats', () => {
      expect(() => {
        (ConfigParser as any).parseArgumentStrings(['invalid_format']);
      }).toThrow();

      expect(() => {
        (ConfigParser as any).parseArgumentStrings(['NAME:invalid_type:description']);
      }).toThrow();
    });
  });

  describe('mergeConfigs', () => {
    it('should merge configurations correctly', () => {
      const base = {
        commands: {
          'cmd1': { cmd: 'echo 1' },
        },
      };

      const override = {
        commands: {
          'cmd2': { cmd: 'echo 2' },
        },
        repl: {
          command: 'python',
        },
      };

      const merged = ConfigParser.mergeConfigs(base, override);

      expect(merged.commands!['cmd1']).toBeDefined();
      expect(merged.commands!['cmd2']).toBeDefined();
      expect(merged.repl).toBeDefined();
    });
  });
});