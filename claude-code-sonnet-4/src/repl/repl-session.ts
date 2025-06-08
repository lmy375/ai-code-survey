import { spawn } from 'child_process';
import { ReplConfig, ReplSession } from '../types.js';
import { SecurityValidator } from '../security/validator.js';
import { logger } from '../utils/logger.js';

export class ReplSessionManager {
  private sessions: Map<string, ReplSession> = new Map();
  private sessionCounter = 0;

  async startSession(config: ReplConfig, args: string[] = []): Promise<string> {
    const sessionId = `session_${++this.sessionCounter}_${Date.now()}`;
    
    logger.info(`Starting REPL session: ${sessionId} with command: ${config.command}`);

    // Security validation
    const commandValidation = SecurityValidator.validateCommand(config.command);
    if (!commandValidation.valid) {
      throw new Error(`Command validation failed: ${commandValidation.reason}`);
    }

    // Validate arguments
    for (const arg of [...(config.args || []), ...args]) {
      const argValidation = SecurityValidator.validateArgument(arg);
      if (!argValidation.valid) {
        throw new Error(`Argument validation failed: ${argValidation.reason}`);
      }
    }

    const allArgs = [...(config.args || []), ...args];
    
    try {
      const processEnv: Record<string, string> = {};
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
          processEnv[key] = value;
        }
      }

      const childProcess = spawn(config.command, allArgs, {
        stdio: 'pipe',
        env: SecurityValidator.sanitizeEnvironmentVariables(processEnv),
      });

      const session: ReplSession = {
        id: sessionId,
        process: childProcess,
        isActive: true,
        command: config.command,
        startTime: new Date(),
      };

      this.sessions.set(sessionId, session);

      // Handle process exit
      childProcess.on('exit', (code: number | null) => {
        logger.info(`REPL session ${sessionId} exited with code: ${code}`);
        session.isActive = false;
      });

      childProcess.on('error', (error: Error) => {
        logger.error(`REPL session ${sessionId} error:`, error);
        session.isActive = false;
      });

      return sessionId;
    } catch (error) {
      logger.error(`Failed to start REPL session:`, error);
      throw error;
    }
  }

  async sendCommand(sessionId: string, command: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      throw new Error(`Session ${sessionId} not found or not active`);
    }

    // Security validation for the command
    const validation = SecurityValidator.validateCommand(command);
    if (!validation.valid) {
      throw new Error(`Command validation failed: ${validation.reason}`);
    }

    logger.debug(`Sending command to session ${sessionId}: ${command}`);
    
    session.process.stdin?.write(command + '\n');
  }

  async receiveOutput(
    sessionId: string,
    options: {
      timeout?: number;
      endMarker?: string;
    } = {}
  ): Promise<{ stdout: string; stderr: string; timeout: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      throw new Error(`Session ${sessionId} not found or not active`);
    }

    const { timeout = 10000, endMarker } = options;

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let isTimeout = false;

      const timeoutId = setTimeout(() => {
        isTimeout = true;
        resolve({ stdout, stderr, timeout: true });
      }, timeout);

      const stdoutHandler = (data: Buffer): void => {
        const chunk = data.toString();
        stdout += chunk;
        
        if (endMarker && stdout.includes(endMarker)) {
          clearTimeout(timeoutId);
          session.process.stdout?.off('data', stdoutHandler);
          session.process.stderr?.off('data', stderrHandler);
          resolve({ stdout, stderr, timeout: false });
        }
      };

      const stderrHandler = (data: Buffer): void => {
        stderr += data.toString();
      };

      session.process.stdout?.on('data', stdoutHandler);
      session.process.stderr?.on('data', stderrHandler);

      // If no end marker specified, wait for timeout or immediate data
      if (!endMarker) {
        setTimeout(() => {
          if (!isTimeout) {
            clearTimeout(timeoutId);
            session.process.stdout?.off('data', stdoutHandler);
            session.process.stderr?.off('data', stderrHandler);
            resolve({ stdout, stderr, timeout: false });
          }
        }, Math.min(timeout, 1000)); // Wait max 1 second if no end marker
      }
    });
  }

  async sendAndReceive(
    sessionId: string,
    command: string,
    options: {
      timeout?: number;
      endMarker?: string;
    } = {}
  ): Promise<{ stdout: string; stderr: string; timeout: boolean }> {
    await this.sendCommand(sessionId, command);
    
    // Small delay to ensure command is processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.receiveOutput(sessionId, options);
  }

  closeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    logger.info(`Closing REPL session: ${sessionId}`);

    if (session.isActive) {
      session.process.kill('SIGTERM');
      session.isActive = false;
    }

    this.sessions.delete(sessionId);
    return true;
  }

  listSessions(): Array<{ id: string; command: string; isActive: boolean; startTime: Date }> {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      command: session.command,
      isActive: session.isActive,
      startTime: session.startTime,
    }));
  }

  cleanup(): void {
    logger.info('Cleaning up all REPL sessions');
    for (const session of this.sessions.values()) {
      if (session.isActive) {
        session.process.kill('SIGTERM');
      }
    }
    this.sessions.clear();
  }
}