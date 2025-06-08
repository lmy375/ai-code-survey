import { ReplConfig, MCPTool } from '../types.js';
import { ReplSessionManager } from '../repl/repl-session.js';
import { logger } from '../utils/logger.js';

export class ReplTools {
  constructor(
    private config: ReplConfig,
    private sessionManager: ReplSessionManager
  ) {}

  getTools(): MCPTool[] {
    const prefix = this.config.name || this.config.command;
    
    return [
      {
        name: `${prefix}_start_session`,
        description: `Start a ${this.config.command} REPL session`,
        inputSchema: {
          type: 'object',
          properties: {
            args: {
              type: 'array',
              description: 'Additional arguments to start the session',
              optional: true,
            },
          },
        },
      },
      {
        name: `${prefix}_send`,
        description: `Send command to the ${this.config.command} session`,
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID returned from start_session',
            },
            command: {
              type: 'string',
              description: 'Command to send to the session',
            },
          },
          required: ['sessionId', 'command'],
        },
      },
      {
        name: `${prefix}_recv`,
        description: `Read output from the ${this.config.command} session`,
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in seconds',
              default: 10,
              optional: true,
            },
            endMarker: {
              type: 'string',
              description: 'Read until this marker is found',
              optional: true,
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: `${prefix}_send_recv`,
        description: `Send command and receive output in one call`,
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID',
            },
            command: {
              type: 'string',
              description: 'Command to send',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in seconds',
              default: 10,
              optional: true,
            },
            endMarker: {
              type: 'string',
              description: 'Read until this marker is found',
              optional: true,
            },
          },
          required: ['sessionId', 'command'],
        },
      },
      {
        name: `${prefix}_close_session`,
        description: `Close a ${this.config.command} REPL session`,
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID to close',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: `${prefix}_list_sessions`,
        description: `List all active ${this.config.command} sessions`,
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
    const prefix = this.config.name || this.config.command;
    const action = toolName.replace(`${prefix}_`, '');

    try {
      switch (action) {
        case 'start_session':
          return await this.startSession(args);
        case 'send':
          return await this.sendCommand(args);
        case 'recv':
          return await this.receiveOutput(args);
        case 'send_recv':
          return await this.sendAndReceive(args);
        case 'close_session':
          return await this.closeSession(args);
        case 'list_sessions':
          return await this.listSessions();
        default:
          throw new Error(`Unknown REPL action: ${action}`);
      }
    } catch (error) {
      logger.error(`REPL tool execution failed: ${toolName}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async startSession(args: Record<string, any>): Promise<any> {
    try {
      const sessionId = await this.sessionManager.startSession(
        this.config,
        args.args || []
      );
      
      logger.info(`Started REPL session: ${sessionId}`);
      return {
        success: true,
        sessionId,
        message: `Session started successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start session',
      };
    }
  }

  private async sendCommand(args: Record<string, any>): Promise<any> {
    try {
      await this.sessionManager.sendCommand(args.sessionId, args.command);
      return {
        success: true,
        message: 'Command sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send command',
      };
    }
  }

  private async receiveOutput(args: Record<string, any>): Promise<any> {
    try {
      const result = await this.sessionManager.receiveOutput(args.sessionId, {
        timeout: (args.timeout || 10) * 1000,
        endMarker: args.endMarker,
      });

      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr,
        timeout: result.timeout,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to receive output',
      };
    }
  }

  private async sendAndReceive(args: Record<string, any>): Promise<any> {
    try {
      const result = await this.sessionManager.sendAndReceive(
        args.sessionId,
        args.command,
        {
          timeout: (args.timeout || 10) * 1000,
          endMarker: args.endMarker,
        }
      );

      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr,
        timeout: result.timeout,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send and receive',
      };
    }
  }

  private async closeSession(args: Record<string, any>): Promise<any> {
    try {
      const success = this.sessionManager.closeSession(args.sessionId);
      return {
        success,
        message: success ? 'Session closed successfully' : 'Session not found',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close session',
      };
    }
  }

  private async listSessions(): Promise<any> {
    try {
      const sessions = this.sessionManager.listSessions();
      return {
        success: true,
        sessions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list sessions',
      };
    }
  }
}