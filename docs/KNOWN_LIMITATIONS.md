# Known Limitations

This document lists what the prototype does **not** do or has not yet proven. It is intentionally blunt so the demo and submission do not overclaim.

## 1. Route data

- The 16-route dataset comes from the supplied hackathon route list. It has not been independently field-verified street by street.
- Route `09` is absent because the supplied dataset has no route 09. The app never invents it.
- **Route 15's return tail is partially inferred.** The source says `আবদুস সাত্তার রোড হয়ে একই পথে`. The app keeps `আবদুস সাত্তার রোড` as a via-road, keeps the explicit `কোতোয়ালী মোড় → লালদীঘি → আন্দরকিল্লা` prefix, and reverses the outbound suffix after that. Owner confirmation is still required.
- “Verified” in the UI means “matches the supplied structured dataset”, not “checked against an official transport authority”.
- Stop spellings are preserved from the source, including variants such as `মোড়`/`মোড়` and `পাড়া`/`পাড়া`. Search normalizes Unicode and digits, but other sources may spell names differently.
- The dataset has no fare, schedule, frequency, accessibility, or operator information.
- No geocoding is used. A place outside the supplied stop names will not be invented; search returns no result.

## 2. Driver identity and vehicle verification

- There is **no driver authentication**.
- There is **no phone verification**, plate verification, document upload, or background check.
- The route, direction, start/end stop, and consent are self-declared.
- Anyone who can reach the driver page can create a live session and declare a route.
- The UI labels this limitation in passenger and driver views.
- Adding real verification later requires a genuine provider and a careful review of impersonation, privacy, and data-retention risks. A phone number or plate photo alone would not prove identity.

## 3. GPS authenticity

- The app uses the browser/device Geolocation API. It does not generate sample coordinates or simulate movement.
- The server validates coordinate ranges, accuracy, update rate, consent, and session ownership.
- The server **cannot prove physical presence**. A determined user can spoof browser geolocation with developer tools, a modified browser, or a rooted device.
- GPS accuracy varies in dense urban areas, under bridges, and indoors. The app displays reported accuracy but does not guarantee it.
- There is no background tracking. Tracking stops when the driver leaves the driver view in the same tab, closes the page, or loses permission.
- On Android, the WebView must be granted location permission and the page must be in the foreground. The manifest has permissions, but the APK has not been built/tested here.
- No geofencing confirms that the driver is actually near the declared route.

### Demo fleet

- Demo vehicles are simulated in the browser. Their stop positions are approximate, placed by hand for routes 01, 02, 04, 15 and 17, snapped to the nearest ground-level named road. Paths come from the public OSRM car router, routed leg by leg; where one-way streets would force a long loop the opposite direction is used, and about ten short hops that still looped are straight lines. They are not field data and must not be used as real stop locations.
- They are always labelled DEMO, are excluded from the AI's live counts, and are never stored or sent to the server.

### Sign-in

- Sign-in uses two published demo accounts. There is no sign-up, password reset, or per-person account, so anyone can use either role. It separates the interfaces and gates GPS start and AI use; it is not identity verification.
- Tokens are stateless and signed. Signing out removes the token from the browser, but a copied token stays valid until it expires (12 hours).

## 4. Persistence and scale

- The deployed API runs against MongoDB Atlas (persistent). Without `MONGODB_URI`, the app runs in **explicit non-persistent memory mode**. A server restart removes all sessions.
- Memory mode is a single-process `Map`. It is not shared across multiple server instances, serverless functions, or horizontal replicas.
- `memory-fallback` is used when MongoDB is configured but unreachable and `MONGODB_REQUIRED=false`. It is still non-persistent and labelled in the UI.
- The MongoDB schema, indexes, TTL, and queries are implemented and used by the deployed API, but the automated Atlas integration test was **skipped** because no `MONGODB_URI_TEST` was available.
- The TTL monitor is not instantaneous; expired sessions are filtered by queries immediately, but physical deletion can lag.
- The active list is capped at 100 vehicles. There is no pagination or clustering.
- No load test, capacity test, or multi-region test has been run.
- No backup/restore procedure is configured.

## 5. Meta AI

- The endpoint (`https://api.meta.ai/v1`) and model (`muse-spark-1.2-contributor`, pinned in `server/config.ts`) were verified through an authenticated model listing.
- **No real inference call was made** during automated testing, because no approval to consume provider credits was given. Answer quality, latency, refusal behaviour, and cost are unverified.
- The prompt is grounded in the route dataset and aggregate live counts, and an output guard rejects unknown route numbers. That does not guarantee factual correctness, tone, or safety.
- The AI can be wrong about directions, stop order, or whether a route is suitable. It is an assistance layer, not an authority.
- Function tools (`plan_trip`, `find_stop`) are only documented by third parties for `muse-spark-1.1`. If the pinned model rejects tools, the service falls back to the plain grounded prompt; the tool loop is tested only against a fake client.
- Voice input uses Meta's realtime ASR socket (`wss://api.meta.ai/v1/asr/realtime`). The handshake and event format follow LiteLLM's Meta integration because no first-party reference was available; it is tested only against a fake socket. Audio is paced in real time, so a 10-second question takes about 10 seconds to transcribe.
- The trip planner only links routes at stops with exactly the same name in the dataset. It does not add walking transfers, so some pairs (and spelling variants such as `এ কে খান মোড়` / `একে খান মোড়`) are not connected.
- Chittagonian (`ctg`) is **experimental**. The model may produce standard Bangla or an inconsistent mix; the UI says so. No native-speaker evaluation has been done.
- The AI receives the user's question text. Users should not type personal or sensitive information.
- The AI is rate-limited to 10 requests/minute per IP by default. Provider-side limits and billing can still change.
- `store: false` is a request flag; it is not a guarantee about provider-side retention. Review Meta's current terms before production.
- The assistant does not support images, voice, maps, turn-by-turn navigation, or live traffic.
- No conversation history is stored by this app.

