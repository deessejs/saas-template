import { defineTool } from "eve/tools";
import { z } from "zod";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export default defineTool({
  description:
    "Run pnpm typecheck across the workspace, or filter by scope.",
  inputSchema: z.object({
    scope: z.string().optional().describe(
      "Package scope to filter. E.g. '@workspace/database', 'web', 'agent'. Omit to run the full workspace typecheck.",
    ),
    cwd: z.string().optional().describe(
      "Working directory. Defaults to the repo root.",
    ),
    maxDuration: z.number().optional().default(120).describe("Max seconds to wait. Default 120."),
  }),
  async execute({ scope, cwd, maxDuration = 120 }) {
    const root = cwd ?? process.cwd();

    let cmd: string;
    if (scope) {
      cmd = `pnpm --filter ${scope} typecheck`;
    } else {
      cmd = `pnpm typecheck`;
    }

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: root,
        timeout: maxDuration * 1000,
        signal: AbortSignal.timeout(maxDuration * 1000),
      });
      return {
        status: "success",
        stdout,
        stderr,
        cmd,
        cwd: root,
      };
    } catch (err: unknown) {
      const error = err as { stdout?: string; stderr?: string; killed?: boolean; code?: number };
      return {
        status: "failed",
        stdout: error.stdout ?? "",
        stderr: error.stderr ?? String(err),
        code: error.code,
        killed: error.killed,
        cmd,
        cwd: root,
      };
    }
  },
});

// No longer needed — process.cwd() is already the repo root
