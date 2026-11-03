# Test Report

**Last local verification:** 29 October 2026 (Asia/Dhaka)
**Working directory:** `E:\Meta Hackathon 2026\tempu-tracker`

> **Note (3 November 2026):** this report records the 29 October local run. Since then the model was pinned to `muse-spark-1.2-contributor` in `server/config.ts` (references to `muse-spark-1.3` below are from the earlier run), and the deployed API at `tempu-tracker-server.vercel.app` runs against MongoDB Atlas with `persistent: true`. A re-run on 3 November gave the same results: frontend 17/17, backend 54 passed / 1 skipped, lint and typecheck clean.

## 1. Environment

| Item | Value |
| --- | --- |
| OS | Windows (win32) |
| Node.js | v24.18.0 |
| npm | 11.16.0 |
| Frontend | React 19.3.1, Vite 8.3.5, TypeScript 7.0.2 |
| Test runner (frontend) | Vitest 5.0.5 |
| Test runner (backend) | Node `node:test` via `tsx` |
| Backend | Express 5.3.0 |
| MongoDB driver | 7.7.0 |
| Browser used for UI checks | Headless Google Chrome |
| MongoDB configured? | No — memory mode was active |
| Meta key configured? | Yes, in `server/.env` (not displayed) |

## 2. Summary

| Check | Command | Result |
| --- | --- | --- |
| Frontend unit tests | `npm test` | **3 files, 17 tests passed, 0 failed** |
| Frontend production build | `npm run build` | **Passed**, 75 modules |
| Frontend lint | `npm run lint` | **Passed**, 0 warnings |
| Driver access + UI GPS flow | Headless Chrome/CDP | **Passed** on desktop + 390 px mobile; emulated geolocation, not a physical device |
| Frontend dependency audit | `npm audit --json` | **0 vulnerabilities** |
| Backend typecheck | `cd server && npm run typecheck` | **Passed** |
| Backend tests | `cd server && npm test` | **55 tests, 54 passed, 1 skipped, 0 failed** |
| Backend dependency audit | `cd server && npm audit --json` | **0 vulnerabilities** |
| Meta model listing | `cd server && npm run verify:meta` | **Authenticated, 9 models visible, model present** |
| Real Meta inference | `npm run verify:meta -- --infer` | **Not run** — no approval to consume provider credits |
| MongoDB integration test | `MONGODB_URI_TEST=... npm test` | **Skipped** — no test URI available |
| Physical two-device GPS test | Manual | **Not run** — no second device available |
| Android APK build | `npx cap build android` / Gradle | **Not run** — Java/`ANDROID_HOME` unavailable |

## 3. Frontend test inventory

`src/lib/search.test.ts` — 8 tests:

- Empty query returns no results instead of every route.
- Bangla digits and the `রুট` prefix normalize correctly.
- Every route serving `লালদীঘি` is found; route 09 never appears.
- Route 11 is found by `রুট ১১`.
- `একে খান মোড়` and `একে খান গেট` remain distinct and match the correct direction.
- Route 09 is never invented by `০৯`, `09`, or `route 09`.
- Exact stop matches rank first.
- Stop index is de-duplicated across both directions and does not contain the via-road `আবদুস সাত্তার রোড`.

`src/lib/freshness.test.ts` — 4 tests:

- Live/aging/stale boundaries at the server freshness window.
- ISO timestamp age computation does not go negative.
- Client-side age grows between polls.
- A snapshot older than the window becomes stale even if no new response arrives.

`src/api/client.test.ts` — 5 tests:

- Start request carries explicit consent and the validated journey.
- Structured server error codes and `Retry-After` are preserved.
- Network failure maps to `NETWORK_ERROR`.
- Stop sends the token only in the `Authorization` header and not in the body.
- Route filter encoding and AI language payload are correct.

Exact result:

```text
Test Files  3 passed (3)
Tests       17 passed (17)
Duration    1.68s
```

## 4. Backend test inventory

### Route and journey data (13 tests)

- Exactly the 16 supplied route numbers; route 09 is rejected/invented nowhere.
- Every direction has an ordered, usable stop list.
- `একই পথে` routes use the exact reverse of outbound.
- Route 11 keeps its explicit return and distinct place names.
- Route 15 keeps `আবদুস সাত্তার রোড` as a via-road, not a stop.
- Special characters and parenthetical stop names are preserved.
- Every route supports a full outbound and return journey.
- Every adjacent stop pair is a valid partial journey.
- Route 15's inferred return tail matches the structured expectation.
- Route 09 and all non-canonical route numbers are rejected.
- Same-stop, reversed-index, out-of-range, and invalid-direction journeys are rejected.
- Route 11's return starts at its explicit stop.

### Tracking store (6 tests)

- Session creation stores only the latest GPS point.
- Updates arriving inside the minimum interval are rejected.
- Two vehicles remain independent.
- Stale locations are hidden while the aggregate stale count is reported.
- Expiry rejects updates and removes the vehicle from active results.
- Memory and memory-fallback health are distinguishable.

