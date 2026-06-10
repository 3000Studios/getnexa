# AGENTS.md — 3000Studios Project Rules

- Start by reading package.json, framework config, Firebase config, Cloudflare config, and env examples.
- Default deployment target is Cloudflare Pages unless repo says otherwise.
- Use Cloudflare Workers or Pages Functions for lightweight APIs.
- Use Firebase Auth, Firestore, Storage, Functions, and App Check where useful.
- Check C:\Users\Servi\.config\env\global.env for required variable names only.
- Never print, expose, commit, or invent secrets.
- Do not rename env variables unless every reference is updated and documented.
- Every site must be AdSense-review-ready when applicable.
- Maintain robots.txt, sitemap.xml, ads.txt, _headers, and _redirects where applicable.
- Run lint, typecheck, build, tests, gitleaks, trivy, and semgrep when available.
- Fix real spelling issues. Whitelist valid technical/project/domain words in cspell.json.
- Keep UI mobile-first, accessible, fast, high-contrast, and production-ready.
- Final report must include files changed, commands run, issues fixed, and manual blockers.
