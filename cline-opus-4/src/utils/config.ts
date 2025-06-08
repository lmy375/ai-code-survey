import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { createLogger } from './logger.js';

const logger = createLogger();

export interface ToolConfig {
  cmd: string;
  description?: string;
  args?: Record<string, {
    type: string;
    description?: string;
    required?: boolean;
    default?: any;
  }>;
}

export type Config = Record<string, ToolConfig>;

export async function loadConfig(configPath: string): Promise<Config> {
  try {
    const absolutePath = resolve(configPath);
    logger.debug('Loading configuration from', { path: absolutePath });
    
    const content = await readFile(absolutePath, 'utf-8');
    const config = JSON.parse(content) as Config;
    
    // Validate configuration
    for (const [name, toolConfig] of Object.entries(config)) {
      if (!toolConfig.cmd) {
        throw new Error(`Tool '${name}' is missing required 'cmd' field`);
      }
      
      // Validate argument types
      if (toolConfig.args) {
        for (const [argName, argConfig] of Object.entries(toolConfig.args)) {
          const validTypes = ['string', 'number', 'boolean', 'array', 'object'];
          if (!validTypes.includes(argConfig.type)) {
            throw new Error(`Invalid type '${argConfig.type}' for argument '${argName}' in tool '${name}'`);
          }
        }
      }
    }
    
    logger.info('Configuration loaded successfully', { tools: Object.keys(config).length });
    return config;
  } catch (error) {
    logger.error('Failed to load configuration', error);
    throw error;
  }
}
