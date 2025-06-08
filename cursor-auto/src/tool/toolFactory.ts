import { createSingleCommandTool } from './singleCommandTool';
import { createReplTool } from './replTool';
import { logger } from '../utils/logger';
import fs from 'fs';
import { historyManager } from '../history/historyManager';
import { z } from 'zod';

export function buildToolsFromArgs(argv: any) {
  if (argv.cmd) {
    // 单个命令
    const historyTools = [
      {
        name: 'history-query',
        description: '查询命令/会话历史',
        parameters: z.object({ type: z.string().optional(), tool: z.string().optional(), sessionId: z.string().optional() }),
        execute: async (args: any) => {
          return historyManager.query(args);
        },
      },
      {
        name: 'history-export',
        description: '导出全部历史',
        parameters: z.object({}),
        execute: async () => {
          return historyManager.exportAll();
        },
      },
    ];
    return [
      createSingleCommandTool({
        name: argv.name || 'shell-cmd',
        description: argv.description,
        cmd: argv.cmd,
        args: parseArgsDef(argv.args),
      }),
      ...historyTools,
    ];
  } else if (argv.config) {
    // 批量 config
    const config = JSON.parse(fs.readFileSync(argv.config, 'utf-8'));
    const historyTools = [
      {
        name: 'history-query',
        description: '查询命令/会话历史',
        parameters: z.object({ type: z.string().optional(), tool: z.string().optional(), sessionId: z.string().optional() }),
        execute: async (args: any) => {
          return historyManager.query(args);
        },
      },
      {
        name: 'history-export',
        description: '导出全部历史',
        parameters: z.object({}),
        execute: async () => {
          return historyManager.exportAll();
        },
      },
    ];
    return [
      ...Object.entries(config).map(([name, def]: any) =>
        createSingleCommandTool({
          name,
          description: def.description,
          cmd: def.cmd,
          args: def.args,
        })
      ),
      ...historyTools,
    ];
  } else if (argv.repl) {
    // REPL 工具
    const historyTools = [
      {
        name: 'history-query',
        description: '查询命令/会话历史',
        parameters: z.object({ type: z.string().optional(), tool: z.string().optional(), sessionId: z.string().optional() }),
        execute: async (args: any) => {
          return historyManager.query(args);
        },
      },
      {
        name: 'history-export',
        description: '导出全部历史',
        parameters: z.object({}),
        execute: async () => {
          return historyManager.exportAll();
        },
      },
    ];
    return [createReplTool(argv.repl), ...historyTools];
  }
  return [];
}

function parseArgsDef(args: any): Record<string, { type: string; description?: string }> | undefined {
  if (!args) return undefined;
  // 支持 "OPND1:int:'desc'" 形式
  const result: Record<string, { type: string; description?: string }> = {};
  for (const arg of args) {
    const m = String(arg).match(/^(\w+):(\w+):'([^']*)'$/);
    if (m) {
      result[m[1]] = { type: m[2], description: m[3] };
    }
  }
  return result;
} 