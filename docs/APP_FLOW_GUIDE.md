# Tempu Tracker — full web app flow (desktop and mobile)

> **For ChatGPT:** this is a factual description of a working web app, written so you can draft a **3-minute screenplay and voice-over** for a hackathon demo video. Describe only what is listed here. Follow the **Rules for the voice-over** section exactly. The UI is in Bangla; English meanings are given in brackets. Narration should be in English.

---

## 1. What the product is

- **Name:** Tempu Tracker
- **Live URL:** https://tempu-tracker-client.vercel.app
- **Code:** https://github.com/jotika-meaw/tempu-tracker
- **Hackathon:** Meta Global AI Developer Hackathon 2026, **indie developer track** (judged on creativity, technical ambition, and whether it works). Theme: *Build for Your World*.
- **Problem:** In Chattogram, Bangladesh, shared three-wheelers and small vans called **tempus** are how most people get around. There are 16 numbered routes and three kinds of vehicles, but no app tells a passenger which route to take, where to change, or where a vehicle is right now — and most existing apps aren't in Bangla.
- **Solution:** A Bangla-first web app with separate passenger and driver sign-ins: a verified route list, a trip planner that tells you where to change tempu, a live map fed by drivers' own phone GPS, and a Meta AI assistant you can talk to in Bangla.

### Meta AI used (say these names correctly)

| Model | Where it is used | What it does |
| --- | --- | --- |
| **Muse Spark** (`muse-spark-1.2-contributor`, via Meta Model API) | Assistant screen | Answers travel questions. It **calls tools** — `plan_trip` and `find_stop` — over the verified route data, so answers are grounded, not guessed. The UI shows which tool was used. |
| **Muse Voice** (`muse-voice-transcribe-1.0`) | Assistant screen, microphone button | Turns a spoken Bangla question into text (push-to-talk, up to 20 seconds). The text appears in the box for the user to check before sending. |

### The three vehicle types (each has its own side-view icon)

| Bangla name | English | Look of the icon |
| --- | --- | --- |
| টেম্পু | Tempu (long) | Long green three-wheeler, open bench sides, yellow name panel with red zigzag paint, grey canopy |
| ডিজেল টেম্পু | Diesel tempu | Small green three-wheeler with a black canopy |
| হিউম্যান হলার | Human hauler | White four-wheel mini truck with a roof route board and red-green-yellow stripes |

### Visual style

Night bottle-green and marigold (tempu yellow) on warm paper. Bangla headings in Hind Siliguri. Rounded cards, soft shadows, gentle motion (cards rise in, vehicles glide). Vehicle icons are transparent and flip to face the direction they travel.

---

## 2. Demo accounts (shown on the login page)

| Role | Username | Password | What it opens |
| --- | --- | --- | --- |
| Driver | `driver.demo` | `Tempu-Driver-2026` | Only the driver tracking screen and a read-only live map |
| Passenger | `passenger.demo` | `Tempu-Ride-2026` | Only route search, trip planner, live map, and the AI assistant |

Each role sees only its own interface, even if it types the other role's URL. The server enforces this too: only a driver can start GPS sharing; only a passenger can use the AI.

---

## 3. Desktop flow (wide screen, 1280 px+)

### Layout at a glance

- **Login:** two columns — a large green hero panel on the left, sign-in and demo accounts on the right.
- **Passenger:** a fixed **night-green sidebar** on the left (logo, navigation, help card) and the main content on the right with a top bar.
- **Driver:** no sidebar; a full-width night-green top bar, then the driver content.

### D1. Login page (first screen)

