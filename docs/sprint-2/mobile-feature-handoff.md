# Building on the PaceATL foundation

I put together the shared layout and navigation so we have a starting point for our features. This guide shows what's available and where things fit. The feature screens are starting layouts, and we can adjust them together as the requirements become clearer.

## What's available to everyone

The frontend uses React Native and TypeScript (`.tsx` screens). Home, Routes, Learn and Profile are already linked, and detail screens can open with a back button.

- `frontend/src/features/`: a place for each feature's screens and related code.
- `frontend/src/app/`: navigation files that connect those screens to the app.
- `frontend/src/components/ui.tsx`: shared screen layout, headings, cards, buttons, fields and notices.
- `frontend/src/theme.ts`: the shared colors and spacing.
- `frontend/src/api/client.ts`: a helper for connecting screens to the backend later.

The shared components can save some setup time: Screen handles scrolling and safe areas; Button supports loading/disabled states; Field supports labels and validation messages; Notice displays status or errors. If a shared component or navigation link needs changing, we can coordinate that so our changes fit together.

Account access is still a preview while the database is being prepared. Authentication and permissions will be connected in the backend as part of that work.

## Iyana — Workout Tips and Tutorials

These starting files are already linked to the Learn tab:

- `frontend/src/features/tutorials/TutorialsScreen.tsx`: the tutorial library screen.
- `frontend/src/features/tutorials/TutorialDetailScreen.tsx`: the screen for an individual tutorial.
- `frontend/src/app/(tabs)/learn.tsx`: connects the library to navigation.
- `frontend/src/app/tutorials/[id].tsx`: connects tutorial detail screens; `useLocalSearchParams` provides the selected `id`.
- `backend/src/features/tutorials/router.js`: a starting place for tutorial requests, already connected at `/api/tutorials`.

You can work on the layout before the database is ready using labeled sample records in your feature folder. Keeping those separate from the API code makes it easier to replace them with real records later. A small preview label helps everyone tell sample content apart from connected data.

For the data connection, one possible starting point is:

- GET `/api/tutorials`: a list with `id`, `title`, `activityType` and `summary`.
- GET `/api/tutorials/:id`: one tutorial, including its instructions and optional media URL.

Those endpoints aren't implemented yet; the field names and formats are suggestions we can work out with Jacob based on your feature design. Inside the existing backend router, the paths would be `/` and `/:id`, since `/api/tutorials` is already attached.

When the connection is ready, loading messages and a retry option can help users understand what's happening. For Sprint 2, screenshots of browsing a tutorial and opening its instructions would be useful evidence alongside the database integration.

## T — when you choose your feature

The foundation is available for whichever feature you choose. Here's one way to add it:

1. Give it a folder under `frontend/src/features/<feature-name>/` for its screens and related code.
2. Add a navigation file in `frontend/src/app/` that points to the main screen. The tutorial files show an example of this pattern.
3. Build the screen with the shared components, adapting them to what your feature needs.
4. We can add an entry point from Home or another suitable tab together.
5. When you're ready for backend work, a router under `backend/src/features/<feature-name>/router.js` can hold its requests. We can connect that router in `backend/src/app.js` and work out the data fields with Jacob.

Labeled sample data can help you develop the interface while the database is being prepared. Your feature choice and screen flow are open; there's no preselected feature or feature-specific scaffold for you.

## Connecting to the backend later

The shared `apiRequest` helper takes a path beginning with `/api/`. It returns the data from the response and provides readable errors for connection problems or failed requests. For JSON writes, it accepts a method and `body: JSON.stringify(values)`.

The existing response format is `{ data: ... }` for successful requests and `{ error: { code, message } }` for errors. Following that format lets each screen use the same connection helper. Input validation and any account permissions can live with the backend feature handlers.

The tutorial router currently falls through to the shared not-found response because its handlers haven't been added. The signup/login previews also keep their data local. Session handling will be added when account access is connected.

The frontend's environment file holds the public backend address; database credentials stay in the backend. The README explains phone connection setup, and Profile has a connection check that works without the database.

## Useful checks as we bring the features together

From the repository root, `npm run typecheck`, `npm test` and `npm run build` check the shared setup. Trying navigation, form errors and connection failures on a phone/emulator can help catch issues the browser preview misses.

A feature branch and pull request make it easier for us to review and combine changes. Screenshots and a short note about what's working or waiting on the database will also help with the report. We can coordinate schema questions with Jacob and bring the screens together as each feature is ready.
