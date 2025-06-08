// src/config.ts
// Config loader for shell-mcp
import fs from "fs";
import path from "path";
import { z } from "zod";

export interface ToolConfig {
  cmd: string;
  args?: Record<string, { type: string; description?: string }>;
  description?: string;
}

export function loadConfig(configPath: string): Record<string, ToolConfig> {
  const abs = path.resolve(configPath);
  const raw = fs.readFileSync(abs, "utf-8");
  return JSON.parse(raw);
}

export function toZodSchema(args?: Record<string, { type: string; description?: string }>) {
  if (!args) return {};
  const map: Record<string, z.ZodTypeAny> = {};
  for (const [k, v] of Object.entries(args)) {
    let t: z.ZodTypeAny = z.any();
    if (v.type === "int" || v.type === "number") t = z.number();
    else if (v.type === "string") t = z.string();
    if (v.description) t = t.describe(v.description);
    map[k] = t;
  }
  return map;
}