- **Top bar:** tempu logo (a small tempu illustration), "tempu / লোকাল ট্রানজিট" (local transit), language switch **বাংলা / English** on the right.
- **Left — hero panel (dark green):**
  - Headline: **চট্টগ্রামের টেম্পু, এক নজরে।** (Chattogram's tempus, at a glance.)
  - Line: 16 verified routes, live tempus from drivers' own GPS, and Meta AI help in Bangla.
  - Three points with icons: trip planning that says where to change tempu · ask out loud in Bangla with Muse Voice · real GPS and demo vehicles always clearly marked.
  - A large tempu illustration that gently bobs above a dashed road line.
- **Right — sign-in card:** **Tempu Tracker-এ সাইন ইন** (Sign in), username, password, green **সাইন ইন** button.
- **Right — demo accounts card:** **ডেমো অ্যাকাউন্ট** with two cards:
  - **ড্রাইভার** (Driver) — steering icon, username and password shown, button **ড্রাইভার হিসেবে ঢুকুন** (Sign in as driver).
  - **যাত্রী** (Passenger) — person icon, username and password shown, button **যাত্রী হিসেবে ঢুকুন** (Sign in as passenger).
  - Note: demo accounts only; no sign-up; driver identity is not verified.
- Cards lift slightly on hover. One click on a demo button signs straight in.

### D2. Passenger — home ("রুট খুঁজুন", Find a route)

- **Sidebar:** logo; menu **যাত্রী** (Passenger) with three items — **রুট খুঁজুন** (Find a route), **লাইভ ম্যাপ** (Live map), **সহায়তা** (Assistant). The active item glows marigold. At the bottom, a help card **সহায়তা দরকার?** with **সহায়তা নিন** (Ask the assistant).
- **Top bar:** breadcrumb "Tempu Tracker / রুট খুঁজুন", language switch, city label **চট্টগ্রাম, বাংলাদেশ**, **সাইন আউট** (Sign out) button, round user avatar.
- **Status strip:** **সব সেবা সচল** (All services operational) — database and Meta AI connected.
- **Hero card (dark green, full width):**
  - Headline **চট্টগ্রামের টেম্পু রুট, সহজে খুঁজে নিন।** (Chattogram tempu routes, easy to find), with the second line in marigold.
  - A tempu illustration on a road with two floating stop tags (লালদীঘি, জিইসি).
  - **Stats strip:** **এখন লাইভ টেম্পু** (Tempus live now) with the real count and a yellow **+20টি ডেমো** (+20 demo) badge · **যাচাইকৃত রুট 16** (16 verified routes) · **স্টপ 93** (93 stops).
- **Search card — কোথায় যেতে চান?** (Where are you heading?): a text box (stop name, route number, or route name) and a **রুট খুঁজুন** button. Under it, **জনপ্রিয় স্টপ** (Popular stops) chips: লালদীঘি, জিইসি, কোতোয়ালী মোড়, বহদ্দারহাট. Clicking a chip searches immediately.
- **Search results** (appear after a search): one card per matching route with a yellow route-number badge, route name, and both directions as stop chips; matching stops are highlighted green.
- **Trip planner card — যাত্রা পরিকল্পনা** (Trip planner):
  - Fields **কোথা থেকে** (From) and **কোথায়** (To), with autocomplete from the 93 verified stops, a swap button ⇅, and **পথ দেখুন** (Show trip).
  - Results: option cards labelled **সরাসরি** (Direct) or **১ বার বদল / ২ বার বদল** (1 or 2 changes), with the stop count. Each leg says "রুট 01 ধরুন (যাওয়ার পথ) — মুরাদপুর থেকে টাইগারপাস" (take route 01, outbound, from Muradpur to Tiger Pass), lists every stop in between, and shows a marigold **…-এ নেমে টেম্পু বদলান** (get off at … and change tempu) chip at each change.
  - **Demo hint under each leg (dashed yellow box):** e.g. **ডেমো: একটি ডিজেল টেম্পু ৩ স্টপ দূরে** (Demo: a diesel tempu is 3 stops away) or **…এখন মুরাদপুর-এ** (…is at Muradpur now), with the vehicle's icon. Updates every 2 seconds.
  - If a name is ambiguous (e.g. "একে খান"), it offers the exact stop names to pick from.
  - Good demo inputs: **মুরাদপুর → টাইগারপাস** (direct on route 01), **মুরাদপুর → লালদীঘি** (direct on route 15), **লালদীঘি → সিডিএ** (two changes: 03 → 13 → 11).
- **Lower grid:** a compact **লাইভ ম্যাপ** card with **বড় ম্যাপ খুলুন** (Open full map), and on the right the AI assistant card plus a travel-confidence note.
- **Route directory:** all 16 routes, expandable, with both directions. Route 09 does not exist (correct). Route 15's return is marked **আংশিক অনুমান** (partially inferred).
- **Footer:** privacy notes (no phone numbers, no passenger location).

### D3. Passenger — live map ("লাইভ ম্যাপ")

- **Heading:** **লাইভ টেম্পু ম্যাপ** (Live tempu map), with a subtitle saying vehicles appear when drivers share GPS and demo vehicles are always marked separately. Yellow counter on the right.
- **Big rounded map** (OpenStreetMap tiles of Chattogram):
  - **Floating toolbar** at the top: **রুট ফিল্টার** (Route filter) dropdown — **সব রুট** (All routes) or one route; **রিফ্রেশ** (Refresh); checkbox **ডেমো গাড়ি দেখান** (Show demo vehicles).
  - **Zoom buttons** on the left.
  - **Vehicles:** transparent side-view icons of the three vehicle types, each with a small dark route-number badge (01, 02, 04, 15, 17). They glide smoothly along the streets and flip to face their direction of travel.
  - **Demo vehicles:** a yellow **DEMO** tag on each and a dashed yellow ground shadow. **20 demo vehicles**, two per direction, on routes 01, 02, 04, 15 and 17. They drive from the first stop to the last, wait about 20 seconds, then start again.
  - **Route lines:** the five demo routes are drawn as soft green lines along real streets, and the vehicles run along them.
  - **Bottom-left notice (dashed yellow):** **ডেমো সিমুলেশন — আনুমানিক পথে চলা নমুনা গাড়ি, আসল নয়** (Demo simulation — sample vehicles on approximate paths, not real).
  - **Bottom-right chip (dark green):** **০টি গাড়ি লাইভ** (0 live vehicles) plus a yellow **+২০টি ডেমো** (+20 demo).
  - **Click a vehicle → popup:** DEMO tag (if demo), route number and name, direction and end stops, vehicle type, **পরের স্টপ: …** (Next stop), and "ডেমো সিমুলেশন — আসল গাড়ি নয়" (not a real vehicle). A real vehicle's popup shows instead its last-update age, "driver's device GPS", and "identity not verified".
- **Legend under the map:** the three vehicle icons with names — টেম্পু · ডিজেল টেম্পু · হিউম্যান হলার.
- **Vehicle list — গাড়ির তালিকা:** one card per vehicle with its icon, route badge, route name, type and direction, a **ডেমো** tag (dashed border) for demo vehicles, and the next stop. Real vehicles show accuracy and last update time instead.
- Real driver GPS pins appear alongside demo ones **without** the DEMO tag. Positions older than 30 seconds disappear.

### D4. Passenger — assistant ("সহায়তা")

- **Card: আপনার ট্রাভেল সহায়তা** (Your travel assistant), with a dark **Meta AI** badge.
- **উত্তরের ভাষা** (Answer language): বাংলা · English · চাটগাঁইয়া (পরীক্ষামূলক) (Chittagonian, experimental).
- **Question box** with a character counter, a green-outlined **🎙 বলে জিজ্ঞেস করুন** (Ask by voice) button, and a **পাঠান ↑** (Send) button.
- **Voice flow:** click the mic → it turns red, **থামান ও লিখুন** (Stop and transcribe), with "শুনছি…" (Listening…) and a 20-second limit → click again → "Muse Voice লেখায় রূপান্তর করছে…" (Muse Voice is transcribing…) for a few seconds → the transcript appears in the box with "check it before sending" → press Send.
- **Sample questions** (rounded chips): রুট ১১-এ সিডিএ কীভাবে যাব? · লালদীঘি থেকে কোন রুটে যাওয়া যায়? · রুট ১৫-এর ফেরার পথ কী?
- **Answer area:** **সহায়তার উত্তর** (Assistant's answer) in plain Bangla with numbered steps, e.g. for "লালদীঘি থেকে সিডিএ কীভাবে যাব?" it explains two changes: route 03 → 13 → 11, with the exact change stops. Below the answer: **যাচাইকৃত রুট টুল ব্যবহার করেছে: plan_trip** (Used verified route tools: plan_trip) and **মডেল: muse-spark-1.2-contributor**.
- An answer takes roughly 5–8 seconds. Side panels explain how the AI answers (verified routes and aggregate live counts only; no fares, arrival times, or exact positions) and show AI status.

### D5. Driver — tracking screen

- **Top bar (night green):** logo, language switch, city, **সাইন আউট** (Sign out). There is **no passenger navigation**.
- **Under the top bar:** a button **লাইভ ম্যাপ ↗** (Live map, opens in a new tab so GPS keeps running) and the text **Demo driver হিসেবে সাইন ইন** (signed in as Demo driver).
- A green notice: you're in driver mode; passengers can't see this screen; your device's real GPS is sent only with your consent.
- **Hero heading (dark green):** **ড্রাইভার ট্র্যাকিং** (Driver tracking), with a tempu illustration on the right.
- An identity notice: phone numbers, plates and documents are not checked; the route is self-declared.
- **Form card — আপনার যাত্রাপথ** (Your journey):
  1. **রুট** (Route) dropdown — 16 routes.
  2. **দিক** (Direction) — যাওয়ার পথ (outbound) / ফেরার পথ (return).
  3. **শুরুর স্টপ** (Starting stop) and **শেষের স্টপ** (Ending stop) — only valid stops in order; a stop-chip preview shows the selected segment highlighted.
  4. **আপনার গাড়ির ধরন** (Your vehicle type) — three large picture cards: টেম্পু, ডিজেল টেম্পু, হিউম্যান হলার. The selected one gets a green border and a ✓. Note: passengers see this icon; the type is self-declared.
  5. **GPS শেয়ার করার সম্মতি** (Consent to share GPS) box with a checkbox **আমি সম্মতি দিচ্ছি** (I consent).
  6. Big green **GPS ট্র্যাকিং শুরু করুন** (Start GPS tracking). The browser asks for location permission.
- **While live:** a side card **ট্র্যাকিং চালু আছে** (Tracking is live) with the chosen vehicle icon, session ID, **সর্বশেষ GPS** (last GPS fix) time, **নির্ভুলতা** (accuracy in metres), last update, and expiry. A red **ট্র্যাকিং বন্ধ করুন** (Stop tracking) button. Updates are sent about every 5 seconds. The vehicle then appears on every passenger's map **without** a DEMO tag.
- A privacy card explains what is shared (position only, no phone number or identity).

### D6. Driver — live map (new tab)

The same map as D3 inside the driver layout, with a **← ট্র্যাকিং** (Tracking) button to go back. Shows demo vehicles and any real drivers.

---

## 4. Mobile flow (phone, about 375–430 px wide)

### Layout differences

- **No sidebar.** Passengers get a **floating bottom tab bar** (dark green, rounded): **রুট খুঁজুন** · **লাইভ ম্যাপ** · **সহায়তা**, each with an icon; the active tab glows marigold.
- **Top bar is compact:** language switch and an icon-only sign-out button; the city label is hidden.
- Cards stack in one column with 16 px side margins; nothing scrolls sideways.

### M1. Login

The hero panel goes on top (headline, three points, smaller tempu illustration), then the sign-in card, then the demo accounts stacked one above the other, each with its one-tap button.

### M2. Passenger home

Hero with the stats strip as three small tiles in a row (live + demo badge, 16 routes, 93 stops). Search card with full-width input and button. Trip planner fields stack vertically (From, swap, To, Show trip). Results and demo hints are full width. The bottom tab bar stays visible.

### M3. Live map

The map fills most of the screen (about 62% of the height). The filter bar floats in one row at the top (dropdown, refresh, demo checkbox). Zoom buttons sit below it. The demo notice spans the bottom, above the live chip. The vehicle list follows below the map. Pinch to zoom; tap a vehicle for its popup.

### M4. Assistant

Full-width card. The mic button sits next to the character counter. Tapping the mic asks for microphone permission the first time. The answer appears below the box.

### M5. Driver (on a phone — the real use case)

- **Top bar:** logo, language, sign-out icon. **No bottom tabs** (drivers have one job).
- The driver hero has the tempu illustration below the text.
- The form is a single column. The vehicle-type picker is three compact cards in a row (icons and names; hints hidden).
- Start tracking → the phone asks for location → the live card shows GPS time and accuracy. Keep the tab open; **লাইভ ম্যাপ ↗** opens the map in another tab without stopping tracking.

---

## 5. Two-device "money shot" (optional but strongest)

1. **Phone:** sign in as `driver.demo`, pick **রুট 01**, outbound, any start and end stops, **ডিজেল টেম্পু**, tick consent, **GPS ট্র্যাকিং শুরু করুন**.
2. **Laptop:** sign in as `passenger.demo`, open **লাইভ ম্যাপ**. Within about 5 seconds a diesel tempu with route badge **01** appears at the phone's real location — **with no DEMO tag**, beside the tagged demo fleet. The counter changes to **১টি গাড়ি লাইভ**.
3. Walk with the phone and the pin moves. Press **ট্র্যাকিং বন্ধ করুন** and it disappears.

---

## 6. Rules for the voice-over (must follow)

- **Always call demo vehicles demo or simulated.** Never imply they are real tempus or real drivers. Say they exist because no drivers have signed up yet.
- Demo stop positions and paths are **approximate**; don't claim real-world accuracy.
- **Don't claim** fares, arrival times (ETA), seat availability, or traffic — the app deliberately doesn't estimate them.
- **Don't claim** verified driver identity; drivers and vehicle types are self-declared.
- The route list is the 16 supplied routes; route 09 doesn't exist.
- Name the Meta models correctly: **Muse Spark** (answers with tool calling) and **Muse Voice** (Bangla speech-to-text). Keep "Meta Model API" if mentioning the platform.
- No passenger location is ever collected; drivers share GPS only with explicit consent.
- The video must be **3:00 or less**.

---

## 7. Suggested beats (ChatGPT may reorder)

| Beat | Approx. time | Screen |
| --- | --- | --- |
| Problem and promise | 0:00–0:15 | D1 login hero |
| Separate roles, one-click demo login | 0:15–0:25 | D1 demo accounts |
| Trip planner + demo "stops away" hint | 0:25–1:00 | D2 |
| Live map: three vehicle types following streets, DEMO labels, legend | 1:00–1:25 | D3 (zoom in two steps around Chawkbazar or Laldighi) |
| Ask by voice in Bangla → Muse Voice → Muse Spark tool call (`plan_trip`) | 1:25–2:05 | D4 |
| Driver flow: route, stops, vehicle type, consent, start | 2:05–2:35 | D5, or M5 on a phone, ideally section 5 |
| Mobile glimpse + close | 2:35–3:00 | M2/M3 on a phone, then the hero |

Recording tips: desktop at 1440×900, zoom 100%. Sign out first so the video starts on the login page. Test the microphone once beforehand so no permission prompt appears on camera. If the AI is slow, cut the wait in editing. If voice fails, type the question — the tool-calling answer is the key moment.
