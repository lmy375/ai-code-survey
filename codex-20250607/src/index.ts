#!/usr/bin/env node
import { FastMCP } from 'fastmcp';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { z } from 'zod';
import { execaCommand } from 'execa';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

interface ArgDef { type: string; description?: string; optional?: boolean; }
interface ToolDef { cmd: string; args?: Record<string, ArgDef>; description?: string; }

// Simple history implementation
class History {
  file: string;
  records: { timestamp: number; command: string }[] = [];
  constructor(file = path.join(os.homedir(), '.shell-mcp-history.json')) {
    this.file = file;
  }
  async load() {
    try {
      const data = await fs.readFile(this.file, 'utf-8');
      this.records = JSON.parse(data);
    } catch {
      this.records = [];
    }
  }
  async save() {
    await fs.writeFile(this.file, JSON.stringify(this.records, null, 2));
  }
  async add(command: string) {
    this.records.push({ timestamp: Date.now(), command });
    await this.save();
  }
  last(n = 10) {
    return this.records.slice(-n);
  }
}

const history = new History();

// Session management
interface Session { proc: ChildProcessWithoutNullStreams; buffer: string; }
const sessions = new Map<string, Session>();

function sanitizeEnv(args: Record<string, any>) {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(args)) {
    env[k] = String(v);
  }
  return env;
}

function buildParameters(def?: Record<string, ArgDef>) {
  const shape: Record<string, any> = {};
  if (def) {
    for (const [k, v] of Object.entries(def)) {
      let t: any = z.string();
      if (v.type === 'int') t = z.number();
      else if (v.type === 'string[]') t = z.array(z.string());
      const schema = v.optional ? t.optional() : t;
      shape[k] = schema.describe(v.description || '');
    }
  }
  return z.object(shape);
}

function addShellTool(server: FastMCP, name: string, tool: ToolDef) {
  server.addTool({
    name,
    description: tool.description || `Run command ${tool.cmd}`,
    parameters: buildParameters(tool.args),
    execute: async (args) => {
      await history.add(`${name} ${JSON.stringify(args)}`);
      const env = { ...process.env, ...sanitizeEnv(args) };
      const { stdout } = await execaCommand(tool.cmd, {
        shell: '/bin/bash',
        env,
        timeout: 15000,
      });
      return stdout.trim();
    },
  });
}

function addHistoryTool(server: FastMCP) {
  server.addTool({
    name: 'history',
    description: 'Show executed command history',
    parameters: z.object({ limit: z.number().int().optional() }),
    execute: async (args) => {
      const limit = args.limit ?? 10;
      return JSON.stringify(history.last(limit));
    },
  });
}

function addSessionTools(server: FastMCP) {
  server.addTool({
    name: 'start-session',
    description: 'Start a REPL session',
    parameters: z.object({ args: z.array(z.string()).optional() }),
    execute: async ({ args }) => {
      const proc = spawn(args?.[0] ?? 'bash', args?.slice(1), { stdio: 'pipe' });
      const id = randomUUID();
      const session: Session = { proc, buffer: '' };
      proc.stdout.on('data', (d) => (session.buffer += d.toString()));
      proc.stderr.on('data', (d) => (session.buffer += d.toString()));
      sessions.set(id, session);
      await history.add(`start-session ${id}`);
      return JSON.stringify({ sessionId: id });
    },
  });

  server.addTool({
    name: 'send',
    description: 'Send command into the session',
    parameters: z.object({ sessionId: z.string(), command: z.string() }),
    execute: async ({ sessionId, command }) => {
      const s = sessions.get(sessionId);
      if (!s) throw new Error('Session not found');
      s.proc.stdin.write(command + '\n');
      await history.add(`send ${sessionId} ${command}`);
      return 'OK';
    },
  });

  server.addTool({
    name: 'recv',
    description: 'Read output from the session',
    parameters: z.object({ sessionId: z.string(), timeout: z.number().int().optional() }),
    execute: async ({ sessionId, timeout }) => {
      const s = sessions.get(sessionId);
      if (!s) throw new Error('Session not found');
      await new Promise((resolve) => setTimeout(resolve, (timeout ?? 10) * 1000));
      const data = s.buffer;
      s.buffer = '';
      await history.add(`recv ${sessionId}`);
      return data;
    },
  });

  server.addTool({
    name: 'send-recv',
    description: 'Send and receive output in one call',
    parameters: z.object({ sessionId: z.string(), command: z.string(), timeout: z.number().int().optional() }),
    execute: async ({ sessionId, command, timeout }) => {
      const s = sessions.get(sessionId);
      if (!s) throw new Error('Session not found');
      s.proc.stdin.write(command + '\n');
      await new Promise((resolve) => setTimeout(resolve, (timeout ?? 10) * 1000));
      const data = s.buffer;
      s.buffer = '';
      await history.add(`send-recv ${sessionId} ${command}`);
      return data;
    },
  });

  server.addTool({
    name: 'close-session',
    description: 'Stop the REPL session',
    parameters: z.object({ sessionId: z.string() }),
    execute: async ({ sessionId }) => {
      const s = sessions.get(sessionId);
      if (!s) throw new Error('Session not found');
      s.proc.kill();
      sessions.delete(sessionId);
      await history.add(`close-session ${sessionId}`);
      return 'closed';
    },
  });
}

export function parseArgString(input?: string) {
  if (!input) return undefined;
  const defs: Record<string, ArgDef> = {};
  const items = input.split(',');
  for (const item of items) {
    const m = item.match(/(\w+):(\w+):'?([^']*)'?$/);
    if (m) {
      const [, name, type, desc] = m;
      defs[name] = { type, description: desc.replace(/^"|"$/g, '') };
    }
  }
  return defs;
}

async function main() {
  await history.load();
  const argv = await yargs(hideBin(process.argv))
    .option('cmd', { type: 'string', describe: 'Command to wrap' })
    .option('config', { type: 'string', describe: 'Config file' })
    .option('name', { type: 'string', describe: 'Tool name' })
    .option('description', { type: 'string', describe: 'Tool description' })
    .option('args', { type: 'string', describe: 'Arguments definition' })
    
    .help()
    .parse();
  if (!argv.cmd && !argv.config) {
    console.error("Specify --cmd or --config");
    process.exit(1);
  }

  const server = new FastMCP({ name: 'shell-mcp', version: '1.0.0' });
  addHistoryTool(server);
  addSessionTools(server);

  if (argv.config) {
    const raw = JSON.parse(await fs.readFile(argv.config, 'utf-8')) as Record<string, ToolDef>;
    for (const [name, def] of Object.entries(raw)) {
      addShellTool(server, name, def);
    }
  } else if (argv.cmd) {
    const name = argv.name || 'command';
    const def: ToolDef = {
      cmd: argv.cmd,
      description: argv.description,
      args: parseArgString(argv.args),
    };
    addShellTool(server, name, def);
  }

  await server.start({ transportType: 'stdio' });
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

