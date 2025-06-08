import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { ShellMcpConfig } from '../types.js';
import { CommandTool } from '../tools/command-tool.js';
import { ReplTools } from '../tools/repl-tools.js';
import { ReplSessionManager } from '../repl/repl-session.js';
import { logger } from '../utils/logger.js';

export class ShellMcpServer {
  private mcp: FastMCP;
  private replSessionManager: ReplSessionManager;
  private commandTools: Map<string, CommandTool> = new Map();
  private replTools?: ReplTools;

  constructor(private config: ShellMcpConfig) {
    this.mcp = new FastMCP({
      name: 'shell-mcp',
      version: '1.0.0',
    });
    this.replSessionManager = new ReplSessionManager();
    this.setupTools();
  }

  private setupTools(): void {
    logger.info('Setting up MCP tools...');

    // Setup command tools
    if (this.config.commands) {
      for (const [toolName, commandConfig] of Object.entries(this.config.commands)) {
        logger.debug(`Setting up command tool: ${toolName}`);
        const commandTool = new CommandTool(commandConfig, toolName);
        this.commandTools.set(toolName, commandTool);
        
        const mcpTool = commandTool.getMCPTool();
        
        // Convert MCP tool schema to Zod schema
        const zodSchema = this.convertToZodSchema(mcpTool.inputSchema);
        
        this.mcp.addTool({
          name: mcpTool.name,
          description: mcpTool.description,
          parameters: zodSchema,
          execute: async (args) => {
            const result = await commandTool.execute(args);
            return JSON.stringify(result, null, 2);
          }
        });
      }
    }

    // Setup REPL tools
    if (this.config.repl) {
      logger.debug(`Setting up REPL tools for: ${this.config.repl.command}`);
      this.replTools = new ReplTools(this.config.repl, this.replSessionManager);
      
      const replMcpTools = this.replTools.getTools();
      for (const tool of replMcpTools) {
        const zodSchema = this.convertToZodSchema(tool.inputSchema);
        
        this.mcp.addTool({
          name: tool.name,
          description: tool.description,
          parameters: zodSchema,
          execute: async (args) => {
            const result = await this.replTools!.executeTool(tool.name, args);
            return JSON.stringify(result, null, 2);
          }
        });
      }
    }

    logger.info(`Setup completed. Total tools: ${this.getToolCount()}`);
  }

  private convertToZodSchema(schema: any): z.ZodType<any> {
    if (!schema.properties) {
      return z.object({});
    }

    const zodProperties: Record<string, z.ZodType<any>> = {};
    
    for (const [key, prop] of Object.entries(schema.properties)) {
      const propSchema = prop as any;
      let zodType: z.ZodType<any>;

      switch (propSchema.type) {
        case 'string':
          zodType = z.string();
          break;
        case 'number':
        case 'int':
        case 'integer':
          zodType = z.number();
          break;
        case 'float':
          zodType = z.number();
          break;
        case 'boolean':
          zodType = z.boolean();
          break;
        case 'array':
          zodType = z.array(z.string());
          break;
        default:
          zodType = z.any();
      }

      if (propSchema.optional || !schema.required?.includes(key)) {
        zodType = zodType.optional();
      }

      if (propSchema.default !== undefined) {
        zodType = zodType.default(propSchema.default);
      }

      zodProperties[key] = zodType;
    }

    return z.object(zodProperties);
  }

  private getToolCount(): number {
    let count = this.commandTools.size;
    if (this.replTools) {
      count += this.replTools.getTools().length;
    }
    return count;
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting Shell MCP Server...');
      
      // Setup shutdown handlers
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());

      this.mcp.start({
        transportType: 'stdio'
      });
      logger.info('Shell MCP Server started successfully');
    } catch (error) {
      logger.error('Failed to start Shell MCP Server:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Shell MCP Server...');
    
    try {
      // Clean up REPL sessions
      this.replSessionManager.cleanup();
      
      logger.info('Shell MCP Server shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  getInfo(): any {
    return {
      name: 'shell-mcp',
      version: '1.0.0',
      description: 'A versatile MCP server that wraps shell commands and REPL sessions as MCP tools',
      tools: {
        commands: Object.keys(this.config.commands || {}),
        repl: this.config.repl ? this.config.repl.command : null,
        totalCount: this.getToolCount(),
      },
      sessions: this.replSessionManager.listSessions(),
    };
  }
}