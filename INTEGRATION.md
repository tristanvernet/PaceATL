# PaceATL: two new feature modules only

This bundle contains **only new files** for Daily Fitness Challenge and Hotspot Map. It does not include or replace the original project. Copy the `backend/`, `frontend/`, and `database/` directories into the corresponding paths in the existing PaceATL project, retaining their directory structure.

## Required small edits to existing files (not included)

1. In `backend/src/app.js`, add:
   ```js
   import { challengesRouter } from "./features/challenges/router.js";
   import { hotspotsRouter } from "./features/hotspots/router.js";
   ```
   Before the `/api` 404 handler, add:
   ```js
   app.use("/api/challenges", challengesRouter);
   app.use("/api/hotspots", hotspotsRouter);
   ```
2. Run the project's existing database setup (`npm run db:setup` from `backend/`), which automatically picks up `database/migrations/008-daily-challenges.sql`. Back up production data first.
3. Add a challenge for the desired date using a database administrator connection (no auto-generated challenge is assumed):
   ```sql
   INSERT INTO daily_challenges (challenge_date, title, activity_type, metric, target)
   VALUES ('2026-11-10', 'Run three miles', 'run', 'miles', 3);
   ```
   Allowed activity types: `run`, `walk`, `cycle`, `any`. Allowed metrics: `miles`, `minutes`, `workouts`. Daily challenge completion is evaluated from **saved workouts**, not the separate reward sample-activity events. The date is UTC.
4. Provide an actual popularity dataset by setting `HOTSPOT_DATA_PATH` in `backend/.env` to the **absolute path** of a JSON file maintained by your team or an authorized data provider. Format:
   ```json
   [
     {"id":"provider-123","name":"Verified area name","latitude":33.75,"longitude":-84.39,"activities":["run","walk"],"description":"Description from the verified source"}
   ]
   ```
   **The example above is schema illustration, not verified popularity evidence.** Do not label a location as popular without data supporting that claim. With no source configured, the map still loads but displays a clear missing-data message. With an empty filtered dataset, it displays a no-results message. If the source cannot be read, the API returns an error.
5. The Expo Router files `frontend/src/app/daily-challenge.tsx` and `frontend/src/app/hotspots.tsx` register the screens. Add links/buttons in an existing navigation screen, for example:
   ```tsx
   <Button title="Daily Challenge" onPress={() => router.push("/daily-challenge")}/>
   <Button title="Hotspot Map" onPress={() => router.push("/hotspots")}/>
   ```
   The screen modules are reachable by URL/deep link even before you add the navigation buttons.

## Functionality and limitations

- Daily challenge: authenticated users; reads one configured challenge for the current UTC date; counts only that user's workouts for that date and permitted activity; compares miles, minutes, or workout count; stores completion once with a unique constraint; does not claim completion when saving fails.
- Hotspot map: guest-accessible; filters `all`, `run`, `walk`, `cycle`; interactive Leaflet/OpenStreetMap map on web and native; map markers can be selected; source-unavailable and no-match messages; user-supplied dataset required for popularity claims.
- The native and web maps require network access to Leaflet CDN and OpenStreetMap tiles. Offline maps are not part of these two features.
- Existing `app.js` central error handler handles database and API errors. The new routers pass failures to that handler.
- These additions do not automatically create daily challenges or derive popularity from live GPS traces. Both require curated source data.

## Checks

From `backend/`: `npm test` (includes `new-features.test.js`). From `frontend/`: `npm run typecheck`. For full integration, run the backend and frontend, sign in, create a dated workout, refresh Daily Challenge, and load Hotspot Map with a verified source file.
