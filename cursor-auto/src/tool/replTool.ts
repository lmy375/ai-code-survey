import { z } from 'zod';
import { logger } from '../utils/logger';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { historyManager } from '../history/historyManager';

interface Session {
  id: string;
  proc: ReturnType<typeof spawn>;
  buffer: string;
  closed: boolean;
}

const sessions: Record<string, Session> = {};

export function createReplTool(replCmd: string) {
  return {
    name: replCmd + '-repl',
    description: `REPL session for ${replCmd}`,
    parameters: z.object({}),
    tools: {
      'start-session': {
        description: 'Start a REPL session',
        arguments: z.object({ args: z.array(z.string()).optional() }),
        execute: async ({ args }: any) => {
          const id = uuidv4();
          const proc = spawn(replCmd, args || [], { stdio: 'pipe', shell: true });
          sessions[id] = { id, proc, buffer: '', closed: false };
          proc.stdout.on('data', (data) => { sessions[id].buffer += data.toString(); });
          proc.stderr.on('data', (data) => { sessions[id].buffer += data.toString(); });
          proc.on('close', () => { sessions[id].closed = true; });
          logger.info(`REPL session started: ${id}`);
          historyManager.add({
            timestamp: Date.now(),
            type: 'repl',
            tool: replCmd + '-repl',
            input: { action: 'start-session', args },
            output: { sessionId: id },
            sessionId: id,
          });
          return { sessionId: id };
        },
      },
      'send': {
        description: 'Send command into the session',
        arguments: z.object({ sessionId: z.string(), command: z.string() }),
        execute: async ({ sessionId, command }: any) => {
          const s = sessions[sessionId];
          if (!s || s.closed) throw new Error('Session not found or closed');
          s.proc.stdin!.write(command + '\n');
          historyManager.add({
            timestamp: Date.now(),
            type: 'repl',
            tool: replCmd + '-repl',
            input: { action: 'send', sessionId, command },
            output: { ok: true },
            sessionId,
          });
          return { ok: true };
        },
      },
      'recv': {
        description: 'Read output from the session',
        arguments: z.object({ sessionId: z.string(), timeout: z.number().default(10), end: z.string().optional() }),
        execute: async ({ sessionId, timeout, end }: any) => {
          const s = sessions[sessionId];
          if (!s || s.closed) throw new Error('Session not found or closed');
          // 简单实现：等待 buffer 更新或超时
          const start = Date.now();
          let last = s.buffer;
          while (Date.now() - start < (timeout * 1000)) {
            if (end && s.buffer.includes(end)) break;
            if (s.buffer !== last) break;
            await new Promise(r => setTimeout(r, 100));
          }
          const out = s.buffer;
          s.buffer = '';
          historyManager.add({
            timestamp: Date.now(),
            type: 'repl',
            tool: replCmd + '-repl',
            input: { action: 'recv', sessionId, timeout, end },
            output: { output: out },
            sessionId,
          });
          return { output: out };
        },
      },
      'send-recv': {
        description: 'Send and receive output in one call',
        arguments: z.object({ sessionId: z.string(), command: z.string(), timeout: z.number().default(10), end: z.string().optional() }),
        execute: async ({ sessionId, command, timeout, end }: any) => {
          const s = sessions[sessionId];
          if (!s || s.closed) throw new Error('Session not found or closed');
          s.proc.stdin!.write(command + '\n');
          // 复用 recv 逻辑
          const start = Date.now();
          let last = s.buffer;
          while (Date.now() - start < (timeout * 1000)) {
            if (end && s.buffer.includes(end)) break;
            if (s.buffer !== last) break;
            await new Promise(r => setTimeout(r, 100));
          }
          const out = s.buffer;
          s.buffer = '';
          historyManager.add({
            timestamp: Date.now(),
            type: 'repl',
            tool: replCmd + '-repl',
            input: { action: 'send-recv', sessionId, command, timeout, end },
            output: { output: out },
            sessionId,
          });
          return { output: out };
        },
      },
      'close-session': {
        description: 'Stop the REPL session',
        arguments: z.object({ sessionId: z.string() }),
        execute: async ({ sessionId }: any) => {
          const s = sessions[sessionId];
          if (!s || s.closed) throw new Error('Session not found or closed');
          s.proc.kill();
          s.closed = true;
          logger.info(`REPL session closed: ${sessionId}`);
          historyManager.add({
            timestamp: Date.now(),
            type: 'repl',
            tool: replCmd + '-repl',
            input: { action: 'close-session', sessionId },
            output: { ok: true },
            sessionId,
          });
          return { ok: true };
        },
      },
    },
  };
} 