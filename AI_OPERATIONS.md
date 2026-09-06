# AI Operations

This is the direct instruction file for ChatGPT/Codex, Gemini, and Grok. Canonical branch: `main`; canonical production repository: this repository.

Before changing code, inspect `AGENTS.md`, `README.md`, Git status/remote, package scripts, and Cloudflare configuration. Preserve unrelated changes. Make the smallest complete change, run relevant format/type/lint/test/production-build checks, then commit and push the validated change to `main`.

Every production-relevant change must deploy only through the configured canonical Cloudflare project with Wrangler. Verify the live canonical domain afterwards on desktop and mobile: routes, images, console/network errors, layout shifts, and horizontal scrolling. Log the commit, deployment, domain, and result. Never use another host, invent deployment success, or expose secrets.

When this repository is cloned within the 3000Studios workspace, the shared runbook is `../AI_WORKSPACE_HUB.md` and the portfolio registry is `../PROJECT_REGISTRY.md`.
