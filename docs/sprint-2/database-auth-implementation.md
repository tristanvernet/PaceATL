# Section 7 contribution: database and user management

## Implementation

The shared Expo/React Native app communicates with the Express backend. The backend connects to Jacob's Aiven MySQL database using a connection pool and his CA certificate with TLS verification enabled. Database credentials are held in the ignored backend environment file and are not included in the mobile app or repository.

Registration validates name, email, password and confirmation on the frontend and backend. Emails are normalized and protected by a unique database index. Passwords are stored as salted scrypt hashes with N=65536, r=8 and p=2, rather than plaintext. Account creation and its initial session run in one database transaction. Login checks the hash and returns a random session token. The database stores only the token's SHA-256 hash and its seven-day expiry. A sign-in request limiter and a limit on concurrent password derivations reduce repeated authentication attempts.

The app restores sessions through `/api/auth/me`. iPhone/Android tokens are held in Expo SecureStore; the web preview uses tab sessionStorage. Logout deletes the active session from MySQL before clearing local storage. Expired or revoked sessions cannot perform protected writes. Ordinary user accounts are supported; admin features and role management are not currently applicable to these implemented features.

Iyana's tutorial interface and content are retained. The library and instructions now come from MySQL tables `tutorials` and `tutorial_steps`. Signed-in completion is saved in `completed_tutorials`. The backend derives the user from the session and ignores any submitted user ID. Completion writes are serialized per user so repeated taps do not create duplicate records. Tutorial details restore saved completion status after reopening the app or restarting the backend.

## Database changes

The setup preserves Jacob's existing rows and original SQL dump. A repeatable schema script creates missing tables; an upgrade helper expands name/email fields, adds video links and completion user references, changes step numbering to be unique per tutorial, and adds `user_sessions`. The seed script imports Iyana's three tutorials without replacing existing tutorials. Repeated identical warmup instructions and conflicting step IDs/numbers are normalized during seeding.

Existing legacy tutorial completions have a nullable user reference because their owner cannot be inferred. New application writes always supply an authenticated user ID. The original schema diagram should be updated for the new fields and session relationship.

## Verification — October 5, 2026

Fourteen automated backend checks passed. Live MySQL checks passed for registration, salted password storage, hashed session tokens, duplicate emails, incorrect credentials, email normalization, authenticated identity, completion ownership, repeated completion, completion persistence across a server restart, logout revocation and session expiry. Test accounts were temporary and their records were removed after verification.

Command-line checks: `npm run typecheck`, `npm test`, `npm run test:integration`, `npm run build`. Database setup: `npm run db:check`, `npm run db:setup`, `npm run db:seed`. The root README describes phone configuration and app startup.

Browser checks passed for login validation, successful login, session restoration after reload, database tutorial loading, saved completion after reload, and logout. Screenshot evidence is in `screenshots/database-account.png`, `database-signup.png`, `database-login-validation.png`, `database-tutorial-library.png`, `database-tutorial-detail.png`, and `database-logged-out.png`. The browser test account was temporary and removed after verification. Include these screenshots in the final group report; physical-phone testing remains outstanding. Exporting native bundles does not produce signed installable app binaries. Future maps, workout logging and T's selected feature are not implemented by this contribution.

References: [Node crypto](https://nodejs.org/api/crypto.html), [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [Expo SecureStore](https://docs.expo.dev/versions/v54.0.0/sdk/securestore/).
