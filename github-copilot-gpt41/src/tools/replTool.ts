// src/tools/replTool.ts
// Tool wrapper for REPL/console session tools
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";

interface Session {
  proc: ChildProcessWithoutNullStreams;
  buffer: string;
  closed: boolean;
}
const sessions: Record<string, Session> = {};

export function registerReplTools(server: McpServer, replCmd: string, name = "repl") {
  // start-session
  server.tool(
    `${name}-start-session`,
    `Start a ${replCmd} REPL session`,
    { args: z.array(z.string()).optional() },
    async ({ args }) => {
      const id = Math.random().toString(36).slice(2);
      const proc = spawn(replCmd, args || [], { stdio: "pipe", shell: true });
      sessions[id] = { proc, buffer: "", closed: false };
      proc.stdout.on("data", (d) => (sessions[id].buffer += d.toString()));
      proc.stderr.on("data", (d) => (sessions[id].buffer += d.toString()));
      proc.on("close", () => (sessions[id].closed = true));
      return { content: [{ type: "text", text: id }] };
    }
  );
  // send
  server.tool(
    `${name}-send`,
    `Send command to ${replCmd} session`,
    { session: z.string(), command: z.string() },
    async ({ session, command }) => {
      const s = sessions[session];
      if (!s || s.closed) throw new Error("Session not found or closed");
      s.proc.stdin.write(command + "\n");
      return { content: [{ type: "text", text: "sent" }] };
    }
  );
  // recv
  server.tool(
    `${name}-recv`,
    `Read output from ${replCmd} session`,
    { session: z.string(), timeout: z.number().default(10), end: z.string().optional() },
    async ({ session, timeout, end }) => {
      const s = sessions[session];
      if (!s || s.closed) throw new Error("Session not found or closed");
      let waited = 0;
      while (waited < timeout * 1000) {
        if (end && s.buffer.includes(end)) break;
        await new Promise((r) => setTimeout(r, 100));
        waited += 100;
      }
      const out = s.buffer;
      s.buffer = "";
      return { content: [{ type: "text", text: out }] };
    }
  );
  // send-recv
  server.tool(
    `${name}-send-recv`,
    `Send and receive output in one call for ${replCmd}`,
    { session: z.string(), command: z.string(), timeout: z.number().default(10), end: z.string().optional() },
    async ({ session, command, timeout, end }) => {
      const s = sessions[session];
      if (!s || s.closed) throw new Error("Session not found or closed");
      s.proc.stdin.write(command + "\n");
      let waited = 0;
      while (waited < timeout * 1000) {
        if (end && s.buffer.includes(end)) break;
        await new Promise((r) => setTimeout(r, 100));
        waited += 100;
      }
      const out = s.buffer;
      s.buffer = "";
      return { content: [{ type: "text", text: out }] };
    }
  );
  // close-session
  server.tool(
    `${name}-close-session`,
    `Close ${replCmd} REPL session`,
    { session: z.string() },
    async ({ session }) => {
      const s = sessions[session];
      if (!s || s.closed) throw new Error("Session not found or closed");
      s.proc.kill("SIGKILL");
      s.closed = true;
      return { content: [{ type: "text", text: "closed" }] };
    }
  );
}
