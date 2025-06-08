import { execaCommand } from 'execa';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { sanitizeShellCommand } from '../security/shellSanitizer';
import { historyManager } from '../history/historyManager';

export interface SingleCommandToolConfig {
  name: string;
  description?: string;
  cmd: string;
  args?: Record<string, { type: string; description?: string }>;
  timeout?: number;
}

export function createSingleCommandTool(config: SingleCommandToolConfig) {
  // 参数 schema 构建
  const parameters = config.args
    ? z.object(
        Object.fromEntries(
          Object.entries(config.args).map(([k, v]) => [k, z.any()])
        )
      )
    : z.object({});

  return {
    name: config.name,
    description: config.description || `Run '${config.cmd}' command`,
    parameters,
    execute: async (args: any) => {
      // 安全防护
      const safeCmd = sanitizeShellCommand(config.cmd, args);
      logger.info(`执行命令: ${safeCmd}`);
      try {
        const { stdout } = await execaCommand(safeCmd, { timeout: config.timeout || 10000, shell: true });
        historyManager.add({
          timestamp: Date.now(),
          type: 'single',
          tool: config.name,
          input: args,
          output: stdout,
        });
        return stdout;
      } catch (err: any) {
        logger.error('命令执行失败', err);
        throw new Error('命令执行失败: ' + (err.message || err));
      }
    },
  };
} 