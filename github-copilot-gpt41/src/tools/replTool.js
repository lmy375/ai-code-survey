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
exports.registerReplTools = registerReplTools;
// src/tools/replTool.ts
// Tool wrapper for REPL/console session tools
const zod_1 = require("zod");
const child_process_1 = require("child_process");
const sessions = {};
function registerReplTools(server, replCmd, name = "repl") {
    // start-session
    server.tool(`${name}-start-session`, `Start a ${replCmd} REPL session`, { args: zod_1.z.array(zod_1.z.string()).optional() }, (_a) => __awaiter(this, [_a], void 0, function* ({ args }) {
        const id = Math.random().toString(36).slice(2);
        const proc = (0, child_process_1.spawn)(replCmd, args || [], { stdio: "pipe", shell: true });
        sessions[id] = { proc, buffer: "", closed: false };
        proc.stdout.on("data", (d) => (sessions[id].buffer += d.toString()));
        proc.stderr.on("data", (d) => (sessions[id].buffer += d.toString()));
        proc.on("close", () => (sessions[id].closed = true));
        return { content: [{ type: "text", text: id }] };
    }));
    // send
    server.tool(`${name}-send`, `Send command to ${replCmd} session`, { session: zod_1.z.string(), command: zod_1.z.string() }, (_a) => __awaiter(this, [_a], void 0, function* ({ session, command }) {
        const s = sessions[session];
        if (!s || s.closed)
            throw new Error("Session not found or closed");
        s.proc.stdin.write(command + "\n");
        return { content: [{ type: "text", text: "sent" }] };
    }));
    // recv
    server.tool(`${name}-recv`, `Read output from ${replCmd} session`, { session: zod_1.z.string(), timeout: zod_1.z.number().default(10), end: zod_1.z.string().optional() }, (_a) => __awaiter(this, [_a], void 0, function* ({ session, timeout, end }) {
        const s = sessions[session];
        if (!s || s.closed)
            throw new Error("Session not found or closed");
        let waited = 0;
        while (waited < timeout * 1000) {
            if (end && s.buffer.includes(end))
                break;
            yield new Promise((r) => setTimeout(r, 100));
            waited += 100;
        }
        const out = s.buffer;
        s.buffer = "";
        return { content: [{ type: "text", text: out }] };
    }));
    // send-recv
    server.tool(`${name}-send-recv`, `Send and receive output in one call for ${replCmd}`, { session: zod_1.z.string(), command: zod_1.z.string(), timeout: zod_1.z.number().default(10), end: zod_1.z.string().optional() }, (_a) => __awaiter(this, [_a], void 0, function* ({ session, command, timeout, end }) {
        const s = sessions[session];
        if (!s || s.closed)
            throw new Error("Session not found or closed");
        s.proc.stdin.write(command + "\n");
        let waited = 0;
        while (waited < timeout * 1000) {
            if (end && s.buffer.includes(end))
                break;
            yield new Promise((r) => setTimeout(r, 100));
            waited += 100;
        }
        const out = s.buffer;
        s.buffer = "";
        return { content: [{ type: "text", text: out }] };
    }));
    // close-session
    server.tool(`${name}-close-session`, `Close ${replCmd} REPL session`, { session: zod_1.z.string() }, (_a) => __awaiter(this, [_a], void 0, function* ({ session }) {
        const s = sessions[session];
        if (!s || s.closed)
            throw new Error("Session not found or closed");
        s.proc.kill("SIGKILL");
        s.closed = true;
        return { content: [{ type: "text", text: "closed" }] };
    }));
}
