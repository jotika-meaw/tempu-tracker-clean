# Demo Script

**Target length:** 6–7 minutes
**Audience:** hackathon judges, product reviewers, transport stakeholders
**Primary language:** Bangla (switch to English only if the audience prefers it)

## 0. Pre-demo checklist

Run this 15 minutes before presenting.

- [ ] `server/.env` has the intended `MONGODB_URI` and `MODEL_API_KEY` (or deliberately no MongoDB for a memory-mode demo).
- [ ] `cd server && npm run dev` is running.
- [ ] From the project root, `npm run dev` is running.
- [ ] `http://localhost:3001/api/health` responds.
- [ ] The health banner matches what you will say (MongoDB connected, memory mode, or AI off).
- [ ] Driver device: location permission available; do **not** pre-grant it if you want to show the consent/permission moment.
- [ ] Passenger device/window: open `http://localhost:5173/#/map`.
- [ ] Close old driver sessions so the map starts empty.
- [ ] If you will call Meta AI live, confirm the owner approved provider usage. Otherwise skip the live AI question and show the configured status/error handling.
- [ ] Have a fallback screenshot or recorded clip if venue Wi-Fi fails.

**Honesty rule:** never point at a marker unless a real driver session is sending GPS. Never call the memory store durable. Never claim identity verification.

## 1. Opening (0:00–0:30)

> “Tempu Tracker চট্টগ্রামের টেম্পু যাত্রীর জন্য একটি বাংলা-প্রথম অ্যাপ। এখানে ১৬টি যাচাইকৃত রুট, ড্রাইভারের নিজের ডিভাইস GPS থেকে লাইভ গাড়ি, আর Meta AI সহায়তা আছে। আমরা ড্রাইভারের পরিচয় বা গাড়ির কাগজ যাচাই করি না — সেটি পরিষ্কারভাবে দেখানো হয়েছে।”

Show the passenger home. Point out the memory/MongoDB banner and the privacy footer.

## 2. Route search and data honesty (0:30–1:30)

1. Type `লালদীঘি` and search.
2. Show the matching routes and both directions.
3. Open the full route directory.
4. Open Route 15.
5. Point out:
   - The return direction is marked **আংশিক অনুমান**.
   - `আবদুস সাত্তার রোড` is listed as a **via road**, not a stop.
   - Route 09 is absent.
6. Search `রুট ১১`; show the route-11 result and its explicit return.
7. Optional: search `একে খান মোড়` and `একে খান গেট` to show they are distinct.

> “রুট ১৫-এর ফেরার শেষাংশ মূল তালিকা থেকে অনুমান করা হয়েছে। মালিকের নিশ্চিতকরণ ছাড়া আমরা এটিকে সম্পূর্ণ যাচাইকৃত বলছি না।”

## 3. Driver flow and genuine GPS (1:30–3:00)

Use the driver phone or a driver browser window.

1. From the passenger header, press **ড্রাইভার ড্যাশবোর্ড**.
2. Show the warning: driver identity and vehicle documents are not verified; no phone number or plate is collected.
3. Select:
   - Route `11`
   - Direction `যাওয়ার পথ`
   - Start/end stops (valid partial segment)
4. Show the selected segment preview.
5. Show the consent box and read the key sentence:
   > “আমার ডিভাইসের প্রকৃত অবস্থান যাত্রীদের ম্যাপে দেখানো হবে; ট্র্যাকিং বন্ধ করলে বা সেশন শেষ হলে অবস্থান মুছে যাবে।”
6. Tick consent, press **GPS ট্র্যাকিং শুরু করুন**.
7. Allow the browser location prompt.
8. Show the live card: session ID, last fix time, accuracy, expiry.
9. Point out that no coordinates, phone, or plate are displayed.

If permission is denied, keep it:

> “এটাই প্রত্যাশিত error state। ব্রাউজার অনুমতি ছাড়া কোনো অবস্থান যায় না।”

## 4. Passenger live map (3:00–4:00)

On the passenger device/window, open `#/map`.

1. Show the route-11 marker and the live count.
2. Open the marker popup: route, direction, segment, age, “driver identity not verified”.
3. Use the route filter.
4. Show the accessible vehicle list below the map.
5. Point out the privacy footer:
   - vehicle position comes from the driver's device;
   - passenger location is never collected;
   - stale positions are hidden.

If the driver used the **Open live map in a new tab** button, the driver tab is still tracking. After stopping tracking, return with **যাত্রী ভিউতে ফিরুন**. If you navigate away in the same tab while live, the session stops — explain that this is deliberate and use the new-tab flow next time.

