# Architecture

## 1. System overview

Tempu Tracker is a TypeScript monorepo-style workspace with three cooperating parts:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Browser / Android WebView                                       │
│                                                                  │
│  React 19 + Vite 8                                              │
│  ├─ Passenger search / route directory                          │
│  ├─ Live map (React Leaflet + OpenStreetMap tiles)              │
│  ├─ Meta AI assistant card                                      │
│  └─ Driver panel (Geolocation API + explicit consent)           │
└───────────────┬──────────────────────────────────────────────────┘
                │ relative /api in dev (Vite proxy)
                │ VITE_API_BASE_URL + HTTPS in production
                ▼
┌──────────────────────────────────────────────────────────────────┐
│ Node.js + Express 5 API                                          │
│                                                                  │
│  app.ts ── health.ts                                            │
│  ├─ /api/health, /api/health/ready                              │
│  ├─ /api/tracking/* ── validation.ts ── shared/journey.ts       │
│  │                     └─ tracking/factory.ts                    │
│  │                          ├─ memory-store.ts (explicit mode)   │
│  │                          ├─ mongo-store.ts (persistent)       │
│  │                          └─ unavailable store (fail closed)   │
│  └─ /api/ai-test ── ai/service.ts ── ai/meta-client.ts          │
└───────────────┬──────────────────────────────┬───────────────────┘
                │                              │
                ▼                              ▼
       MongoDB Atlas (optional)        Meta Model API
       tracking_sessions               https://api.meta.ai/v1
       schema + indexes + TTL          muse-spark-1.2-contributor (pinned)
```

MongoDB and Meta AI are deliberately independent. A tracking failure does not disable the assistant, and an AI failure does not disable tracking or the live map.

## 2. Shared domain layer

`shared/routes.ts` is the single source of truth for route data. It contains the 16 verified routes and an explicit structure for each direction:

- `outbound.stops` — ordered stop list.
- `return.stops` — explicit return list, or the reverse of outbound for `একই পথে`.
- `return.confidence` — `verified` or `partial`.
- `return.via` — road instructions that are not passenger stops.
- `return.note` — human-readable caveat.

`shared/journey.ts` provides:

- `findRoute(number)` — exact route lookup.
- `getDirectionData(route, direction)` — outbound/return data.
- `validateJourney(routeNumber, direction, startIndex, endIndex)` — rejects unknown routes, invalid directions, equal stops, reversed indices, and out-of-range indices.
- `segmentStops` — the inclusive slice used in the driver card and public vehicle response.

The frontend re-exports this module through `src/routes.ts`. The backend imports it directly, so the same journey rules apply in both places. Server-side validation is authoritative; the UI validation is only for immediate feedback.

### Route 15 handling

Route 15 is deliberately marked `partial` on the return direction. The supplied source says `আবদুস সাত্তার রোড হয়ে একই পথে`. The implementation keeps:

- `আবদুস সাত্তার রোড` in `return.via`, **not** in `return.stops`.
- The explicit return prefix `কোতোয়ালী মোড় → লালদীঘি → আন্দরকিল্লা`.
- The inferred reverse of the outbound suffix after `আন্দরকিল্লা`.

The UI displays an “আংশিক অনুমান” badge so the inference is visible rather than hidden.

## 3. Frontend

### App shell and navigation

- `src/App.tsx` owns mode/view state, language, health polling, and role separation.
- There are two top-level modes: the passenger dashboard and the full-screen driver interface.
- Passenger views are deep-linkable via hashes: `#/explore` (default dashboard), `#/map`, `#/assistant`. The driver interface is `#/driver`; unknown or legacy hashes such as `#/search` resolve to Explore.
- The passenger dashboard embeds a compact live map and the assistant card, with the full map/assistant pages still available from the sidebar.
- The **ড্রাইভার ড্যাশবোর্ড** button is always rendered in the passenger top bar on Explore, Live map, and Assistant views. It is never conditionally hidden, and becomes a full-width 46 px target below 720 px.
- `hashchange`/`popstate` synchronize browser navigation; non-route anchors such as the skip link are ignored.
- Health is polled every 30 seconds and drives the memory/AI/offline banners.
- The driver interface is not listed in passenger navigation. It opens from the top-bar driver button and provides two **যাত্রী ভিউতে ফিরুন** actions: one in the driver top bar and one above the driver content.
- The driver and passenger experiences are visually and functionally separated. There is no claim that a phone number or plate proves identity.

### Passenger search

- `src/lib/search.ts` performs deterministic matching over the shared route data.
- Normalization: NFC, lowercase, Bangla-to-ASCII digits, optional `রুট`/`route` prefix.
- Results include matched directions and matched stop indices; exact stop matches rank above partial matches.
- The route directory lists every verified route and both directions.

### Live map

- `src/LiveMap.tsx` supports a full page and an `embedded` dashboard card; both use the same polling and freshness logic.
- It polls `/api/tracking/active` every 5 seconds.
- Server sends `ageSeconds`, `staleSeconds`, and `serverTime`.
- The client ages positions between polls and hides anything older than the server freshness window, so a dropped connection cannot leave an old pin looking live.
- Multiple vehicles are rendered as separate Leaflet markers keyed by `publicId`.
- The accessible vehicle list exposes route, direction, segment, age, accuracy, source, and “identity not verified” without requiring the map.
- Offline and stale snapshots are labelled “last known”, not “live”.

### Driver panel

1. Select route, direction, start stop, end stop.
2. Client checks the same journey rules as the server.
3. Read consent text and tick the explicit checkbox.
4. Call `navigator.geolocation.getCurrentPosition` with high accuracy.
5. Send one initial fix and journey metadata to `/api/tracking/start`.
6. Start `watchPosition`; send at most one update every 5 seconds while a request is in flight.
7. Stop on button press, permission revocation, session expiry (`401`), or `pagehide`.
8. Never show coordinates, phone, plate, or claimed identity in the UI.

The “Open live map in a new tab” action opens `#/map` in a new tab and keeps the driver tab mounted so the GPS watch continues. Navigating away from the driver view in the same tab unmounts the panel and stops the session.

### Accessibility and responsiveness

- Skip link to `#main-content`.
- Visible `:focus-visible` styles for buttons, inputs, selects, summaries, and links.
- Semantic headings, labels, lists, `role="status"`/`role="alert"` for state changes.
- `aria-live` for search result counts and AI answers.
- Reduced-motion media query.
- Responsive layouts at 1120 px, 920 px, 720 px, and 460 px.
- Bangla-first typography (`Noto Sans Bengali`) with DM Sans for Latin text.

## 4. Backend

### HTTP pipeline

`server/app.ts` applies, in order:

1. `helmet` security headers, `x-powered-by` disabled.
2. CORS allowlist from `CORS_ORIGINS`.
3. JSON body parser with a 16 KB limit and strict object/array rules.
4. Rate limits on `/api`, AI, tracking start, location, and active map reads.
5. `Cache-Control: no-store` on all API responses.
6. Request logging with method, path, status, and duration only.
7. Routes and structured error middleware.

The error middleware maps:

- `ApiError` → its structured status/code/message.
- `AiError` → safe AI status/code/message.
- `TrackingStoreUnavailableError` → `503 TRACKING_STORE_UNAVAILABLE`.
- Oversized bodies → `413 PAYLOAD_TOO_LARGE`.
- Malformed JSON → `400 INVALID_JSON`.
- Anything else → `500 INTERNAL_ERROR` without internal details.

### Tracking lifecycle

```text
POST /start
  validate consent + journey + initial coordinates
  generate 32 random bytes → base64url token (43 chars)
  SHA-256(token) → tokenHash
  insert session with publicId, route, direction, segment, coordinates
  return token once + public journey

POST /location
  parse Bearer token (43-char base64url)
  validate latitude/longitude/accuracy
  hash token
  atomic update if active, unexpired, and older than min interval
  return public vehicle, never the token/hash

GET /active
  filter active + unexpired + fresh
  sort by lastLocationAt desc, limit 100
  count stale-but-unexpired sessions separately
  return public fields only

POST /stop
  delete by token hash
  204 even when the token is already gone
```

Sessions slide their `expiresAt` forward on each accepted location update. The default session TTL is one hour; the default update interval is 3 seconds; the browser sends about every 5 seconds. The default freshness window is 30 seconds.

### MongoDB schema

Collection: `tracking_sessions`

```text
tokenHash       string, 64 hex chars, unique
publicId        string, unique
routeNumber     enum of the 16 verified routes
routeName       string
direction       "outbound" | "return"
startIndex      number
endIndex        number
startStop       string
endStop         string
segmentStops    array of strings, min 2
latitude        number [-90, 90]
longitude       number [-180, 180]
accuracy        number >= 0 | null
status          "active"
startedAt       date
lastLocationAt  date
expiresAt       date
consentVersion  string
```

Indexes:

- `uniq_token_hash` — unique.
- `uniq_public_id` — unique.
- `route_status_last_location` — route-filtered map queries.
- `status_last_location` — global map queries.
- `ttl_expires_at` — TTL index on `expiresAt` with `expireAfterSeconds: 0`.

Validation is strict at the collection level (`validationAction: "error"`). If `collMod` is not permitted by the Atlas role, application-level validation remains authoritative and startup continues.

### Storage factory

`tracking/factory.ts` chooses the store at startup:

```text
MONGODB_URI blank + required false      → memory
MONGODB_URI blank + required true       → unavailable
Mongo connects                          → mongodb
Mongo fails + required false            → memory-fallback
Mongo fails + required true             → unavailable
```

Health responses expose `configured`, `connected`, `mode`, `persistent`, `latencyMs`, and `errorCode`. They never expose the URI, credentials, or database host.

Memory mode is a single-process `Map`. It is intentionally not shared across multiple server instances and disappears on restart. The UI labels it as temporary.

## 5. Meta AI flow

1. `POST /api/ai-test` validates `message` (1–1000 chars, no control characters) and `language` (`bn`, `en`, `ctg`).
2. The server reads **aggregate** live data: total fresh sessions and counts by route. It never passes coordinates, tokens, or session identifiers.
3. If the tracking store is unavailable, the prompt explicitly says live data cannot be verified instead of claiming zero vehicles.
4. `ai/prompt.ts` supplies the verified route context, including Route 15's partial return and via-road note.
5. `ai/service.ts` calls the Meta client with `store: false`, bounded output tokens, and an application-level timeout.
6. Retries are capped at two. `429` and `5xx`/timeout errors retry; `401`/`403` do not.
7. The output guard rejects empty/oversized answers and route numbers outside the verified set unless the answer explicitly says they are unavailable.
8. Errors are mapped to safe codes (`AI_NOT_CONFIGURED`, `AI_RATE_LIMITED`, `AI_TIMEOUT`, `AI_AUTH_FAILED`, `AI_UNAVAILABLE`, `AI_INVALID_RESPONSE`). The API key never appears in a response.

The AI is an assistance layer, not an authority. It is told not to invent fares, arrival times, or exact positions.

## 6. Configuration

Backend (`server/.env`, never committed):

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `3001` | API port |
| `NODE_ENV` | development | `production` enables production mode |
| `CORS_ORIGINS` | local Vite origins | Comma-separated allowlist |
| `TRUST_PROXY` | `false` | Only true behind a trusted proxy |
| `MONGODB_URI` | blank | Atlas URI; optional |
| `MONGODB_DB_NAME` | `tempu_tracker` | Safe identifier |
| `MONGODB_REQUIRED` | `false` | Fail closed if true and Mongo is down |
| `MODEL_API_KEY` | blank | Backend only |
| `META_BASE_URL` | `https://api.meta.ai/v1` | Verified endpoint |
| `META_MODEL` | `muse-spark-1.2-contributor` | Pinned in `config.ts`; env ignored |
| `AI_TIMEOUT_MS` | `20000` | Clamped 3–60 s |
| `AI_MAX_OUTPUT_TOKENS` | `2000` | Clamped 50–2000; headroom for reasoning models |
| `TRACKING_STALE_SECONDS` | `30` | Clamped 5–300 |
| `TRACKING_SESSION_TTL_SECONDS` | `3600` | Clamped 60–86400 |
| `LOCATION_MIN_INTERVAL_MS` | `3000` | Clamped 500–60000 |
| `RATE_LIMIT_ENABLED` | `true` | Disable only for controlled tests |

Frontend (`.env`, optional):

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | empty | Empty means relative `/api` + Vite proxy in dev |
| `VITE_API_PROXY_TARGET` | `http://localhost:3001` | Vite dev proxy target |

## 7. Deployment shape

Recommended production setup:

```text
Static host (HTTPS)  ──►  API host (HTTPS, Node)  ──►  MongoDB Atlas
        │                         │
        └── VITE_API_BASE_URL ────┘
                                  └──►  api.meta.ai
```

Set `CORS_ORIGINS` to the exact static-host origin. Do not use `*`. Put the API behind TLS and a trusted reverse proxy, then set `TRUST_PROXY=true` only if that proxy is under your control. Serve `dist/` from a static host. The backend currently runs TypeScript through `tsx`; there is no separate compile step.

## 8. Extension points

- **Demand insights**: must be voluntary, aggregated, and privacy-preserving. Not implemented. Never collect passenger location or individual trip history for this.
- **Route verification**: replace the supplied dataset only after an owner-confirmed field check; keep Route 15's partial flag until then.
- **Driver verification**: if added, use a real verification provider and never claim phone/plate possession equals identity.
- **Push/ETA**: requires a real schedule or historical travel-time model; do not infer from current GPS alone.
- **Native background tracking**: requires a foreground service, persistent notification, and explicit platform permission review. The current build is foreground-only.
