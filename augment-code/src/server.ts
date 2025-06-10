import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { SingleCommandExecutor } from './commands/single-command.js';
import { ReplSession } from './commands/repl-session.js';
import { ConfigParser, ConfigFile, CommandConfig } from './config/parser.js';
import { logger } from './utils/logger.js';

export interface ServerOptions {
  // Single command options
  command?: string;
  name?: string;
  description?: string;
  args?: string[];
  timeout?: number;
  
  // REPL options
  replCommand?: string;
  
  // Config file options
  configFile?: string;
}

export class ShellMcpServer {
  private server: FastMCP;
  private singleCommands: Map<string, SingleCommandExecutor> = new Map();
  private replSessions: Map<string, ReplSession> = new Map();
  private replCommand?: string;

  constructor(options: ServerOptions) {
    this.server = new FastMCP({
      name: 'shell-mcp',
      version: '1.0.0',
    });
    this.setupServer(options);
  }

  private setupServer(options: ServerOptions): void {
    logger.info('Setting up shell-mcp server');

    if (options.configFile) {
      this.setupFromConfigFile(options.configFile);
    } else if (options.command) {
      this.setupSingleCommand(options);
    } else if (options.replCommand) {
      this.setupReplCommand(options.replCommand);
    } else {
      throw new Error('Must specify either --cmd, --repl, or --config');
    }
  }

  private setupFromConfigFile(configPath: string): void {
    logger.info(`Loading configuration from: ${configPath}`);
    const config = ConfigParser.parseConfigFile(configPath);
    
    for (const [name, commandConfig] of Object.entries(config)) {
      this.addSingleCommand(name, commandConfig);
    }
  }

  private setupSingleCommand(options: ServerOptions): void {
    if (!options.command) {
      throw new Error('Command is required for single command mode');
    }

    const name = options.name || ConfigParser.generateDefaultName(options.command);
    const description = options.description || ConfigParser.generateDefaultDescription(name, options.command);
    
    const args: Record<string, any> = {};
    if (options.args) {
      for (const argString of options.args) {
        const [argName, ...rest] = argString.split(':');
        if (rest.length > 0) {
          args[argName] = ConfigParser.parseArgumentString(argString);
        }
      }
    }

    const commandConfig: CommandConfig = {
      cmd: options.command,
      description,
      args,
      timeout: options.timeout || 30000,
    };

    this.addSingleCommand(name, commandConfig);
  }

  private setupReplCommand(replCommand: string): void {
    this.replCommand = replCommand;
    this.addReplTools();
  }

  private addSingleCommand(name: string, config: CommandConfig): void {
    logger.info(`Adding single command tool: ${name}`);

    const executor = new SingleCommandExecutor(config.cmd, config.args, config.timeout);
    this.singleCommands.set(name, executor);

    const toolDef = executor.getToolDefinition(name, config.description);

    // Convert our argument config to Zod schema for FastMCP
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    for (const [argName, argConfig] of Object.entries(toolDef.args)) {
      let zodType: z.ZodTypeAny;

      switch (argConfig.type) {
        case 'string':
          zodType = z.string().describe(argConfig.description);
          break;
        case 'int':
          zodType = z.number().int().describe(argConfig.description);
          break;
        case 'float':
          zodType = z.number().describe(argConfig.description);
          break;
        case 'boolean':
          zodType = z.boolean().describe(argConfig.description);
          break;
        default:
          zodType = z.string().describe(argConfig.description);
      }

      if (argConfig.optional) {
        zodType = zodType.optional();
      }

      if (argConfig.default !== undefined) {
        zodType = zodType.default(argConfig.default);
      }

      schemaFields[argName] = zodType;
    }

    const parametersSchema = Object.keys(schemaFields).length > 0
      ? z.object(schemaFields)
      : z.object({});

    this.server.addTool({
      name: toolDef.name,
      description: toolDef.description,
      parameters: parametersSchema,
      execute: async (args) => {
        try {
          const result = await executor.execute(args as Record<string, any>);

          if (result.success) {
            return result.stdout || 'Command executed successfully (no output)';
          } else {
            throw new Error(`Command failed with exit code ${result.exitCode}:\n${result.stderr || result.stdout}`);
          }
        } catch (error) {
          logger.error(`Error executing command ${name}:`, error);
          throw error;
        }
      },
    });
  }

