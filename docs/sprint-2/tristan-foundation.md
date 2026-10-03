# Tristan: mobile foundation status

## Completed independently of Jacob

- Replaced the React/Vite browser frontend with React Native + Expo SDK 54 and Expo Router.
- Home, Routes, Learn, Profile tabs; account and feature detail routes; back/unknown-screen handling.
- Shared Screen, Heading, Card, Label, Button, Field, Notice, BackButton and Placeholder components; light/dark theme, safe areas and scrollable layouts.
- Signup/login UI previews, input validation and password visibility. They never transmit account information or pretend to sign in.
- Map placeholders for Explore, Hotspots, Build and Saved. No mapping provider or location permission has been added.
- Iyana's tutorial list/detail starting screens and backend router; shared components and a documented pattern for T's chosen feature.
- Shared typed API request helper, timeouts and error handling; real backend health check from Profile.
- Configurable backend LAN address and restricted browser preview origins, setup instructions and native build profiles.

## Still required after schema agreement

Jacob: implement SQL and agree users/feature schemas and relationships. Provide connection details privately. Existing proposed users fields remain provisional; agree fitness experience level and roles before implementation.

Tristan: database-backed signup/login/logout, hashing, server validation, session storage and protected access; final integration, device testing and Section 7 evidence. Current account/navigation screens are deliberately unprotected previews.

T/Iyana: the shared components and feature structure are available to build on. The handoff guide offers starting points for screens and later data integration. Iyana has selected tutorials; T's feature choice is open. Placeholders are not completed use cases.

## Sprint scope

User management plus two major feature implementations, tables supporting four major use cases, end-to-end database verification, run/install instructions and screenshots are still needed for Section 7. JavaScript exports are not standalone app binaries. Maps and future features do not need implementing as part of this foundation task.

No GitHub push, standalone signed build, deployment or database setup is included in this change.

## Dependency follow-up

The SDK 54 dependency audit currently reports 34 findings (23 high, 11 moderate), primarily in Expo/Metro/native tooling and transitive libraries. Compatible `npm audit fix` was attempted; the remaining reported fixes involve incompatible major upgrades or unresolved upstream ranges. Do not apply `--force` blindly. Review and resolve the dependency baseline before deployment/distribution; SDK 54 was chosen for the physical-iPhone Expo Go preview path. These findings are separate from database/authentication work.

## Verification — October 3, 2026

TypeScript check passed; all seven backend/validation tests passed; Expo exported iOS, Android and web bundles successfully. Verified in the actual web preview: Home-to-Routes navigation, Hotspots selection, Learn-to-tutorial detail and back, Profile health check against Express, and invalid/valid signup preview validation. One React runtime is pinned across the workspace to avoid duplicate-hook failures. Screenshot: `screenshots/mobile-foundation-routes.jpg` (web preview evidence only, not a completed map feature).

Native device/emulator execution, signed app installation and account/database integration have not been verified. The build profiles and setup guide make those next steps explicit.
