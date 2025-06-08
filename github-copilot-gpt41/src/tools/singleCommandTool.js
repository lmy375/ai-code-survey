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
exports.registerSingleCommandTool = registerSingleCommandTool;
const child_process_1 = require("child_process");
const security_1 = require("../security");
function registerSingleCommandTool(server, config) {
    server.tool(config.name, config.description, config.argsSchema, (input) => __awaiter(this, void 0, void 0, function* () {
        // Security: allow $VAR, but block dangerous metacharacters and subshells
        if (!(0, security_1.isSafeShellCommand)(config.command)) {
            throw new Error("Potentially unsafe command detected");
        }
        // Build command with arguments
        const cmd = config.command.replace(/\$([A-Z0-9_]+)/g, (_, k) => {
            if (input[k] === undefined)
                throw new Error(`Missing argument: ${k}`);
            return String(input[k]);
        });
        return new Promise((resolve, reject) => {
            const proc = (0, child_process_1.spawn)(cmd, { shell: true });
            let stdout = "";
            let stderr = "";
            let finished = false;
            const timer = setTimeout(() => {
                if (!finished) {
                    finished = true;
                    proc.kill("SIGKILL");
                    reject(new Error("Command timed out"));
                }
            }, config.timeout || 10000);
            proc.stdout.on("data", (d) => (stdout += d.toString()));
            proc.stderr.on("data", (d) => (stderr += d.toString()));
            proc.on("close", (code) => {
                clearTimeout(timer);
                if (finished)
                    return;
                finished = true;
                if (code === 0) {
                    resolve({ content: [{ type: "text", text: stdout.trim() }] });
                }
                else {
                    reject(new Error(stderr || `Command failed with code ${code}`));
                }
            });
        });
    }));
}
