import { CommandConfig, MCPTool, ToolArgument } from '../types.js';
import { CommandExecutor } from '../core/command-executor.js';
import { logger } from '../utils/logger.js';

export class CommandTool {
  constructor(
    private config: CommandConfig,
    private toolName: string
  ) {}

  getMCPTool(): MCPTool {
    const properties: Record<string, ToolArgument> = {};
    const required: string[] = [];

    if (this.config.args) {
      for (const [argName, argConfig] of Object.entries(this.config.args)) {
        properties[argName] = {
          type: argConfig.type,
          description: argConfig.description,
          ...(argConfig.optional !== undefined && { optional: argConfig.optional }),
          ...(argConfig.default !== undefined && { default: argConfig.default }),
        };

        if (!argConfig.optional) {
          required.push(argName);
        }
      }
    }

    return {
      name: this.toolName,
      description: this.config.description || `Execute command: ${this.config.cmd}`,
      inputSchema: {
        type: 'object',
        properties,
        ...(required.length > 0 && { required }),
      },
    };
  }

  async execute(args: Record<string, any>): Promise<any> {
    try {
      logger.info(`Executing tool: ${this.toolName} with args:`, args);

      // Validate and convert arguments
      const processedArgs = this.processArguments(args);
      
      // Interpolate the command with variables
      const interpolatedCommand = CommandExecutor.interpolateCommand(
        this.config.cmd,
        processedArgs
      );

      // Split command into command and arguments
      const [command, ...cmdArgs] = interpolatedCommand.split(/\s+/);

      // Execute the command
      const result = await CommandExecutor.execute(command, cmdArgs, {
        timeout: this.config.timeout || 30000,
      });

      if (result.success) {
        return {
          success: true,
          output: result.stdout,
          error: result.stderr || null,
        };
      } else {
        return {
          success: false,
          output: result.stdout || null,
          error: result.stderr || 'Command execution failed',
          timeout: result.timeout || false,
          exitCode: result.exitCode,
        };
      }
    } catch (error) {
      logger.error(`Tool execution failed: ${this.toolName}`, error);
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private processArguments(args: Record<string, any>): Record<string, any> {
    const processed: Record<string, any> = {};

    if (!this.config.args) {
      return processed;
    }

    for (const [argName, argConfig] of Object.entries(this.config.args)) {
      let value = args[argName];

      // Use default if value is not provided
      if (value === undefined && argConfig.default !== undefined) {
        value = argConfig.default;
      }

      // Type conversion and validation
      if (value !== undefined) {
        processed[argName] = this.convertArgumentType(value, argConfig.type);
      } else if (!argConfig.optional) {
        throw new Error(`Required argument '${argName}' is missing`);
      }
    }

    return processed;
  }

  private convertArgumentType(value: any, type: string): any {
    switch (type) {
      case 'string':
        return String(value);
      case 'int':
        const intValue = parseInt(String(value), 10);
        if (isNaN(intValue)) {
          throw new Error(`Invalid integer value: ${value}`);
        }
        return intValue;
      case 'float':
        const floatValue = parseFloat(String(value));
        if (isNaN(floatValue)) {
          throw new Error(`Invalid float value: ${value}`);
        }
        return floatValue;
      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        return Boolean(value);
      case 'string[]':
        if (Array.isArray(value)) {
          return value.map(String);
        }
        return [String(value)];
      default:
        return value;
    }
  }
}