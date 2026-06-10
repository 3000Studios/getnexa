# AGENTS.md

Repo: getnexa
Domains: getnexa.space
Firebase apps: getnexa-space
Deployment target: Cloudflare

Rules:
- Do not expose secrets.
- Do not print values from C:\Users\Servi\.config\env\global.env.
- Never commit .env files, API keys, tokens, cookies, private keys, service accounts, or billing data.
- Cloudflare is the public deployment platform.
- Firebase is used for Auth/Firestore only where useful.
- Firebase Storage is unavailable on Spark/no-cost; use static assets or approved Cloudflare fallback.
- Do not deploy without approval.
- Do not change DNS without approval.
- Do not enable billing.
- Do not publish Firebase rules without review.
- Keep code SEO-ready, AdSense-review-ready, mobile-first, and fast.
