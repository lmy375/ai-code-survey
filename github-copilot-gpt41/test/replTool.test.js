"use strict";
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
// test/replTool.test.ts
const replTool_1 = require("../src/tools/replTool");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
describe("replTool", () => {
    it("should start, send, recv, and close a bash session", () => __awaiter(void 0, void 0, void 0, function* () {
        const server = new mcp_js_1.McpServer({ name: "test", version: "1.0.0", capabilities: { tools: {}, resources: {} } });
        // 注册时维护本地工具 map
        const toolMap = {};
        const origTool = server.tool.bind(server);
        server.tool = function (name, desc, schema, handler) {
            toolMap[name] = { execute: handler };
            return origTool(name, desc, schema, handler);
        };
        (0, replTool_1.registerReplTools)(server, "bash", "bash");
        // Start session
        const start = yield toolMap["bash-start-session"].execute({});
        const sessionId = start.content[0].text.trim();
        // Send command
        yield toolMap["bash-send"].execute({ session: sessionId, command: "echo 42" });
        // Recv output
        const recv = yield toolMap["bash-recv"].execute({ session: sessionId, timeout: 2 });
        expect(recv.content[0].text).toContain("42");
        // Close session
        yield toolMap["bash-close-session"].execute({ session: sessionId });
    }));
});
