"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.toZodSchema = toZodSchema;
// src/config.ts
// Config loader for shell-mcp
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
function loadConfig(configPath) {
    const abs = path_1.default.resolve(configPath);
    const raw = fs_1.default.readFileSync(abs, "utf-8");
    return JSON.parse(raw);
}
function toZodSchema(args) {
    if (!args)
        return {};
    const map = {};
    for (const [k, v] of Object.entries(args)) {
        let t = zod_1.z.any();
        if (v.type === "int" || v.type === "number")
            t = zod_1.z.number();
        else if (v.type === "string")
            t = zod_1.z.string();
        if (v.description)
            t = t.describe(v.description);
        map[k] = t;
    }
    return map;
}
