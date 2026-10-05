# Tristan: mobile foundation status

Updated October 5, 2026: database-backed signup/login/logout, sessions and tutorial completion are now implemented. See [current implementation notes](database-auth-implementation.md) for the database changes, test results and report text. The October 3 verification below describes the original foundation.

## Completed independently of Jacob

- Replaced the React/Vite browser frontend with React Native + Expo SDK 54 and Expo Router.
- Home, Routes, Learn, Profile tabs; account and feature detail routes; back/unknown-screen handling.
- Shared Screen, Heading, Card, Label, Button, Field, Notice, BackButton and Placeholder components; light/dark theme, safe areas and scrollable layouts.
- Signup/login forms with frontend/backend validation, password hashing, database storage and persistent sessions. Profile supports logout.
- Map placeholders for Explore, Hotspots, Build and Saved. No mapping provider or location permission has been added.
- Iyana's tutorial list/detail starting screens and backend router; shared components and a documented pattern for T's chosen feature.
- Shared typed API request helper, timeouts and error handling; real backend health check from Profile.
- Configurable backend LAN address and restricted browser preview origins, setup instructions and native build profiles.

## Current integration status

Jacob's schema, dump, diagram and certificate are now in GitHub. Database setup and the tutorial seed were applied to his cloud MySQL database. Tristan's account functionality and Iyana's tutorial database integration work together; tutorial completion belongs to the signed-in user and persists across backend restarts.

Still needed: T's selected feature and its integration, physical-phone verification, final report assembly, updated database diagram, and GitHub task-board evidence. Maps and other future placeholders are not completed use cases. Signed app builds and deployment have not been performed. The database and authentication work uses branch `codex/database-setup`; consult its GitHub pull request for merge status.

## Verification — October 5, 2026

TypeScript, 14 automated backend checks, live MySQL integration checks, and iOS/Android/web exports passed. Browser verification covered login validation, successful login, session restoration after reload, tutorial loading from MySQL, completion restored after reload, and logout. Temporary test account records were removed.

Report screenshots are in `screenshots/database-*.png`. These are web preview screenshots; physical-phone execution still needs checking.

## Dependency follow-up

The SDK 54 dependency audit currently reports 34 findings (23 high, 11 moderate), primarily in Expo/Metro/native tooling and transitive libraries. Compatible `npm audit fix` was attempted; the remaining reported fixes involve incompatible major upgrades or unresolved upstream ranges. Do not apply `--force` blindly. Review and resolve the dependency baseline before deployment/distribution; SDK 54 was chosen for the physical-iPhone Expo Go preview path. These findings are separate from database/authentication work.

## Verification — October 3, 2026

TypeScript check passed; all seven backend/validation tests passed; Expo exported iOS, Android and web bundles successfully. Verified in the actual web preview: Home-to-Routes navigation, Hotspots selection, Learn-to-tutorial detail and back, Profile health check against Express, and invalid/valid signup preview validation. One React runtime is pinned across the workspace to avoid duplicate-hook failures. Screenshot: `screenshots/mobile-foundation-routes.jpg` (web preview evidence only, not a completed map feature).

Native device/emulator execution and signed app installation have not been verified. Account/database integration was verified on October 5 as described above. The build profiles and setup guide make those next steps explicit.
