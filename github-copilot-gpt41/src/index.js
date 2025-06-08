"use strict";
// Main entry for shell-mcp MCP Server
// Implements both single-command and REPL tool wrapping
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const singleCommandTool_1 = require("./tools/singleCommandTool");
const replTool_1 = require("./tools/replTool");
const config_1 = require("./config");
const logger_1 = require("./logger");
const security_1 = require("./security");
const zod_1 = require("zod");
// TODO: Import and register shell command tool and REPL tool modules
const server = new mcp_js_1.McpServer({
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
let singleArgs = [];
let replCmd = "";
let replName = "";
for (let i = 0; i < args.length; ++i) {
    if (args[i] === "--config")
        configFile = args[++i];
    if (args[i] === "--cmd")
        singleCmd = args[++i];
    if (args[i] === "--name")
        singleName = args[++i];
    if (args[i] === "--description")
        singleDesc = args[++i];
    if (args[i] === "--args")
        singleArgs.push(args[++i]);
    if (args[i] === "--repl")
        replCmd = args[++i];
    if (args[i] === "--repl-name")
        replName = args[++i];
}
// Register tools from config file
if (configFile) {
    const config = (0, config_1.loadConfig)(configFile);
    for (const [name, tool] of Object.entries(config)) {
        if (!(0, security_1.isSafeShellCommand)(tool.cmd)) {
            logger_1.logger.warn(`Unsafe command in config: ${tool.cmd}`);
            continue;
        }
        (0, singleCommandTool_1.registerSingleCommandTool)(server, {
            name,
            description: tool.description || `Run ${tool.cmd}`,
            command: tool.cmd,
            argsSchema: (0, config_1.toZodSchema)(tool.args),
            timeout: 10000,
        });
    }
}
// Register single command tool from CLI
if (singleCmd) {
    if (!(0, security_1.isSafeShellCommand)(singleCmd)) {
        logger_1.logger.error("Unsafe command");
        process.exit(1);
    }
    // Parse CLI args: "OPND1:int:'desc'"
    const schema = {};
    for (const a of singleArgs) {
        const m = a.match(/^(\w+):(int|string):'([^']*)'$/);
        if (m) {
            schema[m[1]] = m[2] === "int" ? zod_1.z.number().describe(m[3]) : zod_1.z.string().describe(m[3]);
        }
    }
    (0, singleCommandTool_1.registerSingleCommandTool)(server, {
        name: singleName || "shell-cmd",
        description: singleDesc || `Run ${singleCmd}`,
        command: singleCmd,
        argsSchema: schema,
        timeout: 10000,
    });
}
// Register REPL tool from CLI
if (replCmd) {
    (0, replTool_1.registerReplTools)(server, replCmd, replName || replCmd);
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const transport = new stdio_js_1.StdioServerTransport();
        yield server.connect(transport);
        console.error("shell-mcp MCP Server running on stdio");
    });
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
