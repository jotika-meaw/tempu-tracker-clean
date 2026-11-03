# Requirements Checklist

Legend: **Done** = implemented and evidenced; **Partial** = implemented with a stated caveat; **Manual** = code exists but needs a real environment/device; **Not done** = not implemented.

## A. Route data

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| A1 | Preserve all 16 routes `01`–`08`, `10`–`17` | **Done** | `shared/routes.ts`; backend test “keeps exactly the supplied 16 route numbers” |
| A2 | Route `09` must remain absent and never be invented | **Done** | `TEMPU_ROUTE_NUMBERS`; tests for `০৯`, `09`, `route 09`; API rejects start with `09` (`400`) |
| A3 | Preserve exact stop names and order | **Done** | Structured source mirrors the supplied route strings; tests preserve special characters and parenthetical names |
| A4 | Preserve explicit return routes where supplied | **Done** | `return.stops` retained; Route 11 explicit return test |
| A5 | Handle `একই পথে` by reversing outbound | **Done** | `getDirectionData` reverse logic; test “routes marked একই পথে use the exact reverse stop order” |
| A6 | Route 15: `আবদুস সাত্তার রোড হয়ে একই পথে` without treating the road as a stop | **Done, caveat** | `return.via = ["আবদুস সাত্তার রোড"]`; return stops exclude it; test; **tail marked partially inferred** and needs owner confirmation |
| A7 | Keep `একে খান মোড়` and `একে খান গেট` distinct | **Done** | Different route-11 directions; search test asserts direction separation |
| A8 | Do not claim independent field verification of the dataset | **Done** | README, known limitations, UI “verified route” refers to the supplied dataset only |

## B. Driver journey flow

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| B1 | Flow: route → direction → valid partial start/end | **Done** | `DriverPanel.tsx`; start/end selects reset on route/direction change |
| B2 | Reject invalid journeys server-side | **Done** | `shared/journey.ts` + `parseStartRequest`; `INVALID_DIRECTION`, `INVALID_INDEX`, `SAME_STOP`, `END_BEFORE_START`, `UNKNOWN_ROUTE` |
| B3 | Do not accept same stop or reversed indices | **Done** | Journey tests; API `400` tests |
| B4 | Show the selected segment and route direction before start | **Done** | Driver route preview with matched stop chips and selected start → end |
| B5 | Warn when a direction is partially inferred | **Done** | “আংশিক অনুমান” badge and driver warning for Route 15 |

## C. Genuine GPS and consent

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| C1 | Use only genuine browser/device GPS | **Done, caveat** | `navigator.geolocation.getCurrentPosition` + `watchPosition`; no sample coordinates or simulated movement. Browser GPS can still be spoofed by a determined user |
| C2 | Explicit consent before sharing | **Done** | Checkbox + consent text; server requires `consent === true`; test rejects missing consent |
| C3 | No fake movement or “demo vehicle” presented as live | **Done** | Demo vehicles are simulated in the browser only, always tagged DEMO with a dashed border and a map notice, never sent to the server or AI, and can be switched off; real GPS pins carry no tag |
| C4 | Clear permission-denied, unavailable, timeout states | **Done** | Driver error mapping and localized messages |
| C5 | Stop sending on stop, permission loss, session expiry, page hide | **Done** | `clearWatch`, `pagehide`, `stopTracking`, `UNAUTHORIZED_SESSION` handling |
| C6 | Do not show coordinates to the driver | **Done** | Driver UI shows only time, accuracy, session ID, expiry |
| C7 | Genuine two-device GPS test | **Manual** | Requires physical phone/tablet; not available here |

## D. Multi-vehicle tracking

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| D1 | Support multiple vehicles without overwriting | **Done** | Per-session records keyed by token hash; two-vehicle API test |
| D2 | Session-identified updates | **Done** | Bearer token → SHA-256 hash → atomic update |
| D3 | Store only hashed tokens | **Done** | `generateSessionSecrets`, `hashSessionToken`; no raw token in DB |
| D4 | Use server timestamps | **Done** | `startedAt`, `lastLocationAt`, `expiresAt`, `serverTime`, `ageSeconds`; client clock not trusted for freshness |
| D5 | Validate coordinates and body size | **Done** | Latitude/longitude/accuracy checks; 16 KB JSON limit |
| D6 | Rate-limit updates | **Done** | Per-session min interval (`429 UPDATE_TOO_FREQUENT`) plus endpoint limits |
| D7 | Hide stale locations | **Done** | Server cutoff + client-side aging; tests for stale hiding and count |
| D8 | Filter by route | **Done** | `/api/tracking/active?routeNumber=`; map filter |
| D9 | Accessible textual vehicle list | **Done** | Live map list with route, direction, segment, age, accuracy, privacy label |

