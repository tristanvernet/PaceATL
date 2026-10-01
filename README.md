# PaceATL

Shared GitHub repository for the group project. Tristan’s independent foundation includes React/Vite, Express, shared UI components, and signup/login screen previews. Database-dependent account access and the two project features are not implemented yet.

## Folders

- `frontend/` — shared interface and feature screens.
- `backend/` — authentication and feature logic.
- `database/migrations/` — table creation and update SQL scripts.
- `database/seeds/` — demo data SQL scripts.
- `docs/sprint-2/sections/` — each member’s written report sections.
- `docs/sprint-2/diagrams/` — context, activity and use case diagrams.
- `docs/sprint-2/screenshots/` — GitHub board and implementation evidence.
- `docs/sprint-2/final-report/` — assembled submission.

## Section owners

- Fari: Sections 1–2.
- Iyana: Sections 3–4.
- T: Section 5.
- Jacob: Section 6.
- Tristan: Section 7.

Any redistribution of implementation work can be agreed on by the group.

## Run the foundation

Install Node.js 24 and npm, then from the repository root:

```sh
npm ci
npm run dev
```

Open http://localhost:5173. The frontend calls /api/health through Vite’s proxy to the backend on port 3001. No MySQL setup is required. Both ports need to be available.

## Build and run without an IDE

```sh
npm run build
npm start
```

Open http://localhost:3001. Express serves the built frontend and API together, including direct links to /login and /signup. The server listens locally; hosted deployment is a later step.

## Verify

```sh
npm test
npm run build
```

Signup/login forms validate input for the UI preview, but do not save or send account data. Server-side validation, password hashing, authentication, logout and sessions remain for the database integration step. Do not use real passwords in the preview.

## Contribute

Use a branch for each task, then a pull request. Coordinate shared App.jsx, Navigation.jsx and backend/src/app.js changes. Read docs/sprint-2/tristan-foundation.md for implemented work and handoff details.

This is an npm workspace with one root package-lock.json. Install dependencies from the root using `npm install <package> --workspace frontend` or `--workspace backend`. Commit the lockfile; never commit node_modules, database credentials or .env files.
