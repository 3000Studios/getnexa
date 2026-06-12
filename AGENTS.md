# AGENTS.md

## Project
- App ID: getnexa-space
- Domain: getnexa.space
- Public deployment: Cloudflare Pages/Workers only unless separately approved.
- Firebase role: Auth and Firestore backend support.
- Storage: Firebase Storage disabled on Spark/no-cost.

## Rules
- Never expose secrets.
- Never commit .env files.
- Never hard-code Firebase config.
- Never enable billing.
- Never deploy production without explicit approval.
- Never publish Firebase rules without explicit approval.
- Never change DNS without explicit approval.
- Never cache admin/auth/API/payment/private routes.
- Public marketing/blog/gallery/pricing pages must be crawlable and indexable.
- Admin/dashboard/auth/API/private routes must be noindex and no-store.