## E. MongoDB and persistence

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| E1 | Use MongoDB Atlas Free when credentials are configured | **Done** | `MongoTrackingStore` selected when `MONGODB_URI` present; deployed API health reports `mode: mongodb, persistent: true` |
| E2 | Official MongoDB driver | **Done** | `mongodb` 7.7.0 |
| E3 | Indexes | **Done** | Unique token/public ID; route/status/last location; status/last location; TTL |
| E4 | Schema validation | **Done** | `$jsonSchema` with strict validation |
| E5 | TTL retention | **Done** | `ttl_expires_at` index on `expiresAt` |
| E6 | Explicit memory fallback, no fake live data | **Done** | Health modes `memory`/`memory-fallback`; UI warning; no seeded vehicles |
| E7 | Fail closed when persistence is required | **Done** | `MONGODB_REQUIRED=true` → unavailable store → tracking `503` |
| E8 | Real MongoDB integration test | **Manual** | Skipped without `MONGODB_URI_TEST` |
| E9 | Multi-instance memory isolation | **Not done** | Memory mode is single-process only; documented |

## F. Meta AI

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| F1 | Use verified Meta Model API endpoint and model | **Done** | `https://api.meta.ai/v1`, `muse-spark-1.2-contributor` (pinned); authenticated model listing |
| F2 | Keep `MODEL_API_KEY` backend-only | **Done** | `server/config.ts`; no `VITE_*` secret; health hides key |
| F3 | Route-grounded answers only | **Done, caveat** | Prompt includes verified route context; output guard rejects unknown route numbers. Facts still need human review |
| F4 | Graceful AI errors | **Done** | `AI_NOT_CONFIGURED`, `AI_RATE_LIMITED`, `AI_TIMEOUT`, `AI_AUTH_FAILED`, `AI_UNAVAILABLE`, `AI_INVALID_RESPONSE` |
| F5 | AI and tracking independent | **Done** | Separate health/status; outage tests in both directions |
| F6 | Aggregate live counts only, no coordinates | **Done** | `listActive` aggregate by route; test asserts no coordinates in AI input |
| F7 | `store: false` | **Done** | Meta client request params |
| F8 | Real inference quality test | **Manual / blocked** | No approval to consume provider credits; `--infer` flag exists |
| F9 | Chittagonian support, no perfect-dialect claim | **Partial** | Experimental `ctg` answer language; UI says fallback to standard Bangla; no native-speaker evaluation |

## G. Privacy and security

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| G1 | Never expose DB URI | **Done** | Health returns status/latency/error code only; logs do not include URI |
| G2 | Never expose secrets | **Done** | `.env` ignored; key never in responses; docs use placeholders |
| G3 | Never collect phone/plate/private driver data | **Done** | Fields removed; UI explicitly says identity is not verified |
| G4 | Never collect precise passenger location | **Done** | No passenger geolocation calls; fixed map center |
| G5 | Do not claim authentication/verification from phone/plate | **Done** | No phone/plate fields; repeated unverified banners |
| G6 | Driver verification only if genuinely implemented | **Not done** | Out of scope; limitation is labelled |
| G7 | CORS allowlist, security headers, body limit | **Done** | `server/app.ts` |
| G8 | Structured error responses without internals | **Done** | Error middleware; API tests |
| G9 | No analytics/ad tracking | **Done** | None added |
| G10 | Privacy notice and security docs | **Done** | `docs/PRIVACY_AND_SECURITY.md`; in-app privacy disclosure |
| G11 | Formal penetration/security review | **Manual** | Not performed |

