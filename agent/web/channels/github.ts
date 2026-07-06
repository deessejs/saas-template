import { defaultGitHubAuth, githubChannel } from "eve/channels/github";

// botName: le @mention qui déclenche l'agent
// Auth: la GitHub App qui poste la réponse
export default githubChannel({
  botName: "martyy-code",
  onComment: (ctx, _comment) => ({ auth: defaultGitHubAuth(ctx) }),
  onIssue: (ctx, issue) =>
    issue.action === "opened" ? { auth: defaultGitHubAuth(ctx) } : null,
  onPullRequest: (ctx, pr) =>
    pr.action === "opened" ? { auth: defaultGitHubAuth(ctx) } : null,
});
