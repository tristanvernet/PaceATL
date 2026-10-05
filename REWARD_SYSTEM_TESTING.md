# PaceATL Reward System - test guide

## What was added
- My Achievements screen at `/achievements`.
- Profile and Home links to the reward screen.
- Four badges: First Step (1 workout), Getting Consistent (5 workouts), Five Mile Club (5 total miles), and Hour of Power (60 total minutes).
- Authenticated reward API at `GET /api/rewards/` and `POST /api/rewards/activity`.
- Database tables `reward_activity_events` and `user_achievements` created by `database/migrations/001-schema.sql` through `npm run db:setup`.
- Client and server validation plus readable success/error messages.
- Unit tests for activity validation and badge thresholds.

## Test the full feature
1. Restore dependencies with `npm ci` from the repository root.
2. Configure `backend/.env` and `frontend/.env` as described in the main README.
3. Run `npm run db:setup` once so the two reward tables are added.
4. Run `npm run dev:web` or `npm run dev`.
5. Create an account or log in.
6. Open Home -> Achievements & rewards, or Profile -> My Achievements.
7. In "Test the reward system", enter a distance and duration and press "Add sample workout".
8. The first valid activity should show `New Achievement Unlocked: First Step`. A 5-mile / 60-minute sample can unlock the distance and time badges. Five submitted activities unlock Getting Consistent.
9. Refresh or reopen the screen. Earned badges should remain unlocked because they are stored in MySQL.

## Validation/error checks
- Enter a negative distance: the app rejects it.
- Enter 0 minutes: the app rejects it.
- Call the API without logging in: the backend returns 401.
- Use an unsupported activity type through the API: the backend returns `INVALID_ACTIVITY`.
- Duplicate badge awards are prevented by a unique database key.

## Automated checks
Run `npm test` after dependencies are installed. `backend/tests/rewards.test.js` tests validation and achievement thresholds. Run `npm run typecheck` for the frontend TypeScript check.

The sample-workout control is intentionally labeled as a test path because the repository's full workout logger is still marked unfinished. When that logger is completed, it can call the same `POST /api/rewards/activity` logic after a real workout is saved, or the reward service can be invoked from the workout backend transaction.

## Integration verification (October 5, 2026)
- 18 automated unit/API tests passed.
- Live MySQL tests passed: all four badge thresholds, concurrent submissions without duplicate awards, account isolation and persistence across a server restart.
- TypeScript and iOS/Android/web exports passed.
- Browser checks passed: navigation, sign-in requirement, validation, badge unlocks and refresh persistence.
- Physical phone testing remains pending.
