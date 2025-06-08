# docs/architecture.md

# shell-mcp 架构说明

shell-mcp 是一个基于 fastmcp 的 MCP Server，支持将 shell 命令和 REPL 工具自动包装为 MCP 工具，供大模型调用。

## 主要模块
- **src/index.ts**：主入口，注册和启动 MCP Server
- **src/tools/singleCommandTool.ts**：单次命令包装为 MCP tool
- **src/tools/replTool.ts**：REPL/console 工具包装为 MCP tool
- **src/config.ts**：支持从配置文件加载批量工具
- **src/security.ts**：命令注入、路径穿越等安全防护
- **src/logger.ts**：多级日志

## 运行流程
1. 解析 CLI 或 config.json，注册工具
2. 启动 MCP Server，监听 stdio
3. 工具调用时安全执行命令或 REPL 交互

## 安全设计
- 禁止危险字符和路径
- 超时控制
- 参数校验

## 扩展性
- 支持自定义工具注册
- 支持多种 REPL 工具

详见各模块源码和测试用例。
