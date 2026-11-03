# 3-minute demo video script

**Length:** 3:00 (hard limit). **Narration:** English, so judges follow; the UI stays in Bangla.
**Live app:** https://tempu-tracker-client.vercel.app
**Demo accounts:** `passenger.demo` / `Tempu-Ride-2026` and `driver.demo` / `Tempu-Driver-2026`

## Before you record (5 minutes)

- Use a desktop browser at 1440×900 or similar, zoom 100%. Close other tabs and notifications.
- Open the live app once and sign out, so the recording starts on the login page.
- Make sure **ডেমো গাড়ি দেখান** (show demo vehicles) is ticked on the live map.
- Optional for 2:05–2:35: a phone with location on, signed in as `driver.demo`, ready to start tracking.
- Test the microphone once in the assistant so the browser does not ask for permission on camera.
- Record with OBS or the Xbox Game Bar (Win+Alt+R). Keep the cursor slow and deliberate.

## Shot list

| Time | Screen | What you do | What you say |
| --- | --- | --- | --- |
| 0:00–0:15 | Login page | Hover the hero and the three feature points. | "In Chattogram, tempus are how most people get around — 16 routes, three kinds of vehicles, and no app that tells you which one to take or where it is. Tempu Tracker fixes that, in Bangla." |
| 0:15–0:25 | Login page | Point at the two demo cards, click **যাত্রী হিসেবে ঢুকুন** (sign in as passenger). | "Passengers and drivers have separate accounts. For judging, both demo logins are right here." |
| 0:25–0:45 | Passenger home | Show the stats strip, then type **মুরাদপুর → টাইগারপাস** in the trip planner and press **পথ দেখুন**. | "Say I'm at Muradpur and need Tiger Pass. The planner works only from the verified route list — exact stops, and where to change tempu if I need to." |
| 0:45–1:00 | Trip result | Point at the dashed **ডেমো** line under the leg. | "Because no real drivers are signed up yet, the demo runs simulated vehicles, clearly marked DEMO. Here one is already at my stop." |
| 1:00–1:25 | Live map (sidebar → লাইভ ম্যাপ) | Let the pins glide for a few seconds. Click one pin to open its popup. Point at the legend. | "This is the live map. Each pin is the vehicle's real type — the long tempu, the diesel tempu, and the human hauler — with its route number. Demo pins have a dashed border and the DEMO tag, so nothing fake is ever passed off as real." |
| 1:25–1:55 | Assistant (sidebar → সহায়তা) | Click **বলে জিজ্ঞেস করুন**, say "লালদীঘি থেকে সিডিএ কীভাবে যাব?", stop, then send. | "Now the Meta AI part. I ask out loud in Bangla. Muse Voice turns my speech into text, and Muse Spark calls our trip-planning tool to answer from the verified routes — two changes, with the exact stops." |
| 1:55–2:05 | Assistant answer | Point at the `plan_trip` tool line under the answer. | "You can see it used the plan_trip tool, so the answer is grounded, not guessed." |
| 2:05–2:35 | Driver | Sign out, click **ড্রাইভার হিসেবে ঢুকুন**. Pick route 01, a start and end stop, choose **ডিজেল টেম্পু**, tick consent. If you have the phone ready, start tracking on the phone instead and show its pin appearing without the DEMO tag. | "Drivers get only the driver screen. They pick their route, the stops they cover, and their vehicle type, then share their phone's GPS with explicit consent. No phone number, no plate, nothing personal." |
| 2:35–2:50 | Driver → লাইভ ম্যাপ ↗ | Open the live map tab from the driver screen. | "Drivers see the same map passengers see." |
| 2:50–3:00 | Login hero or home hero | Hold on the hero. | "Tempu Tracker: verified routes, honest live tracking, and Meta AI that speaks Bangla — built for Chattogram." |

## Things to say only if asked, and never claim

- Demo vehicles are simulated in the browser on **approximate** paths between stops; they are not sent to the server and are always labelled.
- Driver identity and vehicle type are self-declared and not verified.
- No fares or arrival times are estimated.

## If something goes wrong while recording

- **Voice is slow or fails:** type the same question instead; the tool-calling answer is the important part.
- **The AI is rate limited:** wait a minute and retry; each passenger can ask about 10 questions a minute.
- **The map looks empty:** tick **ডেমো গাড়ি দেখান** in the map toolbar.
