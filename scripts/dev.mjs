import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const commands = [
  { name: "server", color: "\x1b[34m", args: ["--workspace", "server", "run", "dev"] },
  { name: "client", color: "\x1b[35m", args: ["--workspace", "client", "run", "dev"] },
];

if (process.argv.includes("--help")) {
  console.log("Runs the server and client dev processes in parallel.");
  process.exit(0);
}

const reset = "\x1b[0m";
let shuttingDown = false;
const children = [];

function prefixOutput(label, color, chunk) {
  const lines = chunk.toString().split(/\r?\n/);
  return lines
    .filter(line => line.length > 0)
    .map(line => `${color}[${label}]${reset} ${line}`)
    .join("\n");
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(code);
}

for (const command of commands) {
  const child = spawn(npmCommand, command.args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: process.platform === "win32",
  });

  child.stdout.on("data", chunk => {
    const text = prefixOutput(command.name, command.color, chunk);
    if (text) process.stdout.write(`${text}\n`);
  });

  child.stderr.on("data", chunk => {
    const text = prefixOutput(command.name, command.color, chunk);
    if (text) process.stderr.write(`${text}\n`);
  });

  child.on("exit", code => {
    if (!shuttingDown && code && code !== 0) {
      process.stderr.write(`${command.color}[${command.name}]${reset} exited with code ${code}\n`);
      shutdown(code);
    }
  });

  child.on("error", error => {
    process.stderr.write(`${command.color}[${command.name}]${reset} failed to start: ${error.message}\n`);
    shutdown(1);
  });

  children.push(child);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));