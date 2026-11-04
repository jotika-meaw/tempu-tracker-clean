import type { UiLanguage } from "../i18n";

/**
 * English display names for the Bangla place names in shared/routes.ts. The
 * Bangla strings stay the data keys (validation, trip planning, demo paths and
 * the API all compare them), so these are only ever used for showing a name or
 * for reading one back from an English search box.
 */
const PLACE_NAMES_EN: Record<string, string> = {
  "অক্সিজেন": "Oxygen",
  "অক্সিজেন মোড়": "Oxygen Mor",
  "অলংকার": "Alankar",
  "অলংকার মোড়": "Alankar Mor",
  "আখতার অটোমোবাইল": "Akhtar Automobile",
  "আতুরার ডিপো": "Aturar Depot",
  "আন্দরকিল্লা": "Anderkilla",
  "আবদুস সাত্তার রোড": "Abdus Sattar Road",
  "আমতল": "Amtal",
  "আমবাগান পাহাড়তলী": "Ambagan Pahartali",
  "আমান বাজার": "Aman Bazar",
  "আলমাস সিনেমা": "Almas Cinema",
  "ঈদগাঁ কাঁচা রাস্তার মাথা": "Idgah Kacha Rastar Matha",
  "ঈদগাঁ কাঁচাবাজার": "Idgah Kacha Bazar",
  "এ কে খান মোড়": "A K Khan Mor",
  "একে খান গেট": "AK Khan Gate",
  "একে খান মোড়": "AK Khan Mor",
  "ওয়াসা": "WASA",
  "ওয়াসার মোড়": "WASA Mor",
  "কদমতলী": "Kadamtali",
  "কর্ণফুলী ব্রিজ": "Karnaphuli Bridge",
  "কর্ণফুলী ব্রিজ (ব্রিজের ২০০ গজ আগে)": "Karnaphuli Bridge (200 yards before the bridge)",
  "কর্ণেলহাট": "Colonelhat",
  "কাজীর দেউড়ী": "Kazir Dewri",
  "কাতালগঞ্জ": "Katalganj",
  "কানুনগোপাড়া": "Kanungopara",
  "কাপাসগোলা": "Kapasgola",
  "কাপ্তাই রাস্তার মাথা": "Kaptai Rastar Matha",
  "কালারপোল বাজার": "Kalarpol Bazar",
  "কালুরঘাট": "Kalurghat",
  "কালুরঘাট ব্রিজ": "Kalurghat Bridge",
  "কোতোয়ালী": "Kotwali",
  "কোতোয়ালী মোড়": "Kotwali Mor",
  "গণি বেকারী": "Gani Bakery",
  "গরিবুল্লাহ শাহ মাজার": "Garibullah Shah Mazar",
  "গুলজার সিনেমা": "Gulzar Cinema",
  "চকবাজার": "Chawkbazar",
  "চট্টগ্রাম মেডিকেল": "Chattogram Medical",
  "চট্টগ্রাম মেডিকেল গেট": "Chattogram Medical Gate",
  "চন্দনপুরা": "Chandanpura",
  "চান্দগাঁও": "Chandgaon",
  "চান্দগাঁও আবাসিক": "Chandgaon Residential Area",
  "চামড়া গুদাম": "Chamra Gudam",
  "চেরাগী পাহাড়": "Cheragi Pahar",
  "চৌমুহনী": "Chowmuhani",
  "ছোটপুল": "Chhotopul",
  "ছোটপুল পুলিশ লাইন": "Chhotopul Police Line",
  "জামালখান": "Jamalkhan",
  "জালিয়াপাড়া": "Jaliapara",
  "জিইসি": "GEC",
  "জিইসি মোড়": "GEC Mor",
  "টাইগারপাস": "Tiger Pass",
  "তালতলা": "Taltala",
  "তেলিপট্টি": "Telipatti",
  "দেওয়ানহাট": "Dewanhat",
  "নজির আহমদ চৌধুরী রোড": "Nazir Ahmed Chowdhury Road",
  "নয়া বাজার": "Naya Bazar",
  "নিউমার্কেট": "New Market",
  "নিমতলা": "Nimtala",
  "পাকা রাস্তার মাথা (লতিফপুর)": "Paka Rastar Matha (Latifpur)",
  "পাঁচলাইশ থানা": "Panchlaish Thana",
  "পাহাড়তলী আলম বিড়ি ফ্যাক্টরি": "Pahartali Alam Bidi Factory",
  "প্রবর্তক মোড়": "Probortak Mor",
  "ফইল্লাতলী বাজার": "Foillatoli Bazar",
  "ফকিরহাট": "Fakirhat",
  "ফকিরহাট ওভারব্রিজের ২০০ গজ পিছনে": "200 yards behind Fakirhat Overbridge",
  "ফতেহাবাদ": "Fatehabad",
  "ফয়েজ লেক": "Foy's Lake",
  "ফিরিঙ্গিবাজার মেরিন ড্রাইভ রোড": "Firingi Bazar Marine Drive Road",
  "বক্সিরহাট বিট": "Bakshirhat Beat",
  "বড়পুল": "Barapul",
  "বহদ্দারপাড়া": "Bahaddarpara",
  "বহদ্দারহাট": "Bahaddarhat",
  "বহদ্দারহাট বাস টার্মিনাল": "Bahaddarhat Bus Terminal",
  "বায়েজিদ বোস্তামী": "Bayezid Bostami",
  "বারেক বিল্ডিং": "Barek Building",
  "বারেক বিল্ডিং মোড়": "Barek Building Mor",
  "বি ব্লক বাস স্টেশন": "B Block Bus Station",
  "বিআরটিসি মোড়": "BRTC Mor",
  "বিটাক": "BITAC",
  "বিটাক রেলওয়ে একাডেমি": "BITAC Railway Academy",
  "বিশ্বকলোনি রাস্তার মাথা": "Biswa Colony Rastar Matha",
  "বিশ্বরোড": "Biswa Road",
  "বোয়ালখালী উপজেলা সদর": "Boalkhali Upazila Sadar",
  "বৌদ্ধ মন্দির": "Buddhist Temple",
  "মদুনাঘাট": "Madunaghat",
  "মনসুরাবাদ": "Mansurabad",
  "মাদারীপুল": "Madaripul",
  "মুরাদপুর": "Muradpur",
  "রাহাত্তার পুল": "Rahattar Pul",
  "লালদীঘি": "Lal Dighi",
  "শাহ আমানত ব্রিজ": "Shah Amanat Bridge",
  "ষোলশহর ২নং গেট": "Sholoshahar 2 No. Gate",
  "সাগরপাড় বাইপাস": "Sagarpar Bypass",
  "সাগরপাড় বাইপাস সড়ক": "Sagarpar Bypass Road",
  "সাগরিকা": "Sagarika",
  "সাবএরিয়া": "Sub Area",
  "সিটি গেট": "City Gate",
  "সিডিএ": "CDA",
  "সিডিএ মার্কেট": "CDA Market",
  "স্টেশন রোড": "Station Road",
  "হযরত শাহ আমানত ব্রিজের পশ্চিম পাড়": "West side of Hazrat Shah Amanat Bridge",
  "হালিশহর বাস স্ট্যান্ড": "Halishahar Bus Stand",
};

