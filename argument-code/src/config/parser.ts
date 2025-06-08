import { z } from 'zod';
import { readFileSync } from 'fs';
import { logger } from '../utils/logger.js';

export const ArgumentSchema = z.object({
  type: z.enum(['string', 'int', 'float', 'boolean']),
  description: z.string(),
  optional: z.boolean().optional().default(false),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const CommandConfigSchema = z.object({
  cmd: z.string(),
  description: z.string().optional(),
  args: z.record(z.string(), ArgumentSchema).optional().default({}),
  timeout: z.number().optional().default(30000),
});

export const ConfigFileSchema = z.record(z.string(), CommandConfigSchema);

export type ArgumentConfig = z.infer<typeof ArgumentSchema>;
export type CommandConfig = z.infer<typeof CommandConfigSchema>;
export type ConfigFile = z.infer<typeof ConfigFileSchema>;

export class ConfigParser {
  static parseConfigFile(filePath: string): ConfigFile {
    try {
      logger.info(`Loading configuration from: ${filePath}`);
      const content = readFileSync(filePath, 'utf-8');
      const rawConfig = JSON.parse(content);
      const config = ConfigFileSchema.parse(rawConfig);
      logger.info(`Successfully loaded ${Object.keys(config).length} commands from config`);
      return config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Configuration validation failed:', error.errors);
        throw new Error(`Invalid configuration: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('Failed to load configuration:', error);
      throw error;
    }
  }

  static parseArgumentString(argString: string): ArgumentConfig {
    // Parse format: "name:type:description" or "name:type:'description with spaces'"
    const parts = argString.split(':');
    if (parts.length < 2) {
      throw new Error(`Invalid argument format: ${argString}. Expected format: name:type:description`);
    }

    const type = parts[1] as 'string' | 'int' | 'float' | 'boolean';
    if (!['string', 'int', 'float', 'boolean'].includes(type)) {
      throw new Error(`Invalid argument type: ${type}. Must be one of: string, int, float, boolean`);
    }

    let description = parts.slice(2).join(':');
    // Remove quotes if present
    if (description.startsWith("'") && description.endsWith("'")) {
      description = description.slice(1, -1);
    }

    return {
      type,
      description: description || `${parts[0]} parameter`,
      optional: false,
    };
  }

  static generateDefaultDescription(commandName: string, command: string): string {
    if (commandName && commandName !== command) {
      return `Execute '${command}' command`;
    }
    return `Run '${command}' command`;
  }

  static generateDefaultName(command: string): string {
    // Extract the base command name
    const parts = command.trim().split(/\s+/);
    const baseCommand = parts[0];
    
    // Remove path and extension
    const commandName = baseCommand.split('/').pop()?.split('.')[0] || 'command';
    
    // Sanitize for use as tool name
    return commandName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  }
}
