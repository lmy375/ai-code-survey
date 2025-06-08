import { readFileSync } from 'fs';
import { CommandLineArgs, CommandConfig, ShellMcpConfig, ArgumentConfig } from '../types.js';
import { logger } from './logger.js';

export class ConfigParser {
  static parseCommandLineArgs(args: CommandLineArgs): ShellMcpConfig {
    const config: ShellMcpConfig = {};

    // Handle single command configuration
    if (args.cmd) {
      const commandConfig: CommandConfig = {
        cmd: args.cmd,
        ...(args.description && { description: args.description }),
        ...(args.timeout && { timeout: args.timeout }),
      };

      // Parse arguments if provided
      if (args.args && args.args.length > 0) {
        commandConfig.args = this.parseArgumentStrings(args.args);
      }

      const toolName = args.name || this.generateToolName(args.cmd);
      config.commands = { [toolName]: commandConfig };
    }

    // Handle REPL configuration
    if (args.repl) {
      config.repl = {
        command: args.repl,
        ...(args.description && { description: args.description }),
        ...(args.timeout && { timeout: args.timeout }),
      };
    }

    return config;
  }

  static parseConfigFile(configPath: string): ShellMcpConfig {
    try {
      logger.info(`Loading configuration from: ${configPath}`);
      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content) as ShellMcpConfig;
      
      // Validate the configuration
      this.validateConfig(config);
      
      return config;
    } catch (error) {
      logger.error(`Failed to parse config file: ${configPath}`, error);
      throw new Error(`Configuration file error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static parseArgumentStrings(argStrings: string[]): Record<string, ArgumentConfig> {
    const args: Record<string, ArgumentConfig> = {};

    for (const argString of argStrings) {
      // Format: "NAME:type:'description'" or "NAME:type:description"
      const match = argString.match(/^([A-Z_][A-Z0-9_]*):([^:]+):(.+)$/i);
      if (!match) {
        throw new Error(`Invalid argument format: ${argString}. Expected format: NAME:type:description`);
      }

      const [, name, type, description] = match;
      
      // Remove quotes from description if present
      const cleanDescription = description.replace(/^['"]|['"]$/g, '');

      // Validate type
      const validTypes = ['string', 'int', 'float', 'boolean', 'string[]'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid argument type: ${type}. Valid types: ${validTypes.join(', ')}`);
      }

      args[name] = {
        type: type as ArgumentConfig['type'],
        description: cleanDescription,
      };
    }

    return args;
  }

  private static generateToolName(command: string): string {
    // Extract the base command name and make it tool-friendly
    const baseName = command.split(' ')[0].split('/').pop() || 'command';
    return baseName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  }

  private static validateConfig(config: ShellMcpConfig): void {
    if (!config.commands && !config.repl) {
      throw new Error('Configuration must contain either commands or repl configuration');
    }

    // Validate commands
    if (config.commands) {
      for (const [toolName, commandConfig] of Object.entries(config.commands)) {
        if (!commandConfig.cmd) {
          throw new Error(`Command configuration '${toolName}' missing 'cmd' field`);
        }

        if (commandConfig.args) {
          for (const [argName, argConfig] of Object.entries(commandConfig.args)) {
            if (!argConfig.type || !argConfig.description) {
              throw new Error(`Invalid argument configuration for '${toolName}.${argName}'`);
            }
          }
        }
      }
    }

    // Validate REPL config
    if (config.repl) {
      if (!config.repl.command) {
        throw new Error('REPL configuration missing command field');
      }
    }
  }

  static mergeConfigs(base: ShellMcpConfig, override: ShellMcpConfig): ShellMcpConfig {
    const merged: ShellMcpConfig = { ...base };

    if (override.commands) {
      merged.commands = { ...merged.commands, ...override.commands };
    }

    if (override.repl) {
      merged.repl = override.repl;
    }

    return merged;
  }
}