### AI service and prompt (12 tests)

- Missing configuration does not crash the service.
- Prompt is grounded in the verified routes and excludes coordinates.
- Health output never contains the API key.
- `401`/`403` map to a safe `502` without retrying.
- `429` retries and honours `Retry-After`.
- Provider outages/timeouts use bounded retries.
- Client timeout is enforced even if the provider never answers.
- Empty output and unknown route numbers are rejected.
- Unavailable live data is labelled as unverifiable, not zero.
- Route context documents Route 15's partial return.
- Language and anti-hallucination instructions are present.

### Configuration and health (6 tests)

- Safe defaults and clamping.
- Memory mode is degraded but ready.
- Connected MongoDB + AI is healthy.
- Unavailable tracking is `503`/not ready.
- Runtime MongoDB disconnection is handled.
- AI-only outage keeps tracking ready.

### HTTP API (13 tests)

- Health exposes separate database/AI status without secrets.
- Readiness is true in explicit memory mode.
- Start → location → active → stop works end to end.
- Active responses never expose tokens, hashes, or consent records.
- Missing/malformed/unknown bearer tokens return `401`.
- Per-session update interval returns `429`.
- Invalid routes, journeys, consent, and coordinates return `400`.
- Malformed JSON and oversized bodies return structured errors.
- Two vehicles remain independent and route filtering works.
- Stale locations disappear and are counted.
- Expired sessions cannot update or appear live.
- Unavailable tracking returns clear `503`s while AI stays up.
- AI-not-configured and AI-auth-failure do not affect tracking.
- AI receives aggregate counts but never coordinates.
- CORS allows configured origins and rejects unknown browser origins.
- Unknown endpoints return structured `404`.
- AI request validation rejects empty, huge, and invalid-language questions.

Exact result:

```text
tests 55
pass 54
fail 0
skipped 1
duration_ms 4650.5909
```

### The one skip

`server/test/mongo.integration.test.ts` is skipped when `MONGODB_URI_TEST` is absent. It covers real MongoDB persistence, indexes, schema validation, uniqueness, and session isolation against a live database.

To run it against a **test-only** database:

```powershell
$env:MONGODB_URI_TEST="mongodb+srv://<test-user>:<password>@<test-cluster>/..."
$env:MONGODB_DB_NAME_TEST="tempu_tracker_test"
cd server
npm test
```

Do not point this at a production database. The integration test creates and removes test sessions.

## 5. Build output

```text
vite v8.3.5 building client environment for production...
✓ 75 modules transformed.
dist/index.html                   0.69 kB │ gzip:   0.41 kB
dist/assets/index-yECcVJe0.css   47.21 kB │ gzip:  13.06 kB
dist/assets/index-CNgv7Zsx.js   466.44 kB │ gzip: 136.18 kB
✓ built in 319ms
```

The JavaScript bundle is below Vite's default warning threshold. The main contributor is React + Leaflet; route splitting would be the next optimization if the bundle grows.

## 6. HTTP smoke test (live servers, memory mode)

Backend: `http://localhost:3001`
Frontend dev server: `http://localhost:5173`

| Step | Observed |
| --- | --- |
| `GET /api/health` | `200`, `status: degraded` because memory mode; database `memory`, AI configured with `muse-spark-1.3` |
| `GET /api/health/ready` | `200` — memory mode is explicitly allowed |
| `GET /api/tracking/active` | `200`, 0 vehicles |
| `POST /api/tracking/start` route 01, outbound, 0→3 | `201`, 4 segment stops, confidence `verified` |
| `POST /api/tracking/location` with Bearer token | `200`, accepted |
| `GET /api/tracking/active` | `200`, 1 vehicle, route `01`, no `sessionToken` field |
| `POST /api/tracking/start` route `09` | `400` |
| `POST /api/ai-test` with empty message | `400` (no provider call) |
| `POST /api/tracking/stop` | `204` |
| `GET /api/tracking/active` after stop | `200`, 0 vehicles |
| Frontend `/` | `200`, `<html lang="bn">`, title `Tempu Tracker — Chattogram` |
| Vite `/api/health` proxy | `200` |

A second smoke session on route 11 appeared on the rendered map as a route-11 marker with the vehicle list entry. The session was stopped immediately afterwards.

The smoke test intentionally did **not** call the AI with a real question, to avoid unapproved inference spending.

## 7. Browser and UI checks

Headless Chrome was used to render and screenshot the real development build:

- Passenger dashboard (`#/explore`): old-style sidebar, Bangla hero, memory-mode banner, search form, embedded live map card, assistant card, travel-confidence card, 16-route directory. The empty-search banner is hidden until a search is submitted.
- Live map: OpenStreetMap tiles, route filter, empty state, privacy footer, accessible list.
- Live map with a real active session: route-11 marker and vehicle list entry.
- Driver interface (`#/driver`, full screen): separate top bar and back action, role notice, route/direction/start/end controls, consent box, disabled-until-valid start action, unverified-identity warning.
- Assistant view: language selector, question form, sample questions, AI status card, privacy notes.
- Deep links `#/explore`, `#/map`, `#/driver`, `#/assistant` render the corresponding view; `#/search` resolves to Explore.

