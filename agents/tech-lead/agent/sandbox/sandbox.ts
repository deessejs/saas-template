/**
 * Sandbox configuration for the tech-lead agent.
 *
 * Backend: Vercel Sandbox (cloud).
 * On session start, the sandbox clones the saas-template repo into /workspace/repo.
 * The agent then works on its own checkout — it never touches the local filesystem
 * where eve runs.
 *
 * Required env vars (set in Vercel project or .env.local for local dev with
 * `vercel env pull`):
 *   GH_TOKEN        — GitHub fine-grained PAT with repo read access.
 *                     Create at: GitHub Settings → Developer settings → Personal access tokens
 *   REPO_URL       — Full git URL. Defaults to the public GitHub repo.
 *                     Override for forks or private repos.
 *   REPO_BRANCH    — Branch to checkout. Defaults to "main".
 */

import { defineSandbox } from "eve/sandbox";
import { vercel } from "eve/sandbox/vercel";

const REPO_URL =
  process.env.REPO_URL ?? "https://github.com/martyy-code/saas-template.git";
const BRANCH = process.env.REPO_BRANCH ?? "main";

export default defineSandbox({
  backend: vercel({
    // 2 vCPUs for a tech-lead agent doing code analysis
    resources: { vcpus: 2 },
  }),

  // Bump this key whenever you change the bootstrap script.
  // Eve invalidates the sandbox cache and re-runs bootstrap.
  revalidationKey: () => "tech-lead-v1",

  async bootstrap({ use }) {
    const sandbox = await use();

    // Clone the repo
    await sandbox.run({
      command: `git clone --branch ${BRANCH} --single-branch ${REPO_URL} /workspace/repo`,
    });

    // Verify the clone worked
    const check = await sandbox.run({
      command: "ls /workspace/repo/package.json",
    });
    if (check.exitCode !== 0) {
      throw new Error(
        `Bootstrap failed: repo clone did not produce /workspace/repo/package.json.\n${check.stderr}`,
      );
    }

    // Install deps so typecheck/lint work out of the box
    const install = await sandbox.run({
      command: "cd /workspace/repo && pnpm install --frozen-lockfile",
    });
    if (install.exitCode !== 0) {
      // Non-fatal: deps might already be cached or network might be restricted
      console.warn(
        `Bootstrap warning: pnpm install exited ${install.exitCode}\n${install.stderr}`,
      );
    }
  },
});