## 5. Multi-vehicle check (optional, 4:00–4:30)

If a second device is available:

1. Start a second driver session on a different route (for example route `03`).
2. Show two independent markers.
3. Filter to one route.
4. Stop the second session; its marker disappears, the first remains.

Do not simulate a second vehicle with fake coordinates.

## 6. Meta AI assistant (4:30–5:45)

Open `#/assistant`.

- Select **বাংলা**.
- Ask: `রুট ১১-এ সিডিএ কীভাবে যাব?`
- Or use the sample question.

Explain:

> “AI শুধু ১৬টি যাচাইকৃত রুট এবং সামগ্রিক লাইভ সংখ্যা পায়। কোনো GPS স্থানাঙ্ক, টোকেন বা ব্যক্তিগত তথ্য পায় না। `MODEL_API_KEY` শুধু সার্ভারে থাকে।”

If inference is not approved:

- Do **not** send the question.
- Show the AI status card and the sample questions.
- Say: “AI endpoint ও মডেল যাচাই করা হয়েছে, কিন্তু এই ডেমোতে ইনফারেন্স খরচ এড়াতে প্রশ্ন পাঠাচ্ছি না।”

If AI is down/rate-limited, show the localized error banner and continue:

> “AI বন্ধ থাকলেও রুট খোঁজা ও লাইভ ম্যাপ কাজ করে।”

## 7. Privacy, reliability, and shutdown (5:45–6:30)

1. Return to the driver tab and press **ট্র্যাকিং বন্ধ করুন**.
2. Refresh the passenger map: the vehicle is gone.
3. Show the health banner:
   - memory mode → temporary, warned;
   - MongoDB connected → persistent;
   - database down → tracking unavailable but AI independent;
   - AI off → map/search still work.
4. Open the in-app privacy disclosure.

> “আমরা যাত্রীর অবস্থান সংগ্রহ করি না, ফোন/প্লেট চাই না, এবং ড্রাইভারের পরিচয় যাচাই করি না। সেশন টোকেন শুধু হ্যাশ করে রাখি।”

## 8. Close (6:30–7:00)

> “এটি একটি কাজ করা হ্যাকাথন প্রোটোটাইপ। পরের ধাপে রুট ১৫-এর মালিক-নিশ্চিতকরণ, আসল Atlas integration test, দুই-ডিভাইস ফিল্ড টেস্ট, Android build, এবং deployment security বাকি আছে।”

Invite questions. Keep the limitations slide ready.

## Q&A talking points

**“Is this live?”**
> “Only when a driver has consented and their device is sending GPS. Otherwise the map says no live vehicle.”

**“How do you verify drivers?”**
> “We don't. Identity and vehicle documents are out of scope; the UI says so. We only validate the journey shape, session, coordinates, and update rate.”

**“What if MongoDB is down?”**
> “Tracking fails closed or falls back to labelled memory mode depending on `MONGODB_REQUIRED`. AI stays independent.”

**“What if Meta AI is down?”**
> “The assistant shows a safe error; route search and the live map continue.”

**“Do you track passengers?”**
> “No. Passenger location is never requested or stored.”

**“Can GPS be spoofed?”**
> “Yes, a determined user can spoof browser GPS. We validate format, range, rate, and session isolation, not physical presence.”

**“Why is Route 15 partial?”**
> “The source says ‘আবদুস সাত্তার রোড হয়ে একই পথে’. We kept the explicit prefix, treated the road as a via-road, and inferred the tail. It needs owner confirmation.”

**“What about fares/ETA?”**
> “Not implemented. We do not invent them.”

## Failure fallbacks

| Failure | What to show | What to say |
| --- | --- | --- |
| Location denied | Driver permission error | “No location is sent without permission.” |
| GPS unavailable | Driver error state | “Move to an open area; no fake location is used.” |
| Network lost | Map offline banner / last known | “Old data is labelled last known, not live.” |
| Driver session expired | Driver session-expired message | “Sessions expire automatically.” |
| MongoDB down | Health banner | “Memory fallback is temporary; required mode fails closed.” |
| AI down | Assistant error banner | “Tracking and search are independent.” |
| No live vehicle | Map empty state | “No driver is sharing GPS right now.” |
| Venue Wi-Fi fails | Screenshots / recorded clip | Be explicit that it is a recording. |

## Do not do

- Do not seed a fake marker.
- Do not say “verified driver”.
- Do not say “live” for a stale snapshot.
- Do not show `.env`, a URI, a token, or a phone number.
- Do not call paid inference without approval.
- Do not claim route 15 is fully verified.
- Do not claim production security or scale.