## H. UI, language, accessibility

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| H1 | Bangla-primary UI | **Done** | `lang="bn"`, Bangla-first strings, Noto Sans Bengali |
| H2 | English option | **Done** | UI toggle + full English dictionary |
| H3 | Practical Chittagonian without overclaiming | **Partial** | AI answer language `ctg` with fallback note; not a UI translation |
| H4 | Clear driver/passenger separation | **Done** | Passenger dashboard and full-screen driver interface are separate top-level modes; always-visible header driver button, driver-only notice, and two **যাত্রী ভিউতে ফিরুন** actions |
| H5 | Responsive layout | **Done** | Breakpoints at 1120/920/720/460 px; 390 px CDP check shows no horizontal overflow and a full-width driver button |
| H6 | Keyboard/focus accessibility | **Done** | Skip link, focus-visible styles, semantic labels |
| H7 | Loading states | **Done** | Health, map, AI, driver locating/starting |
| H8 | Empty states | **Done** | No results, no live vehicles, no AI answer; unsubmitted search stays hidden until used |
| H9 | Stale/offline states | **Done** | Server freshness, client aging, last-known label, retry |
| H10 | Error states | **Done** | Localized API error codes, banners, retry actions |
| H11 | Reduced motion | **Done** | `prefers-reduced-motion` |
| H12 | Screen-reader audit | **Manual** | Semantic review only; no NVDA/VoiceOver test |

## I. Optional passenger demand insights

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| I1 | Voluntary, aggregated, privacy-preserving demand insights | **Not done** | No demand feature, no passenger tracking. Documented only as a future extension with privacy constraints |

## J. Testing and documentation

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| J1 | Tests for routes/journeys | **Done** | 13 backend route/journey tests |
| J2 | Tests for GPS validation | **Done** | Coordinate/consent/rate/session API tests |
| J3 | Tests for multi-vehicle isolation | **Done** | Store and API tests |
| J4 | Tests for DB/AI outages | **Done** | 503/502/200 independence tests |
| J5 | Tests for AI fallback | **Done** | Missing config, auth, rate limit, timeout, invalid output |
| J6 | Tests for privacy | **Done** | Active response field assertions; AI coordinate exclusion |
| J7 | Frontend tests | **Done** | Search, freshness, API client (17 tests) |
| J8 | README | **Done** | `README.md` |
| J9 | `.env.example` | **Done** | Root and server examples |
| J10 | Architecture doc | **Done** | `docs/ARCHITECTURE.md` |
| J11 | Privacy/security doc | **Done** | `docs/PRIVACY_AND_SECURITY.md` |
| J12 | Test report | **Done** | `docs/TEST_REPORT.md` |
| J13 | Requirements checklist | **Done** | This file |
| J14 | Demo script | **Done** | `docs/DEMO_SCRIPT.md` |
| J15 | Known limitations | **Done** | `docs/KNOWN_LIMITATIONS.md` |
| J16 | Final Bangla report | **Done** | Delivered in the final chat response |

## K. Deployment, cost, and hackathon rules

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| K1 | Do not deploy without approval | **Done** | No deployment performed |
| K2 | Do not spend money without approval | **Done** | No inference call, Atlas cluster, or paid infrastructure created |
| K3 | Do not expose secrets in the report | **Done** | Key/URI never printed |
| K4 | Git init/commit/push | **Not done** | No repository initialized; awaiting approval |
| K5 | Official hackathon rules, eligibility, submission format, judging rubric, IP/ownership | **Manual** | Public event page found, but official rules/waiver require login; not confirmed |
| K6 | Android APK build | **Blocked** | Java/`ANDROID_HOME` missing; manifest permissions added but not built/tested |
| K7 | Production TLS/CSP/WAF/monitoring | **Not done** | Local prototype only; checklist in privacy doc |

## L. Definition of done for this iteration

- [x] All 16 routes represented exactly once.
- [x] Route 09 rejected.
- [x] Route 15 via-road handled without becoming a stop.
- [x] Valid partial journeys accepted; invalid journeys rejected server-side.
- [x] Genuine browser GPS flow with explicit consent.
- [x] Multi-vehicle map without overwrite.
- [x] Hashed session tokens and no token leakage in public responses.
- [x] Stale filtering on server and client.
- [x] MongoDB store and explicit memory/fallback modes.
- [x] Independent tracking/AI health and errors.
- [x] Backend-only Meta key and verified model endpoint.
- [x] Bangla-first responsive UI with English and experimental Chittagonian AI.
- [x] No phone/plate/identity claims.
- [x] Automated frontend and backend tests passing.
- [x] Required documentation created.
- [ ] Real Atlas test, real inference test, physical-device test, APK build, deployment, hackathon-rule confirmation.
