import { Arguments } from 'yargs';
import { logger } from './utils/logger';
import { FastMCP } from 'fastmcp';
import { buildToolsFromArgs } from './tool/toolFactory';

export async function startMcpServer(argv: Arguments) {
  logger.info('启动 shell-mcp server，参数:', argv);
  const tools = buildToolsFromArgs(argv);
  const server = new FastMCP({
    name: 'shell-mcp',
    version: '0.1.0',
  });
  for (const tool of tools) {
    // 如果是 REPL 工具，自动展开 tools 字段
    if ((tool as any).tools) {
      for (const [subName, subToolRaw] of Object.entries((tool as any).tools)) {
        const subTool = subToolRaw as { description: string; arguments: any; execute?: (args: any) => Promise<any> };
        if (typeof subTool.execute === 'function') {
          server.addTool({
            name: subName,
            description: subTool.description,
            parameters: subTool.arguments,
            execute: subTool.execute,
          });
        }
      }
    } else if (!('tools' in tool) && typeof (tool as any).execute === 'function') {
      server.addTool(tool);
    }
  }
  await server.start({ transportType: 'stdio' });
} 