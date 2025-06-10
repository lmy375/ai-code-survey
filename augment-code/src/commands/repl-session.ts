import { spawn, ChildProcess } from 'child_process';
import { CommandValidator } from '../security/validator.js';
import { withTimeout } from '../utils/timeout.js';
import { logger } from '../utils/logger.js';

export interface ReplSessionResult {
  output: string;
  error?: string;
  success: boolean;
}

export class ReplSession {
  private process: ChildProcess | null = null;
  private command: string;
  private isActive: boolean = false;
  private outputBuffer: string = '';
  private errorBuffer: string = '';
  private sessionId: string;

  constructor(command: string) {
    CommandValidator.validateCommand(command);
    this.command = command;
    this.sessionId = Math.random().toString(36).substring(2, 15);
    logger.info(`Created REPL session ${this.sessionId} for command: ${command}`);
  }

  async startSession(args: string[] = []): Promise<ReplSessionResult> {
    if (this.isActive) {
      throw new Error('Session is already active');
    }

    logger.info(`Starting REPL session ${this.sessionId}`);
    
    try {
      // Validate arguments
      args.forEach(arg => CommandValidator.validateArgument(arg));

      const commandParts = this.command.split(/\s+/);
      const baseCommand = commandParts[0];
      const commandArgs = [...commandParts.slice(1), ...args];

      this.process = spawn(baseCommand, commandArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      this.setupProcessHandlers();
      this.isActive = true;

      // Wait a bit for the process to start
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!this.process || this.process.killed) {
        throw new Error('Failed to start REPL process');
      }

      logger.info(`REPL session ${this.sessionId} started successfully`);
      return {
        output: `Session ${this.sessionId} started`,
        success: true,
      };
    } catch (error) {
      logger.error(`Failed to start REPL session ${this.sessionId}:`, error);
      this.isActive = false;
      throw error;
    }
  }

  async send(command: string): Promise<ReplSessionResult> {
    if (!this.isActive || !this.process) {
      throw new Error('Session is not active');
    }

    CommandValidator.validateArgument(command);
    
    logger.debug(`Sending command to session ${this.sessionId}: ${command}`);
    
    try {
      this.process.stdin?.write(command + '\n');
      return {
        output: 'Command sent',
        success: true,
      };
    } catch (error) {
      logger.error(`Failed to send command to session ${this.sessionId}:`, error);
      return {
        output: '',
        error: String(error),
        success: false,
      };
    }
  }

  async receive(timeoutMs: number = 10000, endMarker?: string): Promise<ReplSessionResult> {
    if (!this.isActive || !this.process) {
      throw new Error('Session is not active');
    }

    logger.debug(`Receiving output from session ${this.sessionId}, timeout: ${timeoutMs}ms`);

    try {
      const result = await withTimeout(
        this.waitForOutput(endMarker),
        timeoutMs,
        `Receive timeout after ${timeoutMs}ms`
      );

      return {
        output: result.output,
        error: result.error,
        success: true,
      };
    } catch (error) {
      logger.error(`Failed to receive from session ${this.sessionId}:`, error);
      return {
        output: this.outputBuffer,
        error: String(error),
        success: false,
      };
    }
  }

  async sendAndReceive(command: string, timeoutMs: number = 10000, endMarker?: string): Promise<ReplSessionResult> {
    const sendResult = await this.send(command);
    if (!sendResult.success) {
      return sendResult;
    }

    // Small delay to let the command process
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return await this.receive(timeoutMs, endMarker);
  }

  async closeSession(): Promise<ReplSessionResult> {
    logger.info(`Closing REPL session ${this.sessionId}`);

    if (!this.isActive || !this.process) {
      return {
        output: 'Session was not active',
        success: true,
      };
    }

    try {
      // Try graceful shutdown first
      this.process.stdin?.end();
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!this.process.killed) {
        this.process.kill('SIGTERM');
        
        // Wait a bit more
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!this.process.killed) {
          this.process.kill('SIGKILL');
        }
      }

      this.isActive = false;
      this.process = null;

      logger.info(`REPL session ${this.sessionId} closed`);
      return {
        output: `Session ${this.sessionId} closed`,
        success: true,
      };
    } catch (error) {
      logger.error(`Error closing session ${this.sessionId}:`, error);
      this.isActive = false;
      this.process = null;
      return {
        output: '',
        error: String(error),
        success: false,
      };
    }
  }

  private setupProcessHandlers(): void {
    if (!this.process) return;

    this.process.stdout?.on('data', (data) => {
      this.outputBuffer += data.toString();
    });

    this.process.stderr?.on('data', (data) => {
      this.errorBuffer += data.toString();
    });

    this.process.on('close', (code) => {
      logger.info(`REPL session ${this.sessionId} process closed with code: ${code}`);
      this.isActive = false;
    });

    this.process.on('error', (error) => {
      logger.error(`REPL session ${this.sessionId} process error:`, error);
      this.isActive = false;
    });
  }

  private async waitForOutput(endMarker?: string): Promise<{ output: string; error?: string }> {
    return new Promise((resolve) => {
      const checkOutput = () => {
        if (endMarker) {
          if (this.outputBuffer.includes(endMarker)) {
            const output = this.outputBuffer;
            const error = this.errorBuffer || undefined;
            this.outputBuffer = '';
            this.errorBuffer = '';
            resolve({ output, error });
            return;
          }
        } else {
          // If no end marker, wait for a brief pause in output
          setTimeout(() => {
            const output = this.outputBuffer;
            const error = this.errorBuffer || undefined;
            this.outputBuffer = '';
            this.errorBuffer = '';
            resolve({ output, error });
          }, 100);
          return;
        }

        // Check again after a short delay
        setTimeout(checkOutput, 50);
      };

      checkOutput();
    });
  }

  getSessionId(): string {
    return this.sessionId;
  }

  isSessionActive(): boolean {
    return this.isActive;
  }
}
