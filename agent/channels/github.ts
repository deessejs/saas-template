import { defaultGitHubAuth, githubChannel } from "eve/channels/github";

export default githubChannel({
  botName: "marty-action",
  onComment: (ctx, _comment) => ({ auth: defaultGitHubAuth(ctx) }),
  onIssue: (ctx, issue) =>
    issue.action === "opened" ? { auth: defaultGitHubAuth(ctx) } : null,
  onPullRequest: (ctx, pr) =>
    pr.action === "opened" ? { auth: defaultGitHubAuth(ctx) } : null,
});
