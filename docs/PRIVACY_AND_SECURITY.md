# Privacy and Security

## 1. Privacy summary

Tempu Tracker collects the minimum needed to show a driver-shared vehicle position. It does **not** collect passenger location, passenger accounts, phone numbers, plate numbers, driver identity documents, or contact lists.

| Data | Collected? | Purpose | Retention |
| --- | --- | --- | --- |
| Driver device latitude/longitude | Yes, after explicit consent | Show the vehicle on the live map | Session TTL; deleted on stop; hidden when stale |
| GPS accuracy | Optional | Display/quality only | Same as location |
| Route, direction, start/end stop | Yes, self-declared | Label the vehicle and validate the journey | Same as session |
| Session token | Returned once to the driver browser | Authenticate location updates | Stored only as SHA-256 hash server-side |
| Consent version | Yes (`demo-v1`) | Record that consent was required | Same as session |
| Passenger location | **No** | Not needed | — |
| Phone number / plate / identity | **No** | Not implemented | — |
| AI question text | Yes, when the user asks | Generate an answer | Sent to Meta for inference; not stored by this app |
| AI answer | Returned to the browser | Display | Not stored by this app |
| UI language preference | Yes, `localStorage` | Keep Bangla/English choice | Until browser storage is cleared |
| Analytics / advertising IDs | **No** | — | — |

There is no fake live data. If no driver is sharing GPS, the map says there are no live vehicles.

## 2. Consent and driver transparency

- The driver must tick an explicit consent checkbox before the first GPS fix is requested.
- The server also rejects `/tracking/start` unless `consent === true` (`CONSENT_REQUIRED`).
- Consent version `demo-v1` is stored with the session.
- The consent text explains: real device location is shown to passengers, stale positions are hidden, and stopping/expiry deletes the position.
- The driver UI does not display coordinates, phone, plate, or claimed identity.
- The UI states clearly that driver identity and vehicle documents are not verified.
- Navigating away from the driver view in the same tab unmounts the panel and stops the session. The “Open live map” action opens a new tab so the driver tab can remain mounted.

Consent is not a substitute for a production legal basis. A real deployment needs a reviewed privacy notice, lawful basis, data-processing agreement, and platform-permission disclosures.

## 3. Location exposure

- **Driver/vehicle position is intentionally public** while the session is live. It is shown to anyone who can reach the map. It is not a passenger location.
- Coordinates are stored and returned at the precision reported by the browser GPS; they are not rounded. GPS accuracy is shown so users can see uncertainty.
- **Passenger location is never requested.** The map starts at a fixed Chattogram center, not at the viewer's position.
- The `/api/tracking/active` response contains no token, token hash, consent record, phone, plate, or database identifier.
- Public vehicle IDs are random 8-byte base64url values. They are not sequential and contain no personal data.

## 4. Session-token design

```text
sessionToken = randomBytes(32).toString("base64url")   // 43 chars
tokenHash    = SHA-256(sessionToken)                  // 64 hex chars
```

- The raw token is returned only in the `/tracking/start` response.
- The browser keeps it in a React ref (JavaScript memory), not in `localStorage`, `sessionStorage`, cookies, or the URL.
- The token is sent only in `Authorization: Bearer <token>`.
- The server stores only the hash. A database read does not reveal a usable token.
- `/tracking/stop` deletes the session by hash. Repeated stops return `204`.
- Expired sessions are rejected by queries immediately and removed by the MongoDB TTL monitor.

Limitations:

- JavaScript memory is not a secure enclave. XSS in the frontend could read the token while tracking is active.
- A compromised device or malicious browser extension can also access it.
- The token is a bearer credential: anyone who obtains it can update that one session until it expires.
- There is no driver account, refresh token, device binding, or revocation list beyond deletion/TTL.

## 5. Server-side validation

All tracking input is parsed by `server/validation.ts`:

- Start request must be a plain JSON object.
- Consent must be exactly `true`.
- Route must be one of the 16 verified routes.
- Direction must be `outbound` or `return`.
- Start/end must be integer indices, in range, distinct, and correctly ordered.
- Latitude must be finite and within `[-90, 90]`.
- Longitude must be finite and within `[-180, 180]`.
- Accuracy, if present, must be finite and within `[0, 100000]` metres.
- Bearer token must match a 43-character base64url shape before hashing.
- Route filters must be one of the verified routes.
- AI questions must be 1–1000 characters and free of control characters.
- AI language must be `bn`, `en`, or `ctg`.
- JSON bodies are limited to 16 KB.

Additional server controls:

- Per-session update interval (default 3 s) returns `429 UPDATE_TOO_FREQUENT`.
- Global `/api` limit: 300 requests/minute.
- Tracking start limit: 10/minute.
- Location updates: 240/minute.
- Active map reads: 120/minute.
- AI requests: 10/minute.
- MongoDB unique indexes on `tokenHash` and `publicId`.
- MongoDB JSON schema validation with `validationAction: "error"`.
- Atomic `findOneAndUpdate` prevents two concurrent updates from both winning.
- Public active list is capped at 100 vehicles.

## 6. Network and API security

- `helmet` sets security headers on API responses; `x-powered-by` is disabled.
- CORS is an explicit allowlist, not `*`. Requests without an `Origin` (e.g. server-to-server) are allowed; browser origins not on the list receive `403 CORS_NOT_ALLOWED`.
- `Cache-Control: no-store` is set for every `/api` response.
- Error responses use stable codes and do not expose stack traces, connection strings, or secrets.
- The Meta API key is read from `server/.env` and is never sent to the browser or included in health output.
- The frontend uses relative `/api` in development; no secret is placed in a `VITE_*` variable.
- `TRUST_PROXY` defaults to `false`; enable it only behind a proxy you control.

