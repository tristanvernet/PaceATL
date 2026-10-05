# PaceATL

Installable iPhone/Android app foundation built with React Native, Expo and Expo Router. Express provides the backend; MySQL connection and setup scripts use Jacob's schema. The Expo web preview uses the same screen code for convenient layout review.

## What works now

- Home, Routes, Learn and Profile navigation, plus back navigation to feature detail and account screens.
- Shared colors, spacing, screen layout, buttons, fields, notices and loading states with light/dark appearance.
- Database-backed signup, login, logout and seven-day sessions. Passwords use salted scrypt hashes; session tokens are hashed in MySQL.
- Routes: Explore, Hotspots, Build and Saved views with clearly labeled map placeholders.
- Database-backed tutorial library, instructions, tips and videos using Iyana's content. Signed-in users can save completion and see it again after reopening the app.
- MySQL connection checks and repeatable database setup scripts. See [database setup](database/README.md).
- Shared API client with configurable address, timeout and readable error handling; Profile can check the real backend `/api/health` endpoint.

Maps, location access, workout logging, progress tools and T's selected feature remain unfinished. Browsing tutorials is public; saving completion requires a valid session. Administrator functionality and roles are not implemented because current features use ordinary user accounts only.

## Install and run

Use Node.js 24 LTS and npm. From the repository root:

```sh
npm ci
npm run dev
```

Scan the Expo QR code with a compatible Expo Go app on a phone on the same Wi-Fi. This project uses SDK 54 so an iPhone can use the App Store version of Expo Go. Android may need the SDK 54 build from https://expo.dev/go. Expo Go is the development preview, not a standalone PaceATL installation.

For browser layout review:

```sh
npm run dev:web
```

Open http://localhost:8081. For an installed emulator/simulator use `npm run android` or `npm run ios` while the backend runs in another terminal with `npm run dev:api`. Android needs an Android SDK/emulator; the iOS simulator needs macOS and Xcode. These commands run outside an IDE.

## Connect a phone to the backend

Copy `frontend/.env.example` to `frontend/.env`. Replace its example IP with your development computer's LAN IP. Do not use localhost for a physical phone; Android Emulator normally uses `10.0.2.2`, and the iOS simulator can use localhost.

Copy `backend/.env.example` to `backend/.env`. Its `HOST=0.0.0.0` lets a phone on your local network reach port 3001. Restart Expo after changing frontend environment variables, then use Profile → Check backend connection. Browser preview defaults to localhost:3001 without configuration. Add your browser's exact origin to `CORS_ORIGINS` if opening the web preview from another device.

`EXPO_PUBLIC_*` values are public app configuration. Never put database passwords, private service keys or account secrets there. Database credentials belong only in backend configuration. Local HTTP is for development; a distributed app must use a reachable HTTPS backend.

## Database setup

Put Jacob's connection details in the ignored `backend/.env`, then run from the root:

```sh
npm run db:check
npm run db:setup
npm run db:seed
```

The seed imports Iyana's tutorial content without replacing existing tutorials. See [database instructions](database/README.md). `npm run test:integration` verifies the real database with temporary test accounts and removes only records created by that check.

## Validate and build

```sh
npm run typecheck
npm test
npm run test:integration
npm run build
```

`npm run build` exports iOS/Android JavaScript bundles and a web preview to `frontend/dist`. It verifies bundling; it does **not** produce an APK or signed iPhone app. `npm start` runs the Express backend and, after export, serves the web preview at http://localhost:3001. For that served preview, the default API address works on the same computer; distributed previews must set their backend URL before building.

Standalone builds are configured in `frontend/eas.json`. When ready, from `frontend/` run `npx eas-cli@latest build --platform android --profile preview` for an installable Android APK, or `npx eas-cli@latest build --platform ios --profile simulator` for an iOS simulator build. EAS requires an Expo account; physical-iPhone internal distribution requires Apple signing/provisioning and an Apple Developer membership. Set a reachable `EXPO_PUBLIC_API_URL` for builds that need backend access. Build-service account setup, signing and store distribution have not been performed.

## Teammate handoff

The [feature handoff guide](docs/sprint-2/mobile-feature-handoff.md) describes the available starting points. Iyana's tutorial screens are in `frontend/src/features/tutorials/`. When T chooses her feature, the same shared components and folder structure are available for her to build on.

- `frontend/src/app/`: small navigation files; actual feature screens belong in `src/features/`.
- `frontend/src/components/`: shared interface components and the map placeholder.
- `frontend/src/theme.ts`: shared appearance; coordinate changes with Tristan.
- `frontend/src/api/client.ts`: use `apiRequest` for backend communication.
- `backend/src/features/`: independent Express feature routers.
- `database/migrations/` and `database/seeds/`: Jacob's repeatable SQL and demo data.
- `docs/sprint-2/`: report sections, diagrams, screenshots and handoff notes.

Section owners: Fari 1–2; Iyana 3–4; T 5; Jacob 6; Tristan 7. Distributed feature implementation follows the group's agreed assignments.

Use a branch per task and a pull request. Install dependencies from the root with `npm install <package> --workspace frontend` or `--workspace backend`. Commit the root lockfile; never commit `.env`, `node_modules` or generated native projects. The earlier Vite interface has been replaced by Expo; use the new screen paths.

Official setup references: [Expo Router installation](https://docs.expo.dev/router/installation/), [Expo Go compatibility](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/), [public environment variables](https://docs.expo.dev/guides/environment-variables/).
