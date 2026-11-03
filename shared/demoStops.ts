/**
 * APPROXIMATE stop positions for the hackathon demo fleet only, placed by
 * hand from Chattogram geography for routes 01, 02, 04, 15 and 17. They are
 * not part of the verified route dataset and must not be used as real stop
 * locations. server/scripts/build-demo-paths.ts snaps them to roads.
 */
export const APPROXIMATE_STOP_POSITIONS: Record<string, [number, number]> = {
  "অক্সিজেন": [22.3949, 91.8222],
  "আতুরার ডিপো": [22.3800, 91.8305],
  "মুরাদপুর": [22.3668, 91.8318],
  "চকবাজার": [22.3577, 91.8378],
  "গণি বেকারী": [22.3512, 91.8335],
  "কাজীর দেউড়ী": [22.3449, 91.8241],
  "টাইগারপাস": [22.3392, 91.8152],
  "দেওয়ানহাট": [22.3322, 91.8076],
  "চৌমুহনী": [22.3268, 91.8041],
  "বারেক বিল্ডিং মোড়": [22.3182, 91.8037],
  "বায়েজিদ বোস্তামী": [22.3858, 91.8160],
  "ষোলশহর ২নং গেট": [22.3693, 91.8197],
  "জিইসি": [22.3592, 91.8216],
  "ওয়াসা": [22.3512, 91.8172],
  "কালুরঘাট": [22.3985, 91.8792],
  "কাপ্তাই রাস্তার মাথা": [22.3832, 91.8677],
  "কাপাসগোলা": [22.3640, 91.8432],
  "তেলিপট্টি": [22.3566, 91.8444],
  "চন্দনপুরা": [22.3488, 91.8412],
  "সাবএরিয়া": [22.3447, 91.8389],
  "আন্দরকিল্লা": [22.3412, 91.8362],
  "বক্সিরহাট বিট": [22.3396, 91.8382],
  "লালদীঘি": [22.3370, 91.8340],
  "কোতোয়ালী মোড়": [22.3336, 91.8361],
  "পাঁচলাইশ থানা": [22.3641, 91.8291],
  "কাতালগঞ্জ": [22.3602, 91.8268],
  "গুলজার সিনেমা": [22.3558, 91.8301],
  "জামালখান": [22.3478, 91.8338],
  "নজির আহমদ চৌধুরী রোড": [22.3390, 91.8350],
  "নিউমার্কেট": [22.3361, 91.8309],
  "ফিরিঙ্গিবাজার মেরিন ড্রাইভ রোড": [22.3301, 91.8360],
  "চামড়া গুদাম": [22.3329, 91.8531],
  "হযরত শাহ আমানত ব্রিজের পশ্চিম পাড়": [22.3371, 91.8582],
};

export const DEMO_ROUTE_DIRECTIONS = [
  ["01", "outbound"],
  ["01", "return"],
  ["02", "outbound"],
  ["02", "return"],
  ["04", "outbound"],
  ["04", "return"],
  ["15", "outbound"],
  ["15", "return"],
  ["17", "outbound"],
  ["17", "return"],
] as const;

/** Bangla letters such as ড় and য় have two Unicode spellings. */
export function demoStopPosition(stop: string): [number, number] | undefined {
  return positionByStop.get(stop.normalize("NFC"));
}

const positionByStop = new Map(
  Object.entries(APPROXIMATE_STOP_POSITIONS).map(([stop, point]) => [stop.normalize("NFC"), point])
);
