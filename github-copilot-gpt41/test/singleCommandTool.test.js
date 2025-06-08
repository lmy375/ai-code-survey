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
// test/singleCommandTool.test.ts
const singleCommandTool_1 = require("../src/tools/singleCommandTool");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const zod_1 = require("zod");
describe("singleCommandTool", () => {
    it("should register and execute a simple echo command", () => __awaiter(void 0, void 0, void 0, function* () {
        const server = new mcp_js_1.McpServer({ name: "test", version: "1.0.0", capabilities: { tools: {}, resources: {} } });
        // 注册时维护本地工具 map
        const toolMap = {};
        const origTool = server.tool.bind(server);
        server.tool = function (name, desc, schema, handler) {
            toolMap[name] = { execute: handler };
            return origTool(name, desc, schema, handler);
        };
        (0, singleCommandTool_1.registerSingleCommandTool)(server, {
            name: "echo",
            description: "Echo input",
            command: "echo $MSG",
            argsSchema: { MSG: zod_1.z.string() },
            timeout: 2000,
        });
        const tool = toolMap["echo"];
        const result = yield tool.execute({ MSG: "hello" });
        expect(result.content[0].text.trim()).toBe("hello");
    }));
});