CORS is **not** authentication. The Bearer token is the authorization mechanism for a driver session. Any client that obtains a valid token can update that session.

## 7. MongoDB controls

When `MONGODB_URI` is configured:

- Official `mongodb` Node driver.
- Connection selection/connect timeouts and a bounded pool (`maxPoolSize: 10`).
- TLS is provided by the Atlas connection string; do not disable certificate validation.
- Collection validator is strict; application validation is still authoritative.
- Unique indexes prevent token/public-ID collisions.
- TTL index on `expiresAt` removes sessions after expiry.
- Map queries filter by `status`, `expiresAt`, and `lastLocationAt`.
- Stop deletes the document rather than marking it public.
- Health checks run `ping` with a 2-second timeout and return only status/latency/error code.
- The URI is never logged by the application.

Operational recommendations:

- Use a dedicated Atlas database user with only the required database permissions.
- Restrict network access with Atlas IP access lists or private endpoints.
- Enable Atlas audit logging/alerts where available.
- Rotate credentials if a URI is exposed.
- Do not use the same database user for unrelated apps.
- Backups are not configured by this project; decide retention before production.

## 8. AI privacy

What the AI receives:

- The user's question text.
- The answer language.
- Verified route names and stop lists.
- Aggregate live counts: total fresh sessions and count per route.
- A note that precise coordinates are intentionally excluded.

What the AI does **not** receive:

- Latitude/longitude.
- Session tokens or hashes.
- Public vehicle IDs.
- Driver identity, phone, plate, or passenger data.
- Database URIs or API keys.

The request sets `store: false`. This is a provider-side request flag, not a guarantee about the provider's independent retention practices; review Meta's current API terms before production.

Voice input: the browser records only after the user presses the voice button and grants microphone permission, stops after at most 20 seconds, and sends the audio once to `/api/transcribe`. The server streams it to Meta's Muse Voice service and returns the transcript; audio is not written to disk, logged, or stored in MongoDB. The transcript is shown to the user for review before anything is sent to the assistant.

Route tools: `plan_trip` and `find_stop` read only the static route dataset. They cannot read tracking sessions, coordinates, or tokens.

Users should not type personal or sensitive information into the assistant. The app does not redact question text. The output guard checks route numbers and answer size, but it cannot guarantee factual correctness or prevent all unsafe content.

## 9. Third-party requests

The browser may contact:

- **OpenStreetMap tile servers** for map tiles. These receive the viewer's IP address, user agent, and tile coordinates.
- **Google Fonts** (`fonts.googleapis.com`, `fonts.gstatic.com`) because `App.css` imports DM Sans and Noto Sans Bengali. Google receives the viewer's IP address and font request metadata.
- **The configured API origin** for `/api` requests.

There is no analytics, advertising, or social embed.

For a privacy-sensitive deployment, self-host the fonts and choose a tile provider with an appropriate policy or a self-hosted tile server. Update this document and the in-app privacy notice if you do.

## 10. Logging

The API logs:

- HTTP method, path, status code, and duration.
- Startup warning describing the storage mode (memory/memory-fallback), without the URI.
- AI configuration status and model name, without the API key.
- Unhandled error **names** only.

It does not intentionally log request bodies, bearer tokens, coordinates, phone numbers, or AI questions. Reverse proxies and hosting platforms may log more; configure them deliberately.

## 11. Known security gaps

These are real gaps, not “future work” claims:

1. **No driver authentication or verification.** Anyone can declare a route and share a position. The UI says so.
2. **No protection against GPS spoofing.** The server validates format/range/rate, not physical presence.
3. **No content security policy for the static frontend.** Helmet covers API responses only. Add a CSP at the static host/CDN before production.
4. **Bearer token in JavaScript memory.** XSS could steal an active token.
5. **No account-level abuse controls.** Rate limits are per IP by default and can be bypassed with many IPs.
6. **No malware/abuse review of AI output.** The guard is narrow.
7. **No formal penetration test, load test, or threat-model review.**
8. **No encryption at the application layer.** TLS and Atlas encryption depend on deployment configuration.
9. **No audit trail for driver sessions.** Only aggregate request logs exist.
10. **Memory mode is not isolated across processes.** It is for local demo only.
11. **Android build is unverified.** Manifest permissions are present, but the APK has not been built or device-tested here.
12. **No data-subject request workflow.** A production service needs one.

## 12. Deployment checklist

Before public deployment:

- [ ] Use HTTPS for the frontend and API.
- [ ] Set `CORS_ORIGINS` to exact production origins; never `*`.
- [ ] Set `TRUST_PROXY=true` only behind a trusted proxy.
- [ ] Use a dedicated Atlas user and restricted network access.
- [ ] Set `MONGODB_REQUIRED=true` if persistence is a product promise.
- [ ] Add a strict CSP, HSTS, and frame protections at the static host.
- [ ] Self-host fonts and review the tile-provider policy.
- [ ] Add privacy notice, terms, contact, and retention statement.
- [ ] Decide whether public vehicle positions are acceptable for the launch area.
- [ ] Add monitoring/alerts for API errors, Mongo health, and AI failures.
- [ ] Rotate any credential that was ever committed or pasted into a public channel.
- [ ] Run a real two-device test, GPS-denial test, network-loss test, and load test.
- [ ] Confirm hackathon IP/submission rules before publishing or licensing.

## 13. Reporting a security issue

Do not open a public issue containing a secret, database URI, token, or personal data. Contact the project owner privately, rotate the affected credential, and preserve only the minimum evidence needed. This repository does not yet define a formal security contact or SLA.