const ROUTE_NOTES_EN: Record<string, string> = {
  "একই পথে — বিপরীত ক্রমে ফিরতি পথ": "Returns along the same path, in reverse order",
  "ফেরার শেষাংশ মূল তালিকা থেকে অনুমান করা হয়েছে; ‘আবদুস সাত্তার রোড’ একটি via-road, stop নয়। Owner confirmation required.":
    "The last part of the return is inferred from the main list; ‘Abdus Sattar Road’ is a via road, not a stop. Owner confirmation required.",
};

const ROUTE_NAME_SEPARATOR = " – ";

/** Bangla letters such as ড় and য় have two Unicode spellings. */
function normalizedMap(entries: Record<string, string>): Map<string, string> {
  return new Map(
    Object.entries(entries).map(([bangla, english]) => [bangla.normalize("NFC"), english])
  );
}

const placeNamesEn = normalizedMap(PLACE_NAMES_EN);
const routeNotesEn = normalizedMap(ROUTE_NOTES_EN);

/** English name for a stop or road; anything unknown is shown as supplied. */
export function englishPlaceName(name: string): string | undefined {
  return placeNamesEn.get(name.normalize("NFC"));
}

export function placeName(name: string, language: UiLanguage): string {
  if (language === "bn") return name;
  return englishPlaceName(name) ?? name;
}

/** Route names are "<terminal> – <terminal>". */
export function routeDisplayName(name: string, language: UiLanguage): string {
  return name
    .split(ROUTE_NAME_SEPARATOR)
    .map((part) => placeName(part, language))
    .join(ROUTE_NAME_SEPARATOR);
}

export function routeNote(note: string, language: UiLanguage): string {
  if (language === "bn") return note;
  return routeNotesEn.get(note.normalize("NFC")) ?? note;
}

/**
 * Turns an English stop name typed into a form back into its Bangla data key:
 * an exact match, or a partial match only when exactly one stop fits, so
 * distinct stops are never merged. Other text is returned unchanged.
 */
export function stopFromEnglish(query: string, stops: string[]): string {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return query;

  const named = stops.flatMap((stop) => {
    const english = englishPlaceName(stop);
    return english ? [{ stop, english: english.toLowerCase() }] : [];
  });
  const exact = named.find((item) => item.english === normalized);
  if (exact) return exact.stop;

  const partial = named.filter((item) => item.english.includes(normalized));
  return partial.length === 1 ? partial[0].stop : query;
}
