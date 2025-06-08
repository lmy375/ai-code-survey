#!/usr/bin/env node

import { program } from 'commander';
import { ShellMcpServer } from './core/shell-mcp-server.js';
import { ConfigParser } from './utils/config-parser.js';
import { logger, LogLevel } from './utils/logger.js';
import { CommandLineArgs } from './types.js';

async function main(): Promise<void> {
  program
    .name('shell-mcp')
    .description('A versatile MCP server that wraps shell commands and REPL sessions as MCP tools')
    .version('1.0.0');

  program
    .option('--cmd <command>', 'Single command to wrap as MCP tool')
    .option('--name <name>', 'Name for the tool (defaults to command name)')
    .option('--description <description>', 'Description for the tool')
    .option('--args <args...>', 'Arguments definition in format NAME:type:description')
    .option('--config <path>', 'Path to configuration file')
    .option('--repl <command>', 'REPL command to wrap as MCP tools')
    .option('--timeout <seconds>', 'Command timeout in seconds', parseInt)
    .option('--verbose', 'Enable verbose logging')
    .option('--debug', 'Enable debug logging')
    .option('--info', 'Show server information and exit');

  program.parse();

  const options = program.opts();

  // Setup logging
  if (options.debug) {
    logger.setLevel(LogLevel.DEBUG);
  } else if (options.verbose) {
    logger.setLevel(LogLevel.INFO);
  }

  try {
    // Parse configuration
    let config;
    
    if (options.config) {
      config = ConfigParser.parseConfigFile(options.config);
    } else {
      const commandLineArgs: CommandLineArgs = {
        cmd: options.cmd,
        name: options.name,
        description: options.description,
        args: options.args,
        repl: options.repl,
        timeout: options.timeout,
      };
      
      config = ConfigParser.parseCommandLineArgs(commandLineArgs);
    }

    // Validate configuration
    if (!config.commands && !config.repl) {
      logger.error('No commands or REPL configuration provided');
      console.error('Error: Must provide either --cmd, --repl, or --config');
      process.exit(1);
    }

    // Create and start server
    const server = new ShellMcpServer(config);

    // Handle --info flag
    if (options.info) {
      console.log(JSON.stringify(server.getInfo(), null, 2));
      process.exit(0);
    }

    await server.start();
  } catch (error) {
    logger.error('Application error:', error);
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Handle unhandled promises and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}