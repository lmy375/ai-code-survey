#!/usr/bin/env node
import { startMcpServer } from './mcpServer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

(async () => {
  const argv = await yargs(hideBin(process.argv))
    .option('cmd', { type: 'string', describe: '要执行的 shell 命令' })
    .option('name', { type: 'string', describe: 'tool 名称' })
    .option('description', { type: 'string', describe: 'tool 描述' })
    .option('args', { type: 'array', describe: 'tool 参数定义' })
    .option('config', { type: 'string', describe: '批量工具配置文件路径' })
    .option('repl', { type: 'string', describe: 'REPL/console 工具名' })
    .help()
    .parse();

  startMcpServer(argv);
})(); 