## 6. Product scope

- No passenger accounts, login, saved trips, favourites, or notifications.
- No driver accounts or trip history.
- No fare calculation, payment, booking, seat reservation, or ETA.
- No demand insights. If added, they must be voluntary, aggregated, and privacy-preserving; no passenger location or individual trip history should be collected for them.
- No admin dashboard, moderation queue, or abuse reporting flow.
- No multi-language route-name translation; route and stop names remain Bangla.
- No offline map tiles. The map needs network access to OpenStreetMap.
- No native push notifications or background location.
- No iOS build/test.

## 7. Security and privacy

- No formal threat model, penetration test, or security audit.
- No static-host content security policy (CSP) is configured. Helmet covers API responses only.
- The frontend loads Google Fonts and OpenStreetMap tiles from third parties; those services see the viewer's IP and request metadata.
- The bearer session token is kept in JavaScript memory. XSS or a malicious extension could steal an active token.
- CORS is an allowlist, not authentication.
- Rate limits are per IP by default and can be bypassed with many IPs.
- There is no account-level ban, device binding, or revocation list beyond stop/expiry.
- No encryption is implemented at the application layer; TLS and Atlas encryption depend on deployment.
- No audit log of driver sessions; only aggregate request logs.
- No data-subject request workflow, privacy notice review, or lawful-basis analysis for a real deployment.
- The app does not collect passenger location, but the **driver's vehicle position is public** while live. That is a product privacy decision, not an accident.
- The map does not round coordinates.
- Server logs intentionally avoid bodies/tokens/coordinates, but hosting/proxy logs may differ.

## 8. Accessibility and UX

- Semantic HTML, labels, focus styles, skip link, live regions, and reduced-motion support are implemented.
- No screen-reader testing with NVDA/JAWS/VoiceOver has been performed.
- Colour contrast has not been formally audited.
- The Leaflet map is not fully keyboard-navigable; the textual vehicle list is the accessible fallback.
- Bangla typography depends on Google Fonts in this build; if the font request fails, the system fallback may look different.
- The UI is responsive at common breakpoints but has not been tested on a wide device matrix.
- Very long route names or unusual text zoom may cause wrapping that was not visually reviewed.

## 9. Platform and deployment

- The Android project exists under `android/`, and location/internet permissions were added to `AndroidManifest.xml`.
- **The APK was not built.** Java was not found and `ANDROID_HOME` was not set in this environment.
- The WebView geolocation flow has not been device-tested.
- The frontend production build is verified, but no static host, API host, TLS certificate, reverse proxy, or Atlas cluster was provisioned.
- `VITE_API_BASE_URL` must be set at build time for a separately hosted API. An empty value assumes the dev proxy.
- The backend runs TypeScript through `tsx`; there is no dedicated production compile/minify pipeline.
- No CI/CD pipeline, container image, infrastructure-as-code, or monitoring/alerting exists.
- No Git repository was initialized, and nothing was committed or pushed.
- No deployment or paid inference was performed without approval.

## 10. Hackathon and legal

- The public event page was found at `https://dev.meta.ai/events/global-hackathon`, but the official rules, waiver, eligibility criteria, submission format, judging rubric, and IP/ownership terms require login and have **not been confirmed**.
- Do not publish, license, or deploy until those terms are reviewed.
- No license file is included. Add one only after the IP terms are confirmed.
- The product name, branding, and route dataset ownership should be reviewed before a public launch.
- No user research, field trial, or transport-owner agreement has been completed.

## 11. Testing gaps

- Real Meta inference test: not run (cost approval).
- MongoDB Atlas integration test: skipped (no test URI).
- Two physical devices: not run.
- GPS denial/network-loss was exercised in headless Chrome with geolocation emulation and failed requests; a real phone test is still not run. Accuracy and background/battery behaviour remain untested on hardware.
- Android APK build/install: not run.
- Load, soak, and concurrency tests: not run.
- Security penetration test: not run.
- Cross-browser matrix: Chrome headless only.
- Screen-reader audit: not run.
- Production deployment smoke test: not run.

## 12. What would raise confidence most

1. Owner confirmation and field check of all 16 routes, especially Route 15's return.
2. A two-device field test with real GPS, permission denial, tunnel/network loss, and battery/background behaviour.
3. A test-only Atlas run of the MongoDB integration suite.
4. One approved real Meta inference test with a small question set and latency/cost measurement.
5. A static-host CSP, self-hosted fonts, and a reviewed tile-provider policy.
6. A load test with realistic concurrent drivers and map viewers.
7. A native Android build with foreground-only location behaviour and a device test.
8. Official hackathon rules review before submission.
