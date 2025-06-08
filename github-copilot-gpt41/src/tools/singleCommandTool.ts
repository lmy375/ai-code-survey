// src/tools/singleCommandTool.ts
// Tool wrapper for single shell command execution (stateless)
import { z, ZodTypeAny } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spawn } from "child_process";
import { isSafeShellCommand } from "../security";

export interface SingleCommandToolConfig {
  name: string;
  description: string;
  command: string;
  argsSchema: Record<string, ZodTypeAny>;
  timeout?: number; // ms
}

export function registerSingleCommandTool(server: McpServer, config: SingleCommandToolConfig) {
  server.tool(
    config.name,
    config.description,
    config.argsSchema,
    async (input) => {
      // Security: allow $VAR, but block dangerous metacharacters and subshells
      if (!isSafeShellCommand(config.command)) {
        throw new Error("Potentially unsafe command detected");
      }
      // Build command with arguments
      const cmd = config.command.replace(/\$([A-Z0-9_]+)/g, (_, k) => {
        if (input[k] === undefined) throw new Error(`Missing argument: ${k}`);
        return String(input[k]);
      });
      return new Promise((resolve, reject) => {
        const proc = spawn(cmd, { shell: true });
        let stdout = "";
        let stderr = "";
        let finished = false;
        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            proc.kill("SIGKILL");
            reject(new Error("Command timed out"));
          }
        }, config.timeout || 10000);
        proc.stdout.on("data", (d) => (stdout += d.toString()));
        proc.stderr.on("data", (d) => (stderr += d.toString()));
        proc.on("close", (code) => {
          clearTimeout(timer);
          if (finished) return;
          finished = true;
          if (code === 0) {
            resolve({ content: [{ type: "text", text: stdout.trim() }] });
          } else {
            reject(new Error(stderr || `Command failed with code ${code}`));
          }
        });
      });
    }
  );
}
