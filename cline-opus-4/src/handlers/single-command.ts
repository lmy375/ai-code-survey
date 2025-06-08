import { spawn } from 'child_process';
import { createLogger } from '../utils/logger.js';
import { validateCommandSafety, buildSafeCommand, sanitizeEnvironment } from '../utils/security.js';

const logger = createLogger();

export class SingleCommandHandler {
  constructor(
    private name: string,
    private command: string,
    private description: string,
    private args: Record<string, any>
  ) {
    // Validate command safety on initialization
    validateCommandSafety(this.command);
  }

  getParameterSchema(): Record<string, any> {
    const schema: Record<string, any> = {};
    
    for (const [name, config] of Object.entries(this.args)) {
      schema[name] = {
        type: config.type,
        description: config.description || `Parameter ${name}`,
        required: config.required !== false,
        ...(config.default !== undefined && { default: config.default })
      };
    }
    
    return schema;
  }

  async execute(params: Record<string, any>): Promise<string> {
    try {
      // Validate parameters
      validateCommandSafety('', params);
      
      // Build the final command with parameters
      const finalCommand = buildSafeCommand(this.command, params);
      logger.debug('Executing command', { name: this.name, command: finalCommand });
      
      const result = await this.runCommand(finalCommand);
      
      // Format the response
      if (result.error) {
        return `Output:\n${result.output}\n\nError:\n${result.error}`;
      }
      return result.output;
    } catch (error) {
      logger.error('Command execution failed', { name: this.name, error });
      throw error;
    }
  }

  private runCommand(command: string): Promise<{ output: string; error?: string }> {
    return new Promise((resolve, reject) => {
      const timeout = 30000; // 30 seconds default timeout
      let output = '';
      let errorOutput = '';
      let timedOut = false;
      
      const child = spawn('sh', ['-c', command], {
        env: sanitizeEnvironment(process.env),
        timeout
      });
      
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      child.on('error', (error) => {
        clearTimeout(timer);
        reject(new Error(`Failed to execute command: ${error.message}`));
      });
      
      child.on('close', (code) => {
        clearTimeout(timer);
        
        if (timedOut) {
          reject(new Error(`Command timed out after ${timeout}ms`));
          return;
        }
        
        if (code !== 0) {
          resolve({
            output: output.trim(),
            error: errorOutput.trim() || `Command exited with code ${code}`
          });
        } else {
          resolve({
            output: output.trim(),
            ...(errorOutput && { error: errorOutput.trim() })
          });
        }
      });
    });
  }
}
