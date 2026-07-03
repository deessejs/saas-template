/**
 * Sandbox configuration for the tech-lead agent.
 *
 * Backend: Vercel Sandbox (cloud).
 *
 * Strategy: use `onSession()` instead of `bootstrap()` because prewarm (during
 * `eve build`) runs in a restricted network context where `git clone` fails.
 * `onSession()` runs at runtime when the sandbox has full network access.
 *
 * Required env vars:
 *   GH_TOKEN     — GitHub PAT with repo:read (for private repos).
 *                  For public repos, omit or set to empty.
 *   REPO_URL     — Full git URL. Defaults to the public GitHub repo.
 *   REPO_BRANCH  — Branch to checkout. Defaults to "main".
 *
 * Note: the sandbox caches /workspace across reconnects via `sandbox.id`.
 * Cloning only happens on the first session or after a sandbox TTL expiry.
 */

import { defineSandbox } from "eve/sandbox";
import { vercel } from "eve/sandbox/vercel";

const REPO_URL =
  process.env.REPO_URL ?? "https://github.com/deessejs/saas-template.git";
const BRANCH = process.env.REPO_BRANCH ?? "main";
const GH_TOKEN = process.env.GH_TOKEN;

export default defineSandbox({
  backend: vercel({
    // 2 vCPUs for a tech-lead agent doing code analysis
    resources: { vcpus: 2 },
  }),

  async onSession({ use }) {
    // Ensure the sandbox has network access for git operations
    const sandbox = await use({ networkPolicy: "allow-all" });

    // Check if repo is already cloned (sandbox.id persists across reconnects)
    const check = await sandbox.run({ command: "ls /workspace/repo/.git 2>/dev/null && echo CLONED || echo NOT_CLONED" });
    const alreadyCloned = check.stdout.trim() === "CLONED";

    if (!alreadyCloned) {
      // Clone the repo
      const cloneArgs = [`git clone --branch ${BRANCH} --single-branch`];
      if (GH_TOKEN) {
        // Use authenticated clone to avoid GitHub rate limiting
        cloneArgs.push(`https://x-access-token:${GH_TOKEN}@github.com/deessejs/saas-template.git`);
      } else {
        cloneArgs.push(REPO_URL);
      }
      cloneArgs.push("/workspace/repo");

      const clone = await sandbox.run({ command: cloneArgs.join(" ") });
      if (clone.exitCode !== 0) {
        throw new Error(`Failed to clone repo:\n${clone.stderr}`);
      }
    }
  },
});
