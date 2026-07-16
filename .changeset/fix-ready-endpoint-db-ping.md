---
"@workspace/api": patch
---

fix(api): `/ready` endpoint now pings Postgres before returning 200. The previous handler wrapped `c.json()` in a try/catch, but `c.json()` never throws — it just builds a Response — so the endpoint always returned `{ status: "ready" }`, giving Kubernetes and load balancers a false ready signal when the database was unreachable. Replaced with `await db.execute(sql\`SELECT 1\`)`; connection failures (ECONNREFUSED, ETIMEDOUT, pool exhaustion) now correctly return 503.