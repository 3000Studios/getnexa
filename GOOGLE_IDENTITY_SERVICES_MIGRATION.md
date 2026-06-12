# Google Identity Services Migration

This project was scanned and prepared by the one-done migration script.

Deprecated Google Sign-In items to remove:
- https://apis.google.com/js/platform.js
- https://apis.google.com/js/api.js
- https://apis.google.com/js/api:client.js
- gapi.auth2
- gapi.signin2
- g-signin2
- google-signin-client_id
- getBasicProfile()
- getAuthResponse()
- auth2.signIn()
- auth2.signOut()
- auth2.disconnect()
- auth2.currentUser
- auth2.isSignedIn
- GoogleUser
- GoogleAuth

New Google Identity Services items:
- https://accounts.google.com/gsi/client
- g_id_onload
- g_id_signin
- google.accounts.id.initialize()
- google.accounts.id.renderButton()
- google.accounts.id.prompt()
- google.accounts.id.revoke()
- CredentialResponse.credential JWT

Generated helper files when applicable:
- src/lib/googleIdentity.ts
- public/js/google-identity-helper.js

Production requirement:
Verify the Google ID token on the backend before creating an authenticated application session.

Do not expose secrets.
Do not store OAuth client secrets in frontend code.
Use a Web Application OAuth Client ID for browser sign-in.
Use HTTPS origins and correct redirect URIs in Google Cloud Console.
