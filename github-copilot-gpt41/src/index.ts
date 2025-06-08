// Main entry for shell-mcp MCP Server
// Implements both single-command and REPL tool wrapping

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerSingleCommandTool } from "./tools/singleCommandTool";
import { registerReplTools } from "./tools/replTool";
import { loadConfig, toZodSchema } from "./config";
import { logger } from "./logger";
import { isSafeShellCommand } from "./security";
import fs from "fs";
import path from "path";
import { z } from "zod";

// TODO: Import and register shell command tool and REPL tool modules

const server = new McpServer({
  name: "shell-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// TODO: Register tools dynamically from CLI/config

// CLI/config detection (simple demo, can use yargs/commander for full CLI)
const args = process.argv.slice(2);
let configFile = "";
let singleCmd = "";
let singleName = "";
let singleDesc = "";
let singleArgs: string[] = [];
let replCmd = "";
let replName = "";
for (let i = 0; i < args.length; ++i) {
  if (args[i] === "--config") configFile = args[++i];
  if (args[i] === "--cmd") singleCmd = args[++i];
  if (args[i] === "--name") singleName = args[++i];
  if (args[i] === "--description") singleDesc = args[++i];
  if (args[i] === "--args") singleArgs.push(args[++i]);
  if (args[i] === "--repl") replCmd = args[++i];
  if (args[i] === "--repl-name") replName = args[++i];
}

// Register tools from config file
if (configFile) {
  const config = loadConfig(configFile);
  for (const [name, tool] of Object.entries(config)) {
    if (!isSafeShellCommand(tool.cmd)) {
      logger.warn(`Unsafe command in config: ${tool.cmd}`);
      continue;
    }
    registerSingleCommandTool(server, {
      name,
      description: tool.description || `Run ${tool.cmd}`,
      command: tool.cmd,
      argsSchema: toZodSchema(tool.args),
      timeout: 10000,
    });
  }
}
// Register single command tool from CLI
if (singleCmd) {
  if (!isSafeShellCommand(singleCmd)) {
    logger.error("Unsafe command");
    process.exit(1);
  }
  // Parse CLI args: "OPND1:int:'desc'"
  const schema: Record<string, z.ZodTypeAny> = {};
  for (const a of singleArgs) {
    const m = a.match(/^(\w+):(int|string):'([^']*)'$/);
    if (m) {
      schema[m[1]] = m[2] === "int" ? z.number().describe(m[3]) : z.string().describe(m[3]);
    }
  }
  registerSingleCommandTool(server, {
    name: singleName || "shell-cmd",
    description: singleDesc || `Run ${singleCmd}`,
    command: singleCmd,
    argsSchema: schema,
    timeout: 10000,
  });
}
// Register REPL tool from CLI
if (replCmd) {
  registerReplTools(server, replCmd, replName || replCmd);
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("shell-mcp MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
