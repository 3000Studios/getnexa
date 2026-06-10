# Storage Fallback

Firebase Storage is not initialized on Spark/no-cost.

Do not enable billing automatically.

Use:
1. repo/public for static public assets
2. Firestore for text metadata only
3. no uploads until storage is approved
4. Cloudflare R2 only after separate approval

Do not store large binary payloads in Firestore.
