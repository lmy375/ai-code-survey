// test/singleCommandTool.test.ts
import { registerSingleCommandTool } from "../src/tools/singleCommandTool";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

describe("singleCommandTool", () => {
  it("should register and execute a simple echo command", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0", capabilities: { tools: {}, resources: {} } });
    // 注册时维护本地工具 map
    const toolMap: Record<string, any> = {};
    const origTool = server.tool.bind(server);
    (server as any).tool = function(name: string, desc: any, schema: any, handler: any) {
      toolMap[name] = { execute: handler };
      return origTool(name, desc, schema, handler);
    };
    registerSingleCommandTool(server, {
      name: "echo",
      description: "Echo input",
      command: "echo $MSG",
      argsSchema: { MSG: z.string() },
      timeout: 2000,
    });
    const tool = toolMap["echo"];
    const result = await tool.execute({ MSG: "hello" });
    expect(result.content[0].text.trim()).toBe("hello");
  });
});
