export type UiLanguage = "bn" | "en";

const bn = {
  brandTagline: "লোকাল ট্রানজিট",
  menuPassenger: "যাত্রী",
  menuDriver: "ড্রাইভার",
  navSearch: "রুট খুঁজুন",
  navMap: "লাইভ ম্যাপ",
  navAssistant: "সহায়তা",
  navDriver: "ট্র্যাকিং শুরু",
  rolePassenger: "যাত্রী মোড",
  roleDriver: "ড্রাইভার মোড",
  driverDashboard: "ড্রাইভার ড্যাশবোর্ড",
  modeLabel: "মোড",
  city: "চট্টগ্রাম, বাংলাদেশ",
  skipToContent: "মূল বিষয়বস্তুতে যান",
  language: "ভাষা",
  languageBangla: "বাংলা",
  languageEnglish: "English",
  driverModeNotice:
    "আপনি ড্রাইভার মোডে আছেন। এই ফর্ম যাত্রীরা দেখেন না। আপনার ডিভাইসের প্রকৃত GPS কেবল আপনি সম্মতি দিলে পাঠানো হবে।",
  backToPassenger: "যাত্রী ভিউতে ফিরুন",
  sidebarNote:
    "১৬টি যাচাইকৃত রুট · রুট ০৯ নেই · রুট ১৫-এর ফেরার শেষাংশ আংশিক অনুমান",
  helpTitle: "সহায়তা দরকার?",
  helpBody: "রুট, স্টপ বা যাত্রা নিয়ে প্রশ্ন করুন Meta AI সহায়ককে।",
  helpAction: "সহায়তা নিন",
  exploreMapTitle: "লাইভ ম্যাপ",
  exploreMapSubtitle: "ড্রাইভারের পাঠানো সর্বশেষ অবস্থান",
  exploreMapOpen: "বড় ম্যাপ খুলুন",
  exploreMapTag: "লাইভ",
  travelConfidenceTitle: "নিশ্চিন্তে চলুন",
  travelConfidenceBody:
    "শুধু ড্রাইভারের ডিভাইস-জিপিএস থেকে আসা অবস্থান দেখানো হয়। কোনো অনুমান বা নকল লাইভ ডেটা নেই।",
  footerNote:
    "শুধু যাচাইকৃত ১৬টি রুট। লাইভ অবস্থান ড্রাইভারের ডিভাইস-জিপিএস থেকে আসে; ড্রাইভারের পরিচয় বা গাড়ির কাগজ যাচাই করা হয় না।",
  privacyTitle: "গোপনীয়তা ও নিরাপত্তা",
  privacyPoint1:
    "যাত্রীর অবস্থান সংগ্রহ করা হয় না। ম্যাপে শুধু ড্রাইভারের পাঠানো গাড়ির অবস্থান দেখা যায়।",
  privacyPoint2:
    "ড্রাইভারের ফোন নম্বর, প্লেট নম্বর বা ব্যক্তিগত পরিচয় নেওয়া হয় না। সেশন টোকেন শুধু সার্ভারে হ্যাশ করে রাখা হয়।",
  privacyPoint3:
    "সার্ভারে নির্ধারিত সময়ের (ডিফল্ট ৩০ সেকেন্ড) বেশি পুরনো GPS অবস্থান লাইভ তালিকা থেকে লুকানো হয়; সেশন শেষ হলে বা ট্র্যাকিং বন্ধ করলে অবস্থান মুছে যায়।",
  privacyPoint4:
    "Meta AI-কে সঠিক স্থানাঙ্ক নয়, শুধু রুটভিত্তিক সামগ্রিক লাইভ সংখ্যা পাঠানো হয়। MODEL_API_KEY শুধু সার্ভারে থাকে।",

  healthCheckingTitle: "সার্ভারের অবস্থা দেখা হচ্ছে…",
  healthCheckingBody: "ট্র্যাকিং ও AI সেবা পরীক্ষা করা হচ্ছে।",
  healthOfflineTitle: "সার্ভারে সংযোগ নেই",
  healthOfflineBody:
    "লাইভ ম্যাপ ও ড্রাইভার ট্র্যাকিং কাজ করবে না। ব্যাকএন্ড চালু আছে কি না দেখে আবার চেষ্টা করুন।",
  healthRetry: "আবার চেষ্টা করুন",
  healthMemoryTitle: "মেমরি মোড চলছে",
  healthMemoryBody:
    "MongoDB সংযুক্ত নয়, তাই লাইভ ডেটা অস্থায়ী এবং সার্ভার রিস্টার্টে সেশন মুছে যাবে। স্থায়ী করতে server/.env-এ MONGODB_URI দিন, তারপর ব্যাকএন্ড রিস্টার্ট করুন। ধাপগুলো README-তে আছে।",
  healthFallbackTitle: "MongoDB-তে সংযোগ ব্যর্থ",
  healthFallbackBody:
    "MongoDB-তে সংযোগ করা যাচ্ছে না, তাই ব্যাকএন্ড অস্থায়ী মেমরি ফলব্যাকে চলছে। MONGODB_URI, Atlas database user এবং Network Access/IP allowlist দেখুন; ধাপগুলো README-তে আছে।",
  healthUnavailableTitle: "ট্র্যাকিং ডেটাবেস অনুপলব্ধ",
  healthUnavailableBody:
    "লাইভ GPS বন্ধ আছে। Meta AI সহায়তা আলাদাভাবে কাজ করতে পারে।",
  healthAiOffTitle: "Meta AI কনফিগার করা নেই",
  healthAiOffBody:
    "AI সহায়তা বন্ধ, কিন্তু রুট খোঁজা ও ড্রাইভার ট্র্যাকিং স্বাভাবিকভাবে কাজ করছে।",
  healthOkTitle: "সব সেবা সচল",
  healthOkBody: "MongoDB ও Meta AI সংযুক্ত আছে।",
  healthDbMongo: "MongoDB সংযুক্ত",
  healthDbMemory: "মেমরি মোড",
  healthDbUnavailable: "ডেটাবেস বন্ধ",
  healthAiReady: "Meta AI প্রস্তুত",
  healthAiOffChip: "AI বন্ধ",
  healthUpdated: "সর্বশেষ দেখা {time}",

  searchEyebrow: "আপনার শহর, আপনার যাত্রা",
  searchTitleLine1: "চট্টগ্রামের টেম্পু রুট,",
  searchTitleLine2: "সহজে খুঁজে নিন।",
  searchSubtitle:
    "গন্তব্য বা স্টপের নাম লিখুন। ১৬টি যাচাইকৃত রুটের স্টপ, দিক ও ফেরার পথ মিলিয়ে দেখানো হবে।",
  searchHeading: "কোথায় যেতে চান?",
  searchHint: "স্টপ, রুট নম্বর বা গন্তব্যের নাম লিখুন।",
  searchPlaceholder: "যেমন: লালদীঘি, জিইসি, রুট ১১",
  searchButton: "রুট খুঁজুন",
  searchRequired: "প্রথমে গন্তব্য বা স্টপের নাম লিখুন।",
  searchTry: "জনপ্রিয় স্টপ",
  searchEmptyTitle: "গন্তব্য লিখে খুঁজুন",
  searchEmptyBody:
    "আমরা ১৬টি রুটের স্টপ ও নাম মিলিয়ে দেখাব। নিচে সব রুটও দেখতে পারেন।",
  searchNoResultTitle: "কোনো মিল পাওয়া যায়নি",
  searchNoResultBody:
    "স্টপের নাম অন্যভাবে লিখে দেখুন, অথবা নিচের পূর্ণ রুট তালিকা দেখুন।",
  searchResultCount: "{count}টি রুট মিলেছে",
  searchMatchRoute: "রুটের নাম বা নম্বর মিলেছে",
  allRoutesTitle: "সব রুট",
  allRoutesHint:
    "১৬টি যাচাইকৃত রুট। রুট ০৯ এই তালিকায় নেই। প্রতিটি রুটে ক্লিক করে স্টপ দেখুন।",
  directionOutbound: "যাওয়ার পথ",
  directionReturn: "ফেরার পথ",
  confidenceVerified: "যাচাইকৃত",
  confidencePartial: "আংশিক অনুমান",
  viaRoads: "via সড়ক (স্টপ নয়)",
  routeStopsCount: "{count}টি স্টপ",
  viewStops: "স্টপ দেখুন",
  hideStops: "স্টপ লুকান",
  routeNumberLabel: "রুট {number}",

  mapTitle: "লাইভ টেম্পু ম্যাপ",
  mapSubtitle:
    "ড্রাইভার নিজের ডিভাইস থেকে GPS পাঠালে গাড়ি এখানে দেখা যায়। ডেমো গাড়ি সবসময় আলাদাভাবে চিহ্নিত থাকে।",
  mapFilter: "রুট ফিল্টার",
  mapAllRoutes: "সব রুট",
  mapRefresh: "রিফ্রেশ",
  mapLiveCount: "{count}টি গাড়ি লাইভ",
  mapStaleHidden: "{count}টি পুরনো অবস্থান লুকানো হয়েছে",
  mapLoadingTitle: "লাইভ অবস্থান লোড হচ্ছে…",
  mapLoadingBody: "সার্ভার থেকে সর্বশেষ GPS তথ্য আনা হচ্ছে।",
  mapEmptyTitle: "এখন কোনো লাইভ গাড়ি নেই",
  mapEmptyBody:
    "ড্রাইভার ট্র্যাকিং চালু করলে এবং ৩০ সেকেন্ডের মধ্যে GPS পাঠালে এখানে দেখা যাবে।",
  mapErrorTitle: "লাইভ ম্যাপে সংযোগ করা যাচ্ছে না",
  mapErrorBody:
    "সার্ভার বা ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। নিচের তথ্য পুরনো হতে পারে।",
  mapOfflineNotice: "সংযোগ বিচ্ছিন্ন — শেষ সফল আপডেট {time}",
  mapLastUpdate: "সর্বশেষ আপডেট",
  mapVehicleList: "গাড়ির তালিকা",
  mapVehicleLabel: "গাড়ি #{id}",
  mapAccuracy: "GPS নির্ভুলতা",
  mapSource: "ড্রাইভারের ডিভাইস GPS",
  mapPrivacy:
    "গাড়ির অবস্থান ড্রাইভারের পাঠানো GPS অনুযায়ী দেখানো হয়; যাত্রীর অবস্থান সংগ্রহ করা হয় না।",
  mapNotVerified: "ড্রাইভারের পরিচয় যাচাইকৃত নয়",
  mapLastKnown: "শেষ জানা অবস্থান",
  mapTileNote: "ম্যাপ টাইল: OpenStreetMap",
  mapListHint:
    "ম্যাপে পৌঁছানো না গেলে নিচের তালিকা থেকে গাড়ি, রুট ও সর্বশেষ আপডেট দেখুন।",

  assistantTitle: "আপনার ট্রাভেল সহায়তা",
  assistantSubtitle:
    "চট্টগ্রামের টেম্পু রুট, স্টপ ও দিক নিয়ে প্রশ্ন করুন। উত্তর যাচাইকৃত রুট তথ্যের ভিত্তিতে তৈরি হয়।",
  assistantLanguage: "উত্তরের ভাষা",
  assistantBn: "বাংলা",
  assistantEn: "English",
  assistantCtg: "চাটগাঁইয়া (পরীক্ষামূলক)",
  assistantCtgNote:
    "চাটগাঁইয়া উত্তর পরীক্ষামূলক। নিশ্চিত না হলে সহজ প্রমিত বাংলায় উত্তর দেওয়া হবে।",
  assistantPlaceholder: "যেমন: রুট ১১-এ কীভাবে সিডিএ যাব?",
  assistantSend: "পাঠান",
  assistantSending: "উত্তর তৈরি হচ্ছে…",
  assistantSampleLabel: "নমুনা প্রশ্ন",
  assistantSample1: "রুট ১১-এ সিডিএ কীভাবে যাব?",
  assistantSample2: "লালদীঘি থেকে কোন রুটে যাওয়া যায়?",
  assistantSample3: "রুট ১৫-এর ফেরার পথ কী?",
  assistantEmptyTitle: "প্রশ্ন লিখে শুরু করুন",
  assistantEmptyBody:
    "AI শুধু যাচাইকৃত রুট তালিকা ও সামগ্রিক লাইভ সংখ্যা দেখে উত্তর দেয়।",
  assistantDisclaimer:
    "Meta AI দিয়ে উত্তর তৈরি হয়। গাড়ির সংখ্যা শুধু সার্ভারের সামগ্রিক তথ্য; সঠিক অবস্থান, ভাড়া বা আগমন সময় নিশ্চিত নয়।",
  assistantErrorTitle: "উত্তর আনা যায়নি",
  assistantOffTitle: "AI সহায়তা এখন বন্ধ",
  assistantOffBody:
    "সার্ভারে Meta AI কনফিগার করা নেই। রুট খোঁজা ও লাইভ ম্যাপ এখনও কাজ করছে।",
  assistantAnswerLabel: "সহায়তার উত্তর",
  assistantModel: "মডেল: {model}",
  assistantQuestionRequired: "প্রথমে একটি প্রশ্ন লিখুন।",
  assistantLiveNote:
    "লাইভ গাড়ির তথ্য শুধু সামগ্রিক সংখ্যা হিসেবে পাঠানো হয়; সঠিক GPS স্থানাঙ্ক AI পায় না।",
  assistantVoiceStart: "বলে জিজ্ঞেস করুন",
  assistantVoiceStop: "থামান ও লিখুন",
  assistantVoiceRecording: "শুনছি… প্রশ্ন বলা শেষ হলে থামান (সর্বোচ্চ ২০ সেকেন্ড)।",
  assistantVoiceTranscribing: "Muse Voice লেখায় রূপান্তর করছে…",
  assistantVoiceDone: "আপনার কথা লেখা হয়েছে। পাঠানোর আগে দেখে নিন।",
  assistantVoiceDenied: "মাইক্রোফোনের অনুমতি পাওয়া যায়নি।",
  assistantVoiceUnsupported: "এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়।",
  assistantVoicePrivacy: "রেকর্ডিং শুধু লেখায় রূপান্তরের জন্য পাঠানো হয়; অডিও সংরক্ষণ করা হয় না।",
  assistantToolsUsed: "যাচাইকৃত রুট টুল ব্যবহার করেছে: {tools}",
  errorVoiceAudio: "রেকর্ডিং পড়া যায়নি। আবার চেষ্টা করুন।",
  errorVoiceEmpty: "রেকর্ডিংয়ে কোনো কথা শোনা যায়নি।",
  demoTag: "ডেমো",
  demoToggle: "ডেমো গাড়ি দেখান",
  demoCount: "+{count}টি ডেমো",
  demoMapFlag: "ডেমো সিমুলেশন — আনুমানিক পথে চলা নমুনা গাড়ি, আসল নয়",
  demoNextStop: "পরের স্টপ: {stop}",
  demoAtTerminal: "শেষ স্টপে অপেক্ষা করছে",
  demoNotReal: "ডেমো সিমুলেশন — আসল গাড়ি নয়",
  demoApproaching: "ডেমো: একটি {vehicle} {count} স্টপ দূরে",
  demoAtBoarding: "ডেমো: একটি {vehicle} এখন {stop}-এ",
  demoNoneApproaching: "ডেমো: এই দিকে এখন কোনো নমুনা গাড়ি আসছে না",
  statDemo: "+{count}টি ডেমো",
  vehicleTypeLabel: "আপনার গাড়ির ধরন",
  vehicleTypeNote: "যাত্রীরা ম্যাপে এই আইকন দেখবেন। ধরনটি আপনি নিজে বেছে নেন; যাচাই করা হয় না।",
  vehicleTempu: "টেম্পু",
  vehicleTempuHint: "লম্বা তিন চাকার, পাশে বেঞ্চ",
  vehicleDiesel: "ডিজেল টেম্পু",
  vehicleDieselHint: "সবুজ ছোট তিন চাকার, কালো ছাউনি",
  vehicleHumanHauler: "হিউম্যান হলার",
  vehicleHumanHaulerHint: "চার চাকার ছোট গাড়ি, পেছনে যাত্রী",
  vehicleLegend: "গাড়ির ধরন",
  statLive: "এখন লাইভ টেম্পু",
  statRoutes: "যাচাইকৃত রুট",
  statStops: "স্টপ",
  loginHeroTitle: "চট্টগ্রামের টেম্পু, এক নজরে।",
  loginHeroBody: "১৬টি যাচাইকৃত রুট, ড্রাইভারের নিজের GPS থেকে লাইভ টেম্পু, আর বাংলায় Meta AI সহায়তা।",
  loginHeroPoint1: "কোথায় টেম্পু বদলাতে হবে, তা সহ যাত্রা পরিকল্পনা",
  loginHeroPoint2: "বাংলায় বলে প্রশ্ন করুন — Muse Voice",
  loginHeroPoint3: "আসল GPS আর ডেমো গাড়ি সবসময় আলাদা করে চিহ্নিত",
  loginTitle: "Tempu Tracker-এ সাইন ইন",
  loginSubtitle: "যাত্রী ও ড্রাইভারের জন্য আলাদা অ্যাকাউন্ট — প্রত্যেকে শুধু নিজের ইন্টারফেস দেখেন।",
  loginUsername: "ইউজারনেম",
  loginPassword: "পাসওয়ার্ড",
  loginSubmit: "সাইন ইন",
  loginSigningIn: "সাইন ইন হচ্ছে…",
  loginRequired: "ইউজারনেম ও পাসওয়ার্ড দিন।",
  loginFailedTitle: "সাইন ইন হয়নি",
  loginDemoTitle: "ডেমো অ্যাকাউন্ট",
  loginDemoBody: "হ্যাকাথনের বিচারকদের জন্য — দুই ভূমিকার অভিজ্ঞতা নিতে নিচের যেকোনো অ্যাকাউন্ট ব্যবহার করুন।",
  loginDemoDriver: "ড্রাইভার",
  loginDemoDriverBody: "রুট ও যাত্রাংশ বেছে নিজের ফোনের GPS শেয়ার করুন।",
  loginDemoPassenger: "যাত্রী",
  loginDemoPassengerBody: "রুট খুঁজুন, যাত্রা পরিকল্পনা করুন, লাইভ ম্যাপ দেখুন ও Meta AI-কে জিজ্ঞেস করুন।",
  loginAsDriver: "ড্রাইভার হিসেবে ঢুকুন",
  loginAsPassenger: "যাত্রী হিসেবে ঢুকুন",
  loginDemoNote: "এগুলো শুধু ডেমো অ্যাকাউন্ট; নতুন অ্যাকাউন্ট খোলা বা ড্রাইভারের পরিচয় যাচাই করা হয় না।",
  signOut: "সাইন আউট",
  signedInAs: "{name} হিসেবে সাইন ইন",
  driverMapNav: "লাইভ ম্যাপ",
  driverPanelNav: "ট্র্যাকিং",
  errorInvalidCredentials: "ইউজারনেম বা পাসওয়ার্ড ঠিক নয়।",
  errorAuthRequired: "সেশন শেষ হয়েছে। আবার সাইন ইন করুন।",
  errorRoleNotAllowed: "এই অ্যাকাউন্ট দিয়ে এই কাজ করা যায় না।",
  tripTitle: "যাত্রা পরিকল্পনা",
  tripSubtitle: "কোথা থেকে কোথায় যাবেন দিন — সরাসরি রুট বা কোথায় টেম্পু বদলাতে হবে দেখাবে।",
  tripFrom: "কোথা থেকে",
  tripTo: "কোথায়",
  tripPlan: "পথ দেখুন",
  tripSwap: "উল্টান",
  tripDirect: "সরাসরি",
  tripChanges: "{count} বার বদল",
  tripStops: "{count} স্টপ",
  tripRide: "রুট {route} ধরুন ({direction}) — {from} থেকে {to}",
  tripChangeAt: "{stop}-এ নেমে টেম্পু বদলান",
  tripPartial: "এই অংশ আংশিক অনুমান",
  tripUnknownStop: "এই নামে কোনো স্টপ পাওয়া যায়নি।",
  tripDidYouMean: "আপনি কি বোঝাতে চেয়েছেন:",
  tripSameStop: "শুরু ও গন্তব্য একই স্টপ।",
  tripNoRoute: "দুইবারের কম বদলে এই দুই স্টপের মধ্যে কোনো যাচাইকৃত পথ নেই।",
  tripNote: "শুধু যাচাইকৃত স্টপের নাম মেলানো হয়; হাঁটার পথ, ভাড়া বা সময় অনুমান করা হয় না।",
  tripOutbound: "যাওয়ার পথ",
  tripReturn: "ফেরার পথ",
  assistantSideTitle: "AI কীভাবে উত্তর দেয়",
  assistantSideBody:
    "শুধু ১৬টি যাচাইকৃত রুট ও সামগ্রিক লাইভ সংখ্যা ব্যবহার করে। ভাড়া, আগমন সময় বা সঠিক অবস্থান অনুমান করে না।",
  aiStatusTitle: "AI সেবার অবস্থা",
  aiStatusOn: "সংযুক্ত",
  aiStatusOff: "বন্ধ",

  driverTitle: "ড্রাইভার ট্র্যাকিং",
  driverSubtitle:
    "আপনার ডিভাইসের প্রকৃত GPS শেয়ার করে যাত্রীদের লাইভ অবস্থান দেখান। অবস্থান শুধু আপনি সম্মতি দিলে পাঠানো হবে।",
  driverNoVerify:
    "ড্রাইভারের পরিচয়, ফোন নম্বর বা গাড়ির কাগজ যাচাই করা হয় না। এই সিস্টেমে ফোন বা প্লেট চাওয়া হয় না।",
  driverRoute: "রুট",
  driverRoutePlaceholder: "রুট নির্বাচন করুন",
  driverDirection: "দিক",
  driverStart: "শুরুর স্টপ",
  driverStartPlaceholder: "শুরুর স্টপ বেছে নিন",
  driverEnd: "শেষের স্টপ",
  driverEndPlaceholder: "শেষের স্টপ বেছে নিন",
  driverJourney: "আপনার যাত্রাপথ",
  driverPartialWarning:
    "এই দিকের কিছু অংশ অনুমান করা হয়েছে। যাত্রা শুরুর আগে স্টপগুলো মিলিয়ে নিন।",
  driverConsentTitle: "GPS শেয়ার করার সম্মতি",
  driverConsentBody:
    "আমি বুঝেছি যে আমার ডিভাইসের প্রকৃত অবস্থান যাত্রীদের ম্যাপে দেখানো হবে। ৩০ সেকেন্ডের বেশি পুরনো হলে অবস্থান লুকানো হবে। ট্র্যাকিং বন্ধ করলে বা সেশন শেষ হলে অবস্থান মুছে যাবে।",
  driverConsentCheckbox: "আমি সম্মতি দিচ্ছি",
  driverStartButton: "GPS ট্র্যাকিং শুরু করুন",
  driverLocating: "GPS অনুমতি ও অবস্থান খোঁজা হচ্ছে…",
  driverStarting: "সার্ভারে সেশন তৈরি হচ্ছে…",
  driverLiveTitle: "ট্র্যাকিং চালু আছে",
  driverLiveBody:
    "আপনার অবস্থান প্রায় প্রতি ৫ সেকেন্ডে পাঠানো হচ্ছে। ট্র্যাকিং বন্ধ না করা পর্যন্ত চলবে।",
  driverStopButton: "ট্র্যাকিং বন্ধ করুন",
  driverStopped: "ট্র্যাকিং বন্ধ হয়েছে এবং সেশন মুছে ফেলা হয়েছে।",
  driverLastFix: "সর্বশেষ GPS",
  driverAccuracy: "নির্ভুলতা",
  driverMeters: "{value} মিটার",
  driverSession: "সেশন",
  driverExpires: "সেশন শেষ হবে",
  driverGpsUnsupported: "এই ব্রাউজারে GPS সুবিধা নেই।",
  driverPermissionDenied:
    "অবস্থানের অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংস থেকে অনুমতি দিয়ে আবার চেষ্টা করুন।",
  driverPositionUnavailable:
    "GPS অবস্থান পাওয়া যাচ্ছে না। খোলা জায়গায় গিয়ে আবার চেষ্টা করুন।",
  driverTimeout: "GPS অবস্থান পেতে সময় শেষ হয়েছে। আবার চেষ্টা করুন।",
  driverSelectJourney: "রুট, দিক, শুরুর ও শেষের স্টপ সঠিকভাবে বেছে নিন।",
  driverConsentRequired: "GPS শেয়ার করার আগে সম্মতি দিন।",
  driverSessionExpired: "সেশন শেষ হয়েছে। আবার ট্র্যাকিং শুরু করুন।",
  driverNetworkError:
    "GPS পাঠানো যাচ্ছে না। ইন্টারনেট সংযোগ পরীক্ষা করুন; সেশন চালু থাকলে আবার চেষ্টা হবে।",
  driverStartError: "ট্র্যাকিং শুরু করা যায়নি।",
  driverStopError:
    "সেশন বন্ধ করার অনুরোধ যায়নি; সার্ভার সেশনটি সময় শেষে স্বয়ংক্রিয়ভাবে মুছে ফেলবে।",
  driverLivePrivacy:
    "আপনার পাঠানো অবস্থান যাত্রীরা ম্যাপে দেখতে পাবেন। ফোন নম্বর, প্লেট বা ব্যক্তিগত পরিচয় দেখানো হয় না।",
  driverMapHint: "যাত্রীরা লাইভ ম্যাপে আপনার গাড়িটি দেখতে পাবেন।",
  driverOpenMap: "লাইভ ম্যাপ নতুন ট্যাবে দেখুন",
  driverOpenMapHint:
    "ম্যাপ নতুন ট্যাবে খুলবে। এই ট্যাব খোলা রাখলে GPS ট্র্যাকিং চলতে থাকবে।",
  driverStatusIdle: "ট্র্যাকিং বন্ধ আছে।",
  driverNotVerifiedNote:
    "সতর্কতা: রুট ও যাত্রাপথ আপনি নিজে ঘোষণা করছেন; সিস্টেম তা স্বয়ংক্রিয়ভাবে যাচাই করে না।",
  driverSelectedStops: "নির্বাচিত স্টপ",
  driverGpsSearching: "GPS সংকেত খোঁজা হচ্ছে…",
  driverStatusLabel: "স্ট্যাটাস",
  driverRouteHelp:
    "রুট ও দিক বদলালে শুরুর ও শেষের স্টপ আবার বেছে নিতে হবে।",

  errorNetwork:
    "সার্ভারে সংযোগ করা যায়নি। ইন্টারনেট বা ব্যাকএন্ড চালু আছে কি না দেখুন।",
  errorTimeout: "সার্ভার সময়মতো উত্তর দেয়নি। আবার চেষ্টা করুন।",
  errorRateLimited: "অনেক বেশি অনুরোধ হয়েছে। কিছুক্ষণ অপেক্ষা করুন।",
  errorTooFrequent: "GPS আপডেট খুব দ্রুত আসছে; পরের আপডেট স্বয়ংক্রিয়ভাবে যাবে।",
  errorUnauthorizedSession:
    "ড্রাইভার সেশন শেষ বা বাতিল হয়েছে। আবার ট্র্যাকিং শুরু করুন।",
  errorTrackingUnavailable:
    "ট্র্যাকিং ডেটাবেস অনুপলব্ধ। লাইভ GPS এখন কাজ করছে না।",
  errorAiNotConfigured:
    "সার্ভারে Meta AI কনফিগার করা নেই। রুট খোঁজা ও ম্যাপ এখনও কাজ করছে।",
  errorAiRateLimited: "AI অনুরোধের সীমা পূর্ণ হয়েছে। কিছুক্ষণ পরে চেষ্টা করুন।",
  errorAiTimeout: "AI সময়মতো উত্তর দেয়নি। আবার চেষ্টা করুন।",
  errorAiUnavailable:
    "Meta AI সাময়িকভাবে অনুপলব্ধ। রুট খোঁজা ও ম্যাপ কাজ করছে।",
  errorAiAuth:
    "সার্ভারের AI credential গ্রহণ করা হয়নি। প্রশাসককে জানান।",
  errorConsentRequired: "GPS শেয়ার করার আগে সম্মতি দিন।",
  errorUnknownRoute: "এই রুটটি যাচাইকৃত তালিকায় নেই।",
  errorInvalidJourney:
    "শুরুর ও শেষের স্টপ এই দিকের জন্য সঠিক নয়। আবার বেছে নিন।",
  errorInvalidCoordinates: "GPS অবস্থান সঠিক নয়। আবার চেষ্টা করুন।",
  errorInvalidRequest: "অনুরোধটি সঠিক নয়। ইনপুট আবার দেখুন।",
  errorGeneric: "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।",
  errorServer: "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
  errorInvalidResponse: "সার্ভার থেকে অপ্রত্যাশিত উত্তর এসেছে।",
  errorCors: "এই ব্রাউজার origins থেকে সার্ভারে প্রবেশ অনুমোদিত নয়।",

  ageNow: "এইমাত্র",
  ageSeconds: "{seconds} সেকেন্ড আগে",
  ageMinutes: "{minutes} মিনিট আগে",
  commonLoading: "লোড হচ্ছে…",
  commonRetry: "আবার চেষ্টা করুন",
  commonRoute: "রুট",
  commonStops: "স্টপ",
  commonDirection: "দিক",
  commonStatus: "অবস্থা",
  commonNote: "নোট",
} as const;

