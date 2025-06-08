export interface CommandConfig {
  cmd: string;
  name?: string;
  description?: string;
  args?: Record<string, ArgumentConfig>;
  timeout?: number;
}

export interface ArgumentConfig {
  type: 'string' | 'int' | 'float' | 'boolean' | 'string[]';
  description: string;
  optional?: boolean;
  default?: any;
}

export interface ReplConfig {
  command: string;
  name?: string;
  description?: string;
  args?: string[];
  timeout?: number;
  endMarkers?: string[];
}

export interface ShellMcpConfig {
  commands?: Record<string, CommandConfig>;
  repl?: ReplConfig;
}

export interface CommandLineArgs {
  cmd?: string;
  name?: string;
  description?: string;
  args?: string[];
  config?: string;
  repl?: string;
  timeout?: number;
}

export interface ToolArgument {
  type: string;
  description: string;
  optional?: boolean;
  default?: any;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, ToolArgument>;
    required?: string[];
  };
}

export interface ReplSession {
  id: string;
  process: any;
  isActive: boolean;
  command: string;
  startTime: Date;
}

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode?: number | undefined;
  timeout?: boolean | undefined;
}