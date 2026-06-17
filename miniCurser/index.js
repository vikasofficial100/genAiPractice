import Groq from "groq-sdk";
import "dotenv/config";
import { exec } from "child_process";
import util from "util";
import os from "os";
import readlineSync from "readline-sync";
import fs from "fs";
import path from "path";

const platform = os.platform();
const execute = util.promisify(exec);

// ---------------- GROQ CLIENT ----------------
const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// ---------------- CONFIG ----------------
const MAX_ITERATIONS = 30;

const ALLOWED_COMMANDS = [
    "cd", "pwd", "ls", "dir",
    "mkdir", "touch", "cat", "echo",
    "cp", "copy", "mv", "move", "ren",
    "find", "grep",
    "node", "npm", "npx",
    "git", "vite", "pnpm", "yarn",
    "where", "which", "type", "tree"
];

// ---------------- COMMAND EXECUTOR ----------------
async function executeCommand({ command }) {

    const commandName = command.trim().split(" ")[0];

    if (!ALLOWED_COMMANDS.includes(commandName)) {
        return `Error: Command "${commandName}" is not allowed`;
    }

    try {
        const { stdout, stderr } = await execute(command);

        if (stderr && stderr.trim()) {
            return `Error: ${stderr}`;
        }

        return `Success:\n${stdout}`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// ---------------- WRITE FILE TOOL (NEW 🔥) ----------------
async function writeFile({ filePath, content }) {
    try {

        const dir = path.dirname(filePath);
        fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(filePath, content, "utf8");

        return `File written: ${filePath}`;

    } catch (err) {
        return `Error writing file: ${err.message}`;
    }
}

// ---------------- TOOLS ----------------
const commandExecuter = {
    type: "function",
    function: {
        name: "executeCommand",
        description: "Executes terminal commands safely",
        parameters: {
            type: "object",
            properties: {
                command: { type: "string" }
            },
            required: ["command"]
        }
    }
};

const writeFileTool = {
    type: "function",
    function: {
        name: "writeFile",
        description: "Writes a file with given content",
        parameters: {
            type: "object",
            properties: {
                filePath: { type: "string" },
                content: { type: "string" }
            },
            required: ["filePath", "content"]
        }
    }
};

// ---------------- SYSTEM PROMPT ----------------
const History = [
    {
        role: "system",
        content: `
You are a frontend AI agent.

Rules:
- Build websites using HTML, CSS and JavaScript.
- These HTML ,CSS and JavaScript file must be inside a folder which me be created everytime you make a website
- Use writeFile tool to create or edit files.
- Use executeCommand only for terminal operations.
- One tool call at a time.
- Never generate node -e code.
- Never use apply_patch.
- Always verify output before continuing.
- Finish only when project is complete.

Allowed commands:
${ALLOWED_COMMANDS.join(", ")}
`
    }
];

// ---------------- GROQ CALL ----------------
async function safeChatCompletion(messages, retries = 5) {

    for (let i = 0; i < retries; i++) {

        try {

            return await client.chat.completions.create({
                model: "openai/gpt-oss-120b",
                messages,
                tools: [commandExecuter, writeFileTool],
                tool_choice: "auto"
            });

        } catch (err) {

            const status = err.status || err.code;

            if (status === 429 || status === 503) {
                console.log("⚠️ Rate limit, retrying...");
                await new Promise(r => setTimeout(r, 2000 * (i + 1)));
            } else {
                throw err;
            }
        }
    }

    throw new Error("Failed after retries");
}

// ---------------- AGENT LOOP ----------------
async function buildWebsite() {

    let iterations = 0;

    while (iterations < MAX_ITERATIONS) {

        iterations++;

        const response = await safeChatCompletion(History);

        const message = response.choices[0].message;

        // ---------------- TOOL CALLS ----------------
        if (message.tool_calls?.length) {

            History.push(message);

            for (const toolCall of message.tool_calls) {

                const name = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments || "{}");

                let result;

                switch (name) {

                    case "executeCommand":
                        result = await executeCommand(args);
                        break;

                    case "writeFile":
                        result = await writeFile(args);
                        break;

                    default:
                        result = `Unknown tool: ${name}`;
                }

                console.log("\n🔧 TOOL:", name);
                console.log("ARGS:", args);
                console.log("RESULT:", result);

                History.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: result
                });
            }

            continue;
        }

        // ---------------- FINAL ----------------
        console.log("\n🤖 AI RESPONSE:\n", message.content);

        History.push({
            role: "assistant",
            content: message.content
        });

        return;
    }
}

// ---------------- CLI ----------------
async function startCLI() {

    console.log("\n🚀 Groq Website Builder Agent Started");
    console.log(`Platform: ${platform}`);

    while (true) {

        const q = readlineSync.question("ask me anything : ");

        if (q === "exit") break;

        History.push({
            role: "user",
            content: q
        });

        try {
            await buildWebsite();
        } catch (err) {
            console.log("ERROR:", err.message);
        }
    }
}

startCLI();