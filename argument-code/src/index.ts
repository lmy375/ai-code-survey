#!/usr/bin/env node

import { Command } from 'commander';
import { ShellMcpServer } from './server.js';
import { logger, LogLevel } from './utils/logger.js';

const program = new Command();

program
  .name('shell-mcp')
  .description('Convert shell commands and console applications into MCP servers')
  .version('1.0.0');

// Single command mode
program
  .option('--cmd <command>', 'Command to execute')
  .option('--name <name>', 'Tool name (auto-generated if not provided)')
  .option('--description <description>', 'Tool description')
  .option('--args <args...>', 'Tool arguments in format: name:type:description')
  .option('--timeout <timeout>', 'Command timeout in milliseconds', '30000');

// REPL mode
program
  .option('--repl <command>', 'REPL command to wrap');

// Config file mode
program
  .option('--config <file>', 'Configuration file path');

// Global options
program
  .option('--verbose', 'Enable verbose logging')
  .option('--debug', 'Enable debug logging');

program.parse();

const options = program.opts();

// Setup logging
if (options.debug) {
  logger.setLogLevel(LogLevel.DEBUG);
} else if (options.verbose) {
  logger.setLogLevel(LogLevel.INFO);
} else {
  logger.setLogLevel(LogLevel.WARN);
}

async function main() {
  try {
    // Validate options
    const hasCommand = !!options.cmd;
    const hasRepl = !!options.repl;
    const hasConfig = !!options.config;

    const modeCount = [hasCommand, hasRepl, hasConfig].filter(Boolean).length;
    
    if (modeCount === 0) {
      console.error('Error: Must specify one of --cmd, --repl, or --config');
      process.exit(1);
    }
    
    if (modeCount > 1) {
      console.error('Error: Cannot specify multiple modes (--cmd, --repl, --config)');
      process.exit(1);
    }

    // Create server options
    const serverOptions = {
      command: options.cmd,
      name: options.name,
      description: options.description,
      args: options.args,
      timeout: parseInt(options.timeout, 10),
      replCommand: options.repl,
      configFile: options.config,
    };

    // Create and start server
    const server = new ShellMcpServer(serverOptions);
    await server.start();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
