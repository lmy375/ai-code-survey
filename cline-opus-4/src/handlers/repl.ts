import { spawn, ChildProcess } from 'child_process';
import { createLogger } from '../utils/logger.js';
import { sanitizeEnvironment } from '../utils/security.js';

const logger = createLogger();

export class ReplHandler {
  private process: ChildProcess | null = null;
  private buffer: string = '';
  private isReading = false;

  constructor(private program: string) {}

  async startSession(args?: string[]): Promise<string> {
    if (this.process) {
      throw new Error('Session already started');
    }

    try {
      logger.info('Starting REPL session', { program: this.program, args });
      
      this.process = spawn(this.program, args || [], {
        env: sanitizeEnvironment(process.env),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.buffer = '';

      this.process.stdout?.on('data', (data) => {
        this.buffer += data.toString();
        logger.debug('REPL stdout', { data: data.toString() });
      });

      this.process.stderr?.on('data', (data) => {
        this.buffer += data.toString();
        logger.debug('REPL stderr', { data: data.toString() });
      });

      this.process.on('error', (error) => {
        logger.error('REPL process error', error);
        this.cleanup();
      });

      this.process.on('exit', (code) => {
        logger.info('REPL process exited', { code });
        this.cleanup();
      });

      // Wait a bit for the REPL to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return `Started ${this.program} session`;
    } catch (error) {
      logger.error('Failed to start REPL session', error);
      this.cleanup();
      throw error;
    }
  }

  async send(command: string): Promise<string> {
    if (!this.process || !this.process.stdin) {
      throw new Error('No active session');
    }

    try {
      logger.debug('Sending command to REPL', { command });
      this.process.stdin.write(command + '\n');
      return 'Command sent';
    } catch (error) {
      logger.error('Failed to send command', error);
      throw error;
    }
  }

  async receive(timeout: number = 10, endMarker?: string): Promise<string> {
    if (!this.process) {
      throw new Error('No active session');
    }

    if (this.isReading) {
      throw new Error('Already reading output');
    }

    this.isReading = true;
    const startTime = Date.now();
    const timeoutMs = timeout * 1000;

    try {
      return await new Promise((resolve, reject) => {
        const checkBuffer = () => {
          // Check if we have the end marker
          if (endMarker && this.buffer.includes(endMarker)) {
            const index = this.buffer.indexOf(endMarker) + endMarker.length;
            const output = this.buffer.substring(0, index);
            this.buffer = this.buffer.substring(index);
            this.isReading = false;
            resolve(output);
            return;
          }

          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            const output = this.buffer;
            this.buffer = '';
            this.isReading = false;
            resolve(output);
            return;
          }

          // Continue checking
          setTimeout(checkBuffer, 100);
        };

        checkBuffer();
      });
    } catch (error) {
      this.isReading = false;
      throw error;
    }
  }

  async sendReceive(command: string, timeout: number = 10, endMarker?: string): Promise<string> {
    // Clear buffer before sending
    this.buffer = '';
    
    await this.send(command);
    
    // Wait a bit for the command to be processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return await this.receive(timeout, endMarker);
  }

  async closeSession(args?: string[]): Promise<string> {
    if (!this.process) {
      throw new Error('No active session');
    }

    try {
      logger.info('Closing REPL session');
      
      // Try to exit gracefully first
      if (this.process.stdin) {
        const exitCommands = ['exit', 'quit', '\\q', '.exit'];
        for (const cmd of exitCommands) {
          try {
            this.process.stdin.write(cmd + '\n');
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch {
            // Ignore errors
          }
        }
      }

      // Give it time to exit gracefully
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Force kill if still running
      if (this.process && !this.process.killed) {
        this.process.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!this.process.killed) {
          this.process.kill('SIGKILL');
        }
      }

      this.cleanup();
      return 'Session closed';
    } catch (error) {
      logger.error('Failed to close session', error);
      this.cleanup();
      throw error;
    }
  }

  private cleanup() {
    this.process = null;
    this.buffer = '';
    this.isReading = false;
  }
}
