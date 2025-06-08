# shell-mcp 架构说明

## 目录结构

```
src/
  index.ts                # 入口，命令行参数解析
  mcpServer.ts            # MCP Server 启动与工具注册
  tool/
    singleCommandTool.ts  # 单次命令工具封装
    replTool.ts           # REPL 工具封装
    toolFactory.ts        # 工具工厂，自动注册
  config/
    configLoader.ts       # 配置文件加载（预留）
  security/
    shellSanitizer.ts     # 命令注入/目录穿越防护
  session/
    replSession.ts        # REPL 会话管理（内嵌于 replTool）
  history/
    historyManager.ts     # 历史记录与复用
  utils/
    logger.ts             # 日志工具

test/                     # 单元与集成测试
README.md                 # 用法与进度
prompt.txt                # 需求说明
```

## 核心模块说明

### 1. 单次命令工具（singleCommandTool）
- 支持将任意 shell 命令/脚本包装为 MCP Tool。
- 支持参数定义、描述、超时、安全防护。
- 自动记录历史。

### 2. REPL 工具（replTool）
- 支持 bash/python/node/mysql-cli 等 REPL 工具多轮交互。
- 自动注册 start-session、send、recv、send-recv、close-session 等 MCP Tool。
- 会话上下文隔离，完整捕获 stdout/stderr。
- 自动记录历史。

### 3. 工具工厂（toolFactory）
- 根据命令行参数/config/repl 自动注册工具。
- 自动注册 history-query/history-export 工具。

### 4. 历史管理（historyManager）
- 所有命令/会话操作自动持久化到 .shell-mcp-history.json。
- 支持按 type/tool/sessionId 查询与导出。

### 5. 安全防护（shellSanitizer）
- 拒绝危险字符（&&、||、;、|、>、<、../ 等）。
- 参数安全替换，防止注入与目录穿越。

### 6. 日志（logger）
- info/warn/error 分级，便于调试与追踪。

## 主流程
1. 解析命令行参数，判断 --cmd/--config/--repl。
2. 通过 toolFactory 注册对应工具。
3. 启动 FastMCP Server，自动暴露所有工具。
4. 所有调用自动记录历史。

## 扩展点
- 支持自定义 configLoader、REPL 会话管理、参数类型校验等。
- 可扩展更多安全策略、权限控制、Web UI、命令模板市场等。

## 安全与测试
- 命令执行前严格校验，防止注入与目录穿越。
- 单元测试覆盖命令执行与安全分支。
- 建议生产环境采用 Vitest 进行 ESM/TS 测试。

## 自动化与发布
- 支持 npx/uvx 直接运行。
- 预留 .github/workflows/release.yml 自动发布配置。 