### Driver-access repair verification (29 Oct 2026)

Headless Chrome with CDP was used to click the real UI, not just inspect source:

| Check | Observed |
| --- | --- |
| Driver button on Explore, desktop 1440 px | Visible, `display:flex`, 146 × 44 px, inside viewport |
| Driver button on mobile 390 px | Full-width 362 × 46 px, inside viewport, no horizontal overflow |
| Driver button on mobile 320 px | Full-width 292 × 46 px, inside viewport, no horizontal overflow |
| Click from Explore | Hash becomes `#/driver`; real `DriverPanel` form and heading render |
| Driver back action | Both header and main-content **যাত্রী ভিউতে ফিরুন** buttons return to `#/explore` |
| Driver button on `#/map` and `#/assistant` | Present on both views |
| Route 15 return partial journey | 9 return stops, `আংশিক` warning, selected-stop preview works |
| UI GPS start flow (Chrome geolocation emulation) | Route 01, outbound, 0 → 3; consent accepted; active session route `01`, source `driver-device-gps` |
| Watch position update | Emulated fix moved from (22.3569, 91.7832) to (22.3581, 91.7850); backend active location updated |
| Passenger live map | A real backend session (emulated coordinates) produced a route-01 marker and vehicle-list entry on `#/map`; the entry disappeared after the session stopped |
| Stop from UI | Live card disappears, idle card returns, Bangla stop message shown, active vehicles become 0 |
| Permission denied | Bangla message: “অবস্থানের অনুমতি দেওয়া হয়নি…” and no session created |
| Network failure during live update | Bangla connectivity warning shown; session stayed live and could be stopped |
| Route `09` via API | `400`, `UNKNOWN_ROUTE` |

These checks used Chrome's geolocation emulation, **not a physical phone/device**. A real two-device GPS test is still required.

Screenshots under `docs/screenshots/` were recaptured on 4 November 2026 from the live site (MongoDB connected) with headless Chrome: desktop at 1440 × 900, mobile at 390 × 844 with 2× pixel density, and reduced motion so entrance animations do not blur them.

## 8. Dependency audit

After updating Capacitor CLI tooling with `npm audit fix`:

```text
found 0 vulnerabilities
```

Both root and server audits report zero vulnerabilities at the time of this run. The audit result is time-sensitive and should be re-run before deployment.

## 9. Meta API verification

`server/scripts/verify-meta.ts` was added because `package.json` referenced `verify:meta`.

Default mode:

```text
Base URL: https://api.meta.ai/v1
Requested model: muse-spark-1.3
MODEL_API_KEY: present (not displayed)
Authenticated model listing: 9 model(s) visible.
Visible models: muse-wonder-1.0, sam-3.1, muse-spark-1.3-contributor,
muse-voice-transcribe-1.0, muse-spark-1.3, muse-image-1.0,
muse-spark-1.2-contributor, muse-spark-1.2, muse-spark-1.1
No inference call was made.
```

This verifies the endpoint, authentication, and model availability without generating an answer. It does not verify answer quality, latency under load, or billing behaviour.

## 10. Not tested / blocked

| Area | Status | Reason / next step |
| --- | --- | --- |
| Real Meta inference | Not run | Needs explicit approval; may consume credits |
| MongoDB integration | Skipped | No `MONGODB_URI_TEST`; supply a test-only Atlas URI |
| Two physical devices | Not run | Needs a phone/tablet plus passenger browser |
| GPS permission denial on a real device | Not run | Needs physical device |
| Network loss during active tracking | Not run | Needs device/network control; client logic reviewed |
| Android APK | Not built | Java not found; `ANDROID_HOME` not set |
| Capacitor native build | Not run | Same as above |
| Load/performance test | Not run | No k6/Artillery scenario yet |
| Penetration test | Not run | No formal security review |
| Cross-browser matrix | Partial | Chrome headless only |
| Screen-reader audit | Not run | Semantic review only; needs NVDA/VoiceOver |
| Production deployment | Not run | No deployment approved |
| Git commit/push | Not run | No repository initialized |

## 11. Reproduce

```powershell
cd "E:\Meta Hackathon 2026\tempu-tracker"

# Frontend
npm install
npm test
npm run build
npm run lint
npm audit

# Backend
cd server
npm install
npm run typecheck
npm test
npm audit
npm run verify:meta

# Run locally
npm run dev          # terminal 1 (from server/)
npm run dev          # terminal 2 (from project root)
```

## 12. Interpretation

The automated suite gives good coverage of the domain rules, API contract, privacy boundary, failure isolation, and client error handling. It does **not** prove that the route data matches the physical streets, that GPS works in a particular device/browser, that MongoDB Atlas behaves in the target account, or that the Meta model produces good answers under real load. Those are manual verification items, listed in [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).