  private addReplTools(): void {
    if (!this.replCommand) return;

    logger.info(`Adding REPL tools for command: ${this.replCommand}`);

    // Start session tool
    this.server.addTool({
      name: 'start_session',
      description: 'Start a REPL session',
      parameters: z.object({
        args: z.array(z.string()).optional().describe('Additional arguments to start the session'),
      }),
      execute: async (params) => {
        try {
          const session = new ReplSession(this.replCommand!);
          const result = await session.startSession(params.args || []);

          if (result.success) {
            this.replSessions.set(session.getSessionId(), session);
            return `Session started with ID: ${session.getSessionId()}`;
          } else {
            throw new Error(`Failed to start session: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          logger.error('Error starting session:', error);
          throw error;
        }
      },
    });

    // Send command tool
    this.server.addTool({
      name: 'send',
      description: 'Send command to the active session',
      parameters: z.object({
        command: z.string().describe('Command to send to the session'),
        session_id: z.string().optional().describe('Session ID (optional, uses first active session if not provided)'),
      }),
      execute: async (params) => {
        try {
          const session = this.getActiveSession(params.session_id);
          const result = await session.send(params.command);

          if (result.success) {
            return 'Command sent successfully';
          } else {
            throw new Error(`Error: ${result.error}`);
          }
        } catch (error) {
          logger.error('REPL send error:', error);
          throw error;
        }
      },
    });

    // Receive output tool
    this.server.addTool({
      name: 'recv',
      description: 'Receive output from the session',
      parameters: z.object({
        timeout: z.number().default(10).describe('Timeout in seconds'),
        end: z.string().optional().describe('End marker to wait for'),
        session_id: z.string().optional().describe('Session ID (optional)'),
      }),
      execute: async (params) => {
        try {
          const session = this.getActiveSession(params.session_id);
          const result = await session.receive((params.timeout || 10) * 1000, params.end);

          return result.output || 'No output received';
        } catch (error) {
          logger.error('REPL receive error:', error);
          throw error;
        }
      },
    });

    // Send and receive tool
    this.server.addTool({
      name: 'send_recv',
      description: 'Send command and receive output in one call',
      parameters: z.object({
        command: z.string().describe('Command to send'),
        timeout: z.number().default(10).describe('Timeout in seconds'),
        end: z.string().optional().describe('End marker to wait for'),
        session_id: z.string().optional().describe('Session ID (optional)'),
      }),
      execute: async (params) => {
        try {
          const session = this.getActiveSession(params.session_id);
          const result = await session.sendAndReceive(
            params.command,
            (params.timeout || 10) * 1000,
            params.end
          );

          return result.output || 'No output received';
        } catch (error) {
          logger.error('REPL send_recv error:', error);
          throw error;
        }
      },
    });

    // Close session tool
    this.server.addTool({
      name: 'close_session',
      description: 'Close the REPL session',
      parameters: z.object({
        session_id: z.string().optional().describe('Session ID (optional, closes all if not provided)'),
      }),
      execute: async (params) => {
        try {
          if (params.session_id) {
            const session = this.replSessions.get(params.session_id);
            if (!session) {
              throw new Error(`Session ${params.session_id} not found`);
            }
            await session.closeSession();
            this.replSessions.delete(params.session_id);
            return `Session ${params.session_id} closed`;
          } else {
            // Close all sessions
            for (const [id, session] of this.replSessions) {
              await session.closeSession();
            }
            const count = this.replSessions.size;
            this.replSessions.clear();
            return `Closed ${count} sessions`;
          }
        } catch (error) {
          logger.error('REPL close error:', error);
          throw error;
        }
      },
    });
  }

  private getActiveSession(sessionId?: string): ReplSession {
    if (sessionId) {
      const session = this.replSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      return session;
    }

    // Find first active session
    for (const session of this.replSessions.values()) {
      if (session.isSessionActive()) {
        return session;
      }
    }

    throw new Error('No active sessions found');
  }

  async start(): Promise<void> {
    logger.info('Starting shell-mcp server');
    await this.server.start({
      transportType: 'stdio',
    });
  }
}