export type MessageKey = keyof typeof bn;

const en: Record<MessageKey, string> = {
  brandTagline: "LOCAL TRANSIT",
  menuPassenger: "PASSENGER",
  menuDriver: "DRIVER",
  navSearch: "Find a route",
  navMap: "Live map",
  navAssistant: "Assistant",
  navDriver: "Start tracking",
  rolePassenger: "Passenger mode",
  roleDriver: "Driver mode",
  driverDashboard: "Driver dashboard",
  modeLabel: "Mode",
  city: "Chattogram, Bangladesh",
  skipToContent: "Skip to main content",
  language: "Language",
  languageBangla: "বাংলা",
  languageEnglish: "English",
  driverModeNotice:
    "You are in driver mode. Passengers do not see this form. Your device GPS is sent only after you give explicit consent.",
  backToPassenger: "Back to passenger view",
  sidebarNote:
    "16 verified routes · route 09 absent · route 15 return tail partially inferred",
  helpTitle: "Need a hand?",
  helpBody: "Ask the Meta AI assistant about a route, stop, or journey.",
  helpAction: "Ask the assistant",
  exploreMapTitle: "Live map",
  exploreMapSubtitle: "Latest positions shared by drivers",
  exploreMapOpen: "Open full map",
  exploreMapTag: "Live",
  travelConfidenceTitle: "Travel with confidence",
  travelConfidenceBody:
    "Only positions reported by a driver's device GPS are shown. No invented or simulated live data.",
  footerNote:
    "16 verified routes only. Live positions come from the driver's own device GPS; driver identity and vehicle documents are not verified.",
  privacyTitle: "Privacy and safety",
  privacyPoint1:
    "Passenger locations are not collected. The map only shows a vehicle position sent by a driver.",
  privacyPoint2:
    "Driver phone numbers, plates, and personal identity are not collected. Session tokens are stored only as hashes on the server.",
  privacyPoint3:
    "GPS positions older than the server's freshness window (30 seconds by default) are hidden from the live list; stopping tracking or session expiry removes the position.",
  privacyPoint4:
    "Meta AI receives aggregate route counts, not precise coordinates. MODEL_API_KEY stays on the server.",

  healthCheckingTitle: "Checking server status…",
  healthCheckingBody: "Testing tracking and AI services.",
  healthOfflineTitle: "The server is unreachable",
  healthOfflineBody:
    "Live map and driver tracking will not work. Check that the backend is running, then retry.",
  healthRetry: "Retry",
  healthMemoryTitle: "Memory mode is active",
  healthMemoryBody:
    "MongoDB is not configured, so live data is temporary and sessions disappear when the server restarts. To persist data, set MONGODB_URI in server/.env and restart the backend. Setup steps are in README.md.",
  healthFallbackTitle: "MongoDB connection failed",
  healthFallbackBody:
    "The backend cannot connect to MongoDB and is using temporary memory fallback. Check MONGODB_URI, the Atlas database user, and the Network Access/IP allowlist. Setup steps are in README.md.",
  healthUnavailableTitle: "Tracking database unavailable",
  healthUnavailableBody:
    "Live GPS is stopped. Meta AI assistance can still work independently.",
  healthAiOffTitle: "Meta AI is not configured",
  healthAiOffBody:
    "AI assistance is off, but route search and driver tracking still work.",
  healthOkTitle: "All services operational",
  healthOkBody: "MongoDB and Meta AI are connected.",
  healthDbMongo: "MongoDB connected",
  healthDbMemory: "Memory mode",
  healthDbUnavailable: "Database down",
  healthAiReady: "Meta AI ready",
  healthAiOffChip: "AI off",
  healthUpdated: "Last checked {time}",

  searchEyebrow: "YOUR CITY, YOUR JOURNEY",
  searchTitleLine1: "Chattogram tempu routes,",
  searchTitleLine2: "easy to find.",
  searchSubtitle:
    "Enter a destination or stop name. We match stops, directions, and return paths across 16 verified routes.",
  searchHeading: "Where are you heading?",
  searchHint: "Enter a stop, route number, or destination name.",
  searchPlaceholder: "e.g. Lal Dighi, GEC, route 11",
  searchButton: "Find a route",
  searchRequired: "Enter a destination or stop name first.",
  searchTry: "POPULAR STOPS",
  searchEmptyTitle: "Search for a destination",
  searchEmptyBody:
    "We match stops and names across 16 routes. You can also browse every route below.",
  searchNoResultTitle: "No match found",
  searchNoResultBody:
    "Try a different spelling of the stop, or browse the full route list below.",
  searchResultCount: "{count} routes matched",
  searchMatchRoute: "Matched route name or number",
  allRoutesTitle: "All routes",
  allRoutesHint:
    "16 verified routes. Route 09 is not in this list. Open a route to see its stops.",
  directionOutbound: "Outbound",
  directionReturn: "Return",
  confidenceVerified: "Verified",
  confidencePartial: "Partially inferred",
  viaRoads: "Via road (not a stop)",
  routeStopsCount: "{count} stops",
  viewStops: "Show stops",
  hideStops: "Hide stops",
  routeNumberLabel: "Route {number}",

  mapTitle: "Live tempu map",
  mapSubtitle:
    "A vehicle appears when a driver sends GPS from their own device. Demo vehicles are always marked separately.",
  mapFilter: "Route filter",
  mapAllRoutes: "All routes",
  mapRefresh: "Refresh",
  mapLiveCount: "{count} live vehicles",
  mapStaleHidden: "{count} older positions hidden",
  mapLoadingTitle: "Loading live positions…",
  mapLoadingBody: "Fetching the latest driver GPS from the server.",
  mapEmptyTitle: "No live vehicle right now",
  mapEmptyBody:
    "Once a driver starts tracking and sends GPS within 30 seconds, the vehicle appears here.",
  mapErrorTitle: "Cannot reach the live map",
  mapErrorBody:
    "The server or network is unreachable. The information below may be old.",
  mapOfflineNotice: "Connection lost — last successful update {time}",
  mapLastUpdate: "Last update",
  mapVehicleList: "Vehicle list",
  mapVehicleLabel: "Vehicle #{id}",
  mapAccuracy: "GPS accuracy",
  mapSource: "Driver device GPS",
  mapPrivacy:
    "Vehicle positions reflect the driver's reported GPS; passenger locations are never collected.",
  mapNotVerified: "Driver identity is not verified",
  mapLastKnown: "Last known position",
  mapTileNote: "Map tiles: OpenStreetMap",
  mapListHint:
    "If the map is not usable, the list below gives the vehicle, route, and last update.",

  assistantTitle: "Your travel assistant",
  assistantSubtitle:
    "Ask about Chattogram tempu routes, stops, and directions. Answers are grounded in the verified route dataset.",
  assistantLanguage: "Answer language",
  assistantBn: "বাংলা",
  assistantEn: "English",
  assistantCtg: "Chittagonian (experimental)",
  assistantCtgNote:
    "Chittagonian answers are experimental. When unsure, the assistant falls back to simple standard Bangla.",
  assistantPlaceholder: "e.g. How do I reach CDA on route 11?",
  assistantSend: "Send",
  assistantSending: "Preparing an answer…",
  assistantSampleLabel: "SAMPLE QUESTIONS",
  assistantSample1: "How do I reach CDA on route 11?",
  assistantSample2: "Which routes serve Lal Dighi?",
  assistantSample3: "What is the return path of route 15?",
  assistantEmptyTitle: "Ask a question to begin",
  assistantEmptyBody:
    "The AI answers from the verified route list and aggregate live counts only.",
  assistantDisclaimer:
    "Answers are generated with Meta AI. Vehicle counts are aggregate server data; exact position, fare, or arrival time is not guaranteed.",
  assistantErrorTitle: "The answer could not be loaded",
  assistantOffTitle: "AI assistance is off",
  assistantOffBody:
    "Meta AI is not configured on the server. Route search and the live map still work.",
  assistantAnswerLabel: "Assistant answer",
  assistantModel: "Model: {model}",
  assistantQuestionRequired: "Enter a question first.",
  assistantLiveNote:
    "Only aggregate live counts are sent to the AI; precise GPS coordinates are never included.",
  assistantVoiceStart: "Ask by voice",
  assistantVoiceStop: "Stop and transcribe",
  assistantVoiceRecording: "Listening… stop when you finish your question (20 seconds max).",
  assistantVoiceTranscribing: "Muse Voice is transcribing…",
  assistantVoiceDone: "Your question was transcribed. Check it before sending.",
  assistantVoiceDenied: "Microphone permission was not granted.",
  assistantVoiceUnsupported: "Voice input is not supported in this browser.",
  assistantVoicePrivacy: "The recording is sent only to be transcribed; audio is not stored.",
  assistantToolsUsed: "Used verified route tools: {tools}",
  errorVoiceAudio: "The recording could not be read. Please try again.",
  errorVoiceEmpty: "No speech was heard in the recording.",
  demoTag: "Demo",
  demoToggle: "Show demo vehicles",
  demoCount: "+{count} demo",
  demoMapFlag: "Demo simulation — sample vehicles on approximate paths, not real",
  demoNextStop: "Next stop: {stop}",
  demoAtTerminal: "Waiting at the last stop",
  demoNotReal: "Demo simulation — not a real vehicle",
  demoApproaching: "Demo: a {vehicle} is {count} stops away",
  demoAtBoarding: "Demo: a {vehicle} is at {stop} now",
  demoNoneApproaching: "Demo: no sample vehicle is coming this way right now",
  statDemo: "+{count} demo",
  vehicleTypeLabel: "Your vehicle type",
  vehicleTypeNote: "Passengers see this icon on the map. You choose the type yourself; it is not verified.",
  vehicleTempu: "Tempu",
  vehicleTempuHint: "Long three-wheeler with side benches",
  vehicleDiesel: "Diesel tempu",
  vehicleDieselHint: "Small green three-wheeler, black canopy",
  vehicleHumanHauler: "Human hauler",
  vehicleHumanHaulerHint: "Small four-wheeler, passengers in the back",
  vehicleLegend: "Vehicle types",
  statLive: "Tempus live now",
  statRoutes: "Verified routes",
  statStops: "Stops",
  loginHeroTitle: "Chattogram's tempus, at a glance.",
  loginHeroBody: "16 verified routes, live tempus from drivers' own GPS, and a Meta AI assistant that speaks Bangla.",
  loginHeroPoint1: "Trip planning that tells you where to change tempu",
  loginHeroPoint2: "Ask out loud in Bangla — Muse Voice",
  loginHeroPoint3: "Real GPS and demo vehicles are always clearly marked",
  loginTitle: "Sign in to Tempu Tracker",
  loginSubtitle: "Passengers and drivers have separate accounts — each sees only their own interface.",
  loginUsername: "Username",
  loginPassword: "Password",
  loginSubmit: "Sign in",
  loginSigningIn: "Signing in…",
  loginRequired: "Enter a username and password.",
  loginFailedTitle: "Sign-in failed",
  loginDemoTitle: "Demo accounts",
  loginDemoBody: "For hackathon judges — use either account below to try both roles.",
  loginDemoDriver: "Driver",
  loginDemoDriverBody: "Pick a route and segment, then share your phone's GPS.",
  loginDemoPassenger: "Passenger",
  loginDemoPassengerBody: "Find routes, plan trips, watch the live map, and ask Meta AI.",
  loginAsDriver: "Sign in as driver",
  loginAsPassenger: "Sign in as passenger",
  loginDemoNote: "These are demo accounts only; there is no sign-up and driver identity is not verified.",
  signOut: "Sign out",
  signedInAs: "Signed in as {name}",
  driverMapNav: "Live map",
  driverPanelNav: "Tracking",
  errorInvalidCredentials: "The username or password is incorrect.",
  errorAuthRequired: "Your session ended. Please sign in again.",
  errorRoleNotAllowed: "This account cannot use this feature.",
  tripTitle: "Trip planner",
  tripSubtitle: "Enter where you start and where you are going — see direct routes or where to change tempu.",
  tripFrom: "From",
  tripTo: "To",
  tripPlan: "Show trip",
  tripSwap: "Swap",
  tripDirect: "Direct",
  tripChanges: "{count} change(s)",
  tripStops: "{count} stops",
  tripRide: "Take route {route} ({direction}) — {from} to {to}",
  tripChangeAt: "Get off at {stop} and change tempu",
  tripPartial: "This leg is partially inferred",
  tripUnknownStop: "No stop with this name was found.",
  tripDidYouMean: "Did you mean:",
  tripSameStop: "Start and destination are the same stop.",
  tripNoRoute: "No verified journey with two or fewer changes connects these stops.",
  tripNote: "Only exact verified stop names are matched; walking links, fares, and times are not estimated.",
  tripOutbound: "outbound",
  tripReturn: "return",
  assistantSideTitle: "How the AI answers",
  assistantSideBody:
    "It uses only the 16 verified routes and aggregate live counts. It does not invent fares, arrival times, or exact positions.",
  aiStatusTitle: "AI service status",
  aiStatusOn: "Connected",
  aiStatusOff: "Off",

  driverTitle: "Driver tracking",
  driverSubtitle:
    "Share your device's real GPS so passengers can see the vehicle. Location is sent only after you give explicit consent.",
  driverNoVerify:
    "Driver identity, phone number, and vehicle documents are not verified. This system does not ask for a phone or plate.",
  driverRoute: "Route",
  driverRoutePlaceholder: "Select a route",
  driverDirection: "Direction",
  driverStart: "Starting stop",
  driverStartPlaceholder: "Select a starting stop",
  driverEnd: "Ending stop",
  driverEndPlaceholder: "Select an ending stop",
  driverJourney: "Your journey",
  driverPartialWarning:
    "Part of this direction is inferred. Confirm the stops before starting the journey.",
  driverConsentTitle: "Consent to share GPS",
  driverConsentBody:
    "I understand that my device's real location will be shown on the passenger map. Positions older than 30 seconds are hidden. Stopping tracking or session expiry deletes the position.",
  driverConsentCheckbox: "I consent",
  driverStartButton: "Start GPS tracking",
  driverLocating: "Requesting GPS permission and location…",
  driverStarting: "Creating a server session…",
  driverLiveTitle: "Tracking is live",
  driverLiveBody:
    "Your position is sent about every 5 seconds until you stop tracking.",
  driverStopButton: "Stop tracking",
  driverStopped: "Tracking stopped and the session was removed.",
  driverLastFix: "Last GPS fix",
  driverAccuracy: "Accuracy",
  driverMeters: "{value} metres",
  driverSession: "Session",
  driverExpires: "Session expires",
  driverGpsUnsupported: "This browser does not support GPS.",
  driverPermissionDenied:
    "Location permission was denied. Allow it in browser settings and try again.",
  driverPositionUnavailable:
    "GPS position is unavailable. Move to an open area and try again.",
  driverTimeout: "Timed out waiting for a GPS position. Try again.",
  driverSelectJourney: "Select a valid route, direction, start, and end stop.",
  driverConsentRequired: "Give consent before sharing GPS.",
  driverSessionExpired: "The session ended. Start tracking again.",
  driverNetworkError:
    "GPS updates cannot be sent. Check your connection; retries continue while the session is active.",
  driverStartError: "Tracking could not be started.",
  driverStopError:
    "The stop request did not reach the server; the session will expire automatically.",
  driverLivePrivacy:
    "Passengers can see the position you send. Phone number, plate, and personal identity are never shown.",
  driverMapHint: "Passengers can see this vehicle on the live map.",
  driverOpenMap: "Open live map in a new tab",
  driverOpenMapHint:
    "The map opens in a new tab. Keep this tab open to continue sending GPS.",
  driverStatusIdle: "Tracking is off.",
  driverNotVerifiedNote:
    "Note: you declare the route and journey yourself; the system does not verify them automatically.",
  driverSelectedStops: "Selected stops",
  driverGpsSearching: "Searching for a GPS signal…",
  driverStatusLabel: "Status",
  driverRouteHelp:
    "Changing the route or direction resets the starting and ending stops.",

  errorNetwork:
    "The server could not be reached. Check the internet connection or backend.",
  errorTimeout: "The server did not answer in time. Try again.",
  errorRateLimited: "Too many requests. Wait a moment and try again.",
  errorTooFrequent: "GPS updates are arriving quickly; the next update will retry.",
  errorUnauthorizedSession:
    "The driver session ended or was cancelled. Start tracking again.",
  errorTrackingUnavailable:
    "The tracking database is unavailable. Live GPS is not working.",
  errorAiNotConfigured:
    "Meta AI is not configured on the server. Route search and the map still work.",
  errorAiRateLimited: "The AI request limit was reached. Try again shortly.",
  errorAiTimeout: "The AI did not answer in time. Try again.",
  errorAiUnavailable:
    "Meta AI is temporarily unavailable. Route search and the map still work.",
  errorAiAuth:
    "The server's AI credential was rejected. Please tell the administrator.",
  errorConsentRequired: "Give consent before sharing GPS.",
  errorUnknownRoute: "This route is not in the verified list.",
  errorInvalidJourney:
    "The starting and ending stops are not valid for this direction.",
  errorInvalidCoordinates: "The GPS position is invalid. Try again.",
  errorInvalidRequest: "The request is invalid. Check the input.",
  errorGeneric: "Something went wrong. Try again.",
  errorServer: "The server had a problem. Try again.",
  errorInvalidResponse: "The server returned an unexpected response.",
  errorCors: "This browser origin is not allowed to reach the server.",

  ageNow: "just now",
  ageSeconds: "{seconds} seconds ago",
  ageMinutes: "{minutes} minutes ago",
  commonLoading: "Loading…",
  commonRetry: "Retry",
  commonRoute: "Route",
  commonStops: "Stops",
  commonDirection: "Direction",
  commonStatus: "Status",
  commonNote: "Note",
};

const dictionaries: Record<UiLanguage, Record<MessageKey, string>> = {
  bn,
  en,
};

export function t(
  language: UiLanguage,
  key: MessageKey,
  values?: Record<string, string | number>
): string {
  let text = dictionaries[language][key];
  if (values) {
    for (const [name, value] of Object.entries(values)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function localeFor(language: UiLanguage): string {
  return language === "bn" ? "bn-BD" : "en-GB";
}

export function formatTime(iso: string, language: UiLanguage): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeFor(language), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatDateTime(iso: string, language: UiLanguage): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeFor(language), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatAge(seconds: number, language: UiLanguage): string {
  if (!Number.isFinite(seconds) || seconds < 3) {
    return t(language, "ageNow");
  }
  if (seconds < 60) {
    return t(language, "ageSeconds", { seconds: Math.floor(seconds) });
  }
  return t(language, "ageMinutes", {
    minutes: Math.floor(seconds / 60),
  });
}
