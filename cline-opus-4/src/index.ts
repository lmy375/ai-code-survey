#!/usr/bin/env node

import { Command } from 'commander';
import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { createLogger } from './utils/logger.js';
import { SingleCommandHandler } from './handlers/single-command.js';
import { ReplHandler } from './handlers/repl.js';
import { loadConfig } from './utils/config.js';

const logger = createLogger();
const program = new Command();

program
  .name('shell-mcp')
  .description('MCP Server that converts shell commands and REPL programs into MCP tools')
  .version('1.0.0');

program
  .option('--cmd <command>', 'Single command to execute')
  .option('--name <name>', 'Tool name')
  .option('--description <description>', 'Tool description')
  .option('--args <args...>', 'Tool arguments in format NAME:TYPE:DESCRIPTION')
  .option('--repl <program>', 'REPL program to wrap')
  .option('--config <path>', 'Path to configuration file')
  .option('--log-level <level>', 'Log level (debug, info, warn, error)', 'info')
  .parse(process.argv);

const options = program.opts();

async function main() {
  try {
    logger.level = options.logLevel;
    logger.info('Starting shell-mcp server', { options });

    const mcp = new FastMCP({
      name: 'shell-mcp',
      version: '1.0.0',
    });

    if (options.config) {
      // Load configuration from file
      const config = await loadConfig(options.config);
      logger.info('Loaded configuration', { tools: Object.keys(config) });

      for (const [name, toolConfig] of Object.entries(config)) {
        const handler = new SingleCommandHandler(
          name,
          toolConfig.cmd,
          toolConfig.description || '',
          toolConfig.args || {}
        );
        
        const schema = createParameterSchema(handler.getParameterSchema());
        
        mcp.addTool({
          name,
          description: toolConfig.description || `Execute ${name} command`,
          parameters: schema,
          execute: async (params) => handler.execute(params)
        });
      }
    } else if (options.repl) {
      // REPL mode
      logger.info('Starting in REPL mode', { program: options.repl });
      const handler = new ReplHandler(options.repl);
      
      mcp.addTool({
        name: 'start_session',
        description: 'Start a REPL session',
        parameters: z.object({
          args: z.array(z.string()).optional().describe('Additional arguments to start the session')
        }),
        execute: async (params) => handler.startSession(params.args)
      });

      mcp.addTool({
        name: 'send',
        description: 'Send command into the session',
        parameters: z.object({
          command: z.string().describe('Command to evaluate and execute')
        }),
        execute: async (params) => handler.send(params.command)
      });

      mcp.addTool({
        name: 'recv',
        description: 'Read output from the session',
        parameters: z.object({
          timeout: z.number().default(10).optional().describe('Timeout in seconds'),
          end: z.string().optional().describe('Read until we found the end mark')
        }),
        execute: async (params) => handler.receive(params.timeout || 10, params.end)
      });

      mcp.addTool({
        name: 'send_recv',
        description: 'Send and receive output in one call',
        parameters: z.object({
          command: z.string().describe('Command to evaluate and execute'),
          timeout: z.number().default(10).optional().describe('Timeout in seconds'),
          end: z.string().optional().describe('Read until we found the end mark')
        }),
        execute: async (params) => handler.sendReceive(params.command, params.timeout || 10, params.end)
      });

      mcp.addTool({
        name: 'close_session',
        description: 'Stop the REPL session',
        parameters: z.object({
          args: z.array(z.string()).optional().describe('Additional arguments to end the session')
        }),
        execute: async (params) => handler.closeSession(params.args)
      });
    } else if (options.cmd) {
      // Single command mode
      const name = options.name || 'execute';
      const description = options.description || `Execute command: ${options.cmd}`;
      const args = parseArguments(options.args || []);
      
      logger.info('Starting in single command mode', { name, command: options.cmd });
      
      const handler = new SingleCommandHandler(name, options.cmd, description, args);
      const schema = createParameterSchema(handler.getParameterSchema());
      
      mcp.addTool({
        name,
        description,
        parameters: schema,
        execute: async (params) => handler.execute(params)
      });
    } else {
      throw new Error('Must specify either --cmd, --repl, or --config');
    }

    // Start the server
    mcp.start({
      transportType: 'stdio'
    });
    
    logger.info('MCP server started successfully');
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

function createParameterSchema(params: Record<string, any>): z.ZodObject<any> {
  const shape: Record<string, any> = {};
  
  for (const [name, config] of Object.entries(params)) {
    let schema: any;
    
    switch (config.type) {
      case 'string':
        schema = z.string();
        break;
      case 'number':
      case 'int':
      case 'integer':
        schema = z.number();
        break;
      case 'boolean':
        schema = z.boolean();
        break;
      case 'array':
        schema = z.array(z.any());
        break;
      case 'object':
        schema = z.object({});
        break;
      default:
        schema = z.any();
    }
    
    if (config.description) {
      schema = schema.describe(config.description);
    }
    
    if (config.default !== undefined) {
      schema = schema.default(config.default);
    }
    
    if (config.required === false) {
      schema = schema.optional();
    }
    
    shape[name] = schema;
  }
  
  return z.object(shape);
}

function parseArguments(args: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const arg of args) {
    const parts = arg.split(':');
    if (parts.length < 2) {
      throw new Error(`Invalid argument format: ${arg}. Expected NAME:TYPE[:DESCRIPTION]`);
    }
    
    const [name, type, description] = parts;
    result[name] = {
      type: type.toLowerCase(),
      description: description || `Parameter ${name}`,
      required: true
    };
  }
  
  return result;
}

main().catch((error) => {
  logger.error('Unhandled error', error);
  process.exit(1);
});
