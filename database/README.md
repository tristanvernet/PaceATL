# MySQL setup

Jacob supplied the Aiven cloud database schema, SQL dump and CA certificate. The certificate is public trust material, not a password. Database credentials stay in the ignored `backend/.env` file, never in frontend configuration.

## Connect

1. Copy `backend/.env.example` to `backend/.env` if that file does not already exist.
2. Replace the three `PASTE_JACOBS_*` placeholders with the port, username and password Jacob provided. Keep the password inside quotes. Get the separate connection fields from him rather than pasting a whole connection URL.
3. From the repository root, run:

```sh
npm ci
npm run db:check
```

The check reads table names and verifies connectivity. It does not read account records or print passwords. TLS certificate verification stays enabled for the cloud database. If the host, database name or certificate differ from Jacob's current connection details, update the local settings accordingly.

## Set up the tables

```sh
npm run db:setup
npm run db:check
```

`db:setup` creates missing tables using `migrations/001-schema.sql`, then checks the existing schema and applies the following compatible changes:

- Expand names to 100 characters and emails to 254 to match the signup form.
- Add `tutorials.video_url` for Iyana's video links.
- Add a user reference to tutorial completions and automatically generated completion IDs.
- Replace global step-number uniqueness with uniqueness within each tutorial, so multiple tutorials can have a step 1.
- Create `user_sessions` for the upcoming authentication implementation. Only token hashes belong in this table.

Existing rows are preserved. If old completion records exist, their new user reference remains NULL because their owner cannot be inferred. Jacob should associate them with the correct user if that history is needed. Fresh completion tables require a user ID. No tutorial content is seeded and no sample users are created by setup.

Load Iyana's tutorials with `npm run db:seed`. This inserts missing tutorials and their steps, leaves existing tutorials unchanged, and corrects repeated step IDs/numbers and identical instructions in the source seed. Content still needs the group's final review.

The setup is repeatable. MySQL schema changes are not transactional: if a later statement fails, earlier changes remain. Resolve the reported issue and rerun. Run setup from one computer at a time. It is a command you run deliberately, not something the backend executes on startup.

Jacob's `dump-defaultdb-202610042256.sql` is preserved as the original export. **Do not run it against the shared cloud database:** it contains `DROP TABLE` statements and server-level GTID settings. Use the setup command above instead. The schema diagram represents the original export; update it for the additional columns and sessions table in the final report.

## Application integration

Backend features can import `getDatabase` from `backend/src/database.js` and use `database.execute(sql, parameters)` for parameterized queries. Connections are pooled. Call `closeDatabase` on server shutdown once a feature starts using the pool. The frontend talks to Express through `apiRequest`; it never connects directly to MySQL.

Signup/login/logout and session handlers now use MySQL. Tutorial list/detail handlers query `tutorials` and `tutorial_steps`; completion is saved in `completed_tutorials` using the authenticated user, never a user ID supplied by the frontend. The app restores completion from the database. Passwords use salted scrypt hashes, and session token hashes expire after seven days. On phones, tokens are stored with Expo SecureStore; the web preview uses sessionStorage, which survives reloads within a tab. No password is saved on the device.

`npm run test:integration` exercises live signup, duplicate email rejection, login, completion ownership/persistence, session restoration, expiry and logout. Its disposable test accounts and completions are removed afterward.

Driver reference: [MySQL2 documentation](https://sidorares.github.io/node-mysql2/docs).
