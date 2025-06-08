// test/replTool.test.ts
import { registerReplTools } from "../src/tools/replTool";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

describe("replTool", () => {
  it("should start, send, recv, and close a bash session", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0", capabilities: { tools: {}, resources: {} } });
    // 注册时维护本地工具 map
    const toolMap: Record<string, any> = {};
    const origTool = server.tool.bind(server);
    (server as any).tool = function(name: string, desc: any, schema: any, handler: any) {
      toolMap[name] = { execute: handler };
      return origTool(name, desc, schema, handler);
    };
    registerReplTools(server, "bash", "bash");
    // Start session
    const start = await toolMap["bash-start-session"].execute({});
    const sessionId = start.content[0].text.trim();
    // Send command
    await toolMap["bash-send"].execute({ session: sessionId, command: "echo 42" });
    // Recv output
    const recv = await toolMap["bash-recv"].execute({ session: sessionId, timeout: 2 });
    expect(recv.content[0].text).toContain("42");
    // Close session
    await toolMap["bash-close-session"].execute({ session: sessionId });
  });
});
