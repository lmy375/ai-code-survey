import { spawn } from 'child_process';
import { CommandResult } from '../types.js';
import { SecurityValidator } from '../security/validator.js';
import { logger } from '../utils/logger.js';

export class CommandExecutor {
  static async execute(
    command: string,
    args: string[] = [],
    options: {
      timeout?: number;
      env?: Record<string, string>;
      cwd?: string;
    } = {}
  ): Promise<CommandResult> {
    const { timeout = 30000, env = {}, cwd = process.cwd() } = options;

    // Security validation
    const commandValidation = SecurityValidator.validateCommand(command);
    if (!commandValidation.valid) {
      logger.error(`Command validation failed: ${commandValidation.reason}`);
      return {
        success: false,
        stdout: '',
        stderr: commandValidation.reason || 'Command validation failed',
        exitCode: -1,
      };
    }

    // Validate all arguments
    for (const arg of args) {
      const argValidation = SecurityValidator.validateArgument(arg);
      if (!argValidation.valid) {
        logger.error(`Argument validation failed: ${argValidation.reason}`);
        return {
          success: false,
          stdout: '',
          stderr: argValidation.reason || 'Argument validation failed',
          exitCode: -1,
        };
      }
    }

    // Validate timeout
    const timeoutValidation = SecurityValidator.validateTimeout(timeout);
    if (!timeoutValidation.valid) {
      logger.error(`Timeout validation failed: ${timeoutValidation.reason}`);
      return {
        success: false,
        stdout: '',
        stderr: timeoutValidation.reason || 'Timeout validation failed',
        exitCode: -1,
      };
    }

    // Sanitize environment variables
    const processEnv: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        processEnv[key] = value;
      }
    }
    const sanitizedEnv = SecurityValidator.sanitizeEnvironmentVariables({
      ...processEnv,
      ...env,
    });

    logger.info(`Executing command: ${command} ${args.join(' ')}`);

    return new Promise((resolve) => {
      const child = spawn(command, args, {
        env: sanitizedEnv,
        cwd,
        stdio: 'pipe',
      });

      let stdout = '';
      let stderr = '';
      let isTimeout = false;

      const timeoutId = setTimeout(() => {
        isTimeout = true;
        child.kill('SIGKILL');
        logger.warn(`Command timed out after ${timeout}ms: ${command}`);
      }, timeout);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        
        const result: CommandResult = {
          success: !isTimeout && code === 0,
          stdout,
          stderr,
          exitCode: code ?? undefined,
          timeout: isTimeout,
        };

        if (result.success) {
          logger.debug(`Command completed successfully: ${command}`);
        } else {
          logger.warn(`Command failed: ${command}, exit code: ${code}, timeout: ${isTimeout}`);
        }

        resolve(result);
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        logger.error(`Command execution error: ${error.message}`);
        resolve({
          success: false,
          stdout,
          stderr: error.message,
          exitCode: -1,
        });
      });
    });
  }

  static interpolateCommand(
    template: string,
    variables: Record<string, any>
  ): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      // Only allow simple variable substitution with $VAR format
      const regex = new RegExp(`\\$${key}\\b`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }
}