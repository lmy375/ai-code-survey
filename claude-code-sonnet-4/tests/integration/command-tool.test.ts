import { CommandTool } from '../../src/tools/command-tool';
import { CommandConfig } from '../../src/types';

describe('CommandTool Integration', () => {
  describe('basic command execution', () => {
    it('should execute simple commands', async () => {
      const config: CommandConfig = {
        cmd: 'echo hello world',
        description: 'Echo test',
      };

      const tool = new CommandTool(config, 'echo_test');
      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.output).toContain('hello world');
    });

    it('should handle commands with arguments', async () => {
      const config: CommandConfig = {
        cmd: 'echo $MESSAGE',
        description: 'Echo with argument',
        args: {
          MESSAGE: {
            type: 'string',
            description: 'Message to echo',
          },
        },
      };

      const tool = new CommandTool(config, 'echo_msg');
      const result = await tool.execute({ MESSAGE: 'test message' });

      expect(result.success).toBe(true);
      expect(result.output).toContain('test message');
    });

    it('should handle mathematical operations', async () => {
      const config: CommandConfig = {
        cmd: 'echo $(($NUM1 + $NUM2))',
        description: 'Add two numbers',
        args: {
          NUM1: { type: 'int', description: 'First number' },
          NUM2: { type: 'int', description: 'Second number' },
        },
      };

      const tool = new CommandTool(config, 'add');
      const result = await tool.execute({ NUM1: 5, NUM2: 3 });

      expect(result.success).toBe(true);
      expect(result.output.trim()).toBe('8');
    });

    it('should handle missing required arguments', async () => {
      const config: CommandConfig = {
        cmd: 'echo $REQUIRED',
        args: {
          REQUIRED: { type: 'string', description: 'Required argument' },
        },
      };

      const tool = new CommandTool(config, 'test');
      const result = await tool.execute({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Required argument');
    });

    it('should handle optional arguments with defaults', async () => {
      const config: CommandConfig = {
        cmd: 'echo $MESSAGE',
        args: {
          MESSAGE: {
            type: 'string',
            description: 'Message',
            optional: true,
            default: 'default message',
          },
        },
      };

      const tool = new CommandTool(config, 'test');
      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.output).toContain('default message');
    });
  });

  describe('type conversion', () => {
    it('should convert string arguments', async () => {
      const config: CommandConfig = {
        cmd: 'echo $VALUE',
        args: {
          VALUE: { type: 'string', description: 'String value' },
        },
      };

      const tool = new CommandTool(config, 'test');
      const result = await tool.execute({ VALUE: 123 });

      expect(result.success).toBe(true);
      expect(result.output).toContain('123');
    });

    it('should convert integer arguments', async () => {
      const config: CommandConfig = {
        cmd: 'echo $((VALUE * 2))',
        args: {
          VALUE: { type: 'int', description: 'Integer value' },
        },
      };

      const tool = new CommandTool(config, 'test');
      const result = await tool.execute({ VALUE: '5' });

      expect(result.success).toBe(true);
      expect(result.output.trim()).toBe('10');
    });

    it('should handle invalid integer conversion', async () => {
      const config: CommandConfig = {
        cmd: 'echo $VALUE',
        args: {
          VALUE: { type: 'int', description: 'Integer value' },
        },
      };

      const tool = new CommandTool(config, 'test');
      const result = await tool.execute({ VALUE: 'not_a_number' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid integer');
    });
  });

  describe('MCP tool schema generation', () => {
    it('should generate correct MCP tool schema', () => {
      const config: CommandConfig = {
        cmd: 'echo $MESSAGE',
        description: 'Echo message',
        args: {
          MESSAGE: {
            type: 'string',
            description: 'Message to echo',
          },
          COUNT: {
            type: 'int',
            description: 'Repeat count',
            optional: true,
            default: 1,
          },
        },
      };

      const tool = new CommandTool(config, 'echo_tool');
      const mcpTool = tool.getMCPTool();

      expect(mcpTool.name).toBe('echo_tool');
      expect(mcpTool.description).toBe('Echo message');
      expect(mcpTool.inputSchema.properties['MESSAGE']).toBeDefined();
      expect(mcpTool.inputSchema.properties['COUNT']).toBeDefined();
      expect(mcpTool.inputSchema.required).toEqual(['MESSAGE']);
    });
  });
});