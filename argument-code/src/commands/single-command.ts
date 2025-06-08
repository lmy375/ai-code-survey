import { spawn } from 'child_process';
import { CommandValidator } from '../security/validator.js';
import { withTimeout } from '../utils/timeout.js';
import { logger } from '../utils/logger.js';
import { ArgumentConfig } from '../config/parser.js';

export interface SingleCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export class SingleCommandExecutor {
  private command: string;
  private args: Record<string, ArgumentConfig>;
  private timeoutMs: number;

  constructor(command: string, args: Record<string, ArgumentConfig> = {}, timeoutMs: number = 30000) {
    CommandValidator.validateCommand(command);
    this.command = command;
    this.args = args;
    this.timeoutMs = timeoutMs;
  }

  async execute(parameters: Record<string, any>): Promise<SingleCommandResult> {
    logger.info(`Executing command: ${this.command}`);
    logger.debug('Parameters:', parameters);

    // Validate and convert parameters
    const processedParams = this.processParameters(parameters);
    
    // Substitute parameters in command
    const finalCommand = this.substituteParameters(this.command, processedParams);
    
    logger.debug(`Final command: ${finalCommand}`);

    return await this.runCommand(finalCommand);
  }

  private processParameters(parameters: Record<string, any>): Record<string, string> {
    const processed: Record<string, string> = {};

    // Validate required parameters
    for (const [name, config] of Object.entries(this.args)) {
      const value = parameters[name];
      
      if (value === undefined || value === null) {
        if (!config.optional && config.default === undefined) {
          throw new Error(`Required parameter '${name}' is missing`);
        }
        if (config.default !== undefined) {
          processed[name] = String(config.default);
        }
        continue;
      }

      // Type conversion and validation
      processed[name] = this.convertParameter(value, config);
      CommandValidator.validateArgument(processed[name]);
    }

    return processed;
  }

  private convertParameter(value: any, config: ArgumentConfig): string {
    switch (config.type) {
      case 'string':
        return String(value);
      case 'int':
        const intValue = parseInt(String(value), 10);
        if (isNaN(intValue)) {
          throw new Error(`Parameter must be an integer, got: ${value}`);
        }
        return String(intValue);
      case 'float':
        const floatValue = parseFloat(String(value));
        if (isNaN(floatValue)) {
          throw new Error(`Parameter must be a number, got: ${value}`);
        }
        return String(floatValue);
      case 'boolean':
        const boolValue = Boolean(value);
        return String(boolValue);
      default:
        throw new Error(`Unsupported parameter type: ${config.type}`);
    }
  }

  private substituteParameters(command: string, parameters: Record<string, string>): string {
    let result = command;
    
    for (const [name, value] of Object.entries(parameters)) {
      // Replace $NAME and ${NAME} patterns
      const patterns = [
        new RegExp(`\\$${name}\\b`, 'g'),
        new RegExp(`\\$\\{${name}\\}`, 'g'),
      ];
      
      for (const pattern of patterns) {
        result = result.replace(pattern, CommandValidator.sanitizeArgument(value));
      }
    }

    return result;
  }

  private async runCommand(command: string): Promise<SingleCommandResult> {
    return await withTimeout(
      new Promise<SingleCommandResult>((resolve, reject) => {
        logger.debug(`Spawning command: ${command}`);
        
        const child = spawn('sh', ['-c', command], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env },
        });

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          const exitCode = code || 0;
          const success = exitCode === 0;
          
          logger.debug(`Command completed with exit code: ${exitCode}`);
          logger.debug(`Stdout length: ${stdout.length}, Stderr length: ${stderr.length}`);

          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode,
            success,
          });
        });

        child.on('error', (error) => {
          logger.error('Command execution error:', error);
          reject(error);
        });
      }),
      this.timeoutMs,
      `Command execution timed out after ${this.timeoutMs}ms`
    );
  }

  getToolDefinition(name: string, description?: string) {
    return {
      name,
      description: description || `Execute command: ${this.command}`,
      args: this.args,
    };
  }
}
