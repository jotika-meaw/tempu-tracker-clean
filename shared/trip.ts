import { tempuRoutes, type Direction, type RouteConfidence } from "./routes";
import { getDirectionData } from "./journey";

export type TripLeg = {
  routeNumber: string;
  routeName: string;
  direction: Direction;
  boardStop: string;
  alightStop: string;
  /** Inclusive stop list from boarding to alighting. */
  stops: string[];
  confidence: RouteConfidence;
};

export type TripOption = {
  legs: TripLeg[];
  /** Number of stop-to-stop hops across all legs. */
  hops: number;
  transfers: number;
};

export type TripPlan =
  | { ok: true; from: string; to: string; options: TripOption[] }
  | {
      ok: false;
      code: "UNKNOWN_FROM" | "UNKNOWN_TO" | "SAME_STOP" | "NO_ROUTE";
      from: string | null;
      to: string | null;
      suggestions: string[];
    };

const bengaliDigits = "০১২৩৪৫৬৭৮৯";
/** Changing tempu costs about as much as riding a few extra stops. */
const TRANSFER_PENALTY_HOPS = 3;
const MAX_TRANSFERS = 2;
const MAX_OPTIONS_PER_GROUP = 3;

export function normalizeStopText(value: string): string {
  return [...value]
    .map((character) => {
      const index = bengaliDigits.indexOf(character);
      return index >= 0 ? String(index) : character;
    })
    .join("")
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

type StopVisit = {
  routeNumber: string;
  routeName: string;
  direction: Direction;
  stops: string[];
  confidence: RouteConfidence;
};

const directions: StopVisit[] = tempuRoutes.flatMap((route) =>
  (["outbound", "return"] as const).map((direction) => {
    const data = getDirectionData(route, direction);
    return {
      routeNumber: route.number,
      routeName: route.name,
      direction,
      stops: data.stops,
      confidence: data.confidence,
    };
  })
);

const canonicalStops: string[] = [...new Set(directions.flatMap((item) => item.stops))];

const visitsByStop = new Map<string, Array<{ visit: StopVisit; index: number }>>();
for (const visit of directions) {
  visit.stops.forEach((stop, index) => {
    const list = visitsByStop.get(stop) ?? [];
    list.push({ visit, index });
    visitsByStop.set(stop, list);
  });
}

/** Every distinct stop name in the verified dataset, in first-seen order. */
export function allTripStops(): string[] {
  return [...canonicalStops];
}

/**
 * Resolve free text to one exact stop name from the dataset. Only an exact
 * (normalized) match or a single unambiguous partial match is accepted, so
 * distinct stops such as `একে খান মোড়` and `একে খান গেট` are never merged.
 */
export function resolveStop(query: string): { stop: string | null; suggestions: string[] } {
  const normalized = normalizeStopText(query);
  if (!normalized) return { stop: null, suggestions: [] };

  const exact = canonicalStops.find((stop) => normalizeStopText(stop) === normalized);
  if (exact) return { stop: exact, suggestions: [] };

  const partial = canonicalStops.filter((stop) => {
    const candidate = normalizeStopText(stop);
    return candidate.includes(normalized) || normalized.includes(candidate);
  });
  if (partial.length === 1) return { stop: partial[0], suggestions: [] };
  return { stop: null, suggestions: partial.slice(0, 6) };
}

function leg(visit: StopVisit, boardIndex: number, alightIndex: number): TripLeg {
  return {
    routeNumber: visit.routeNumber,
    routeName: visit.routeName,
    direction: visit.direction,
    boardStop: visit.stops[boardIndex],
    alightStop: visit.stops[alightIndex],
    stops: visit.stops.slice(boardIndex, alightIndex + 1),
    confidence: visit.confidence,
  };
}

function cost(option: TripOption): number {
  return option.hops + option.transfers * TRANSFER_PENALTY_HOPS;
}

/**
 * Deterministic journey planner over the verified dataset: direct rides and
 * journeys with up to two changes between different routes. It never
 * invents stops, walking links, fares, or travel times.
 */
export function planTrip(fromQuery: string, toQuery: string): TripPlan {
  const from = resolveStop(fromQuery);
  const to = resolveStop(toQuery);

  if (!from.stop) {
    return { ok: false, code: "UNKNOWN_FROM", from: null, to: to.stop, suggestions: from.suggestions };
  }
  if (!to.stop) {
    return { ok: false, code: "UNKNOWN_TO", from: from.stop, to: null, suggestions: to.suggestions };
  }
  if (from.stop === to.stop) {
    return { ok: false, code: "SAME_STOP", from: from.stop, to: to.stop, suggestions: [] };
  }

  const origin = from.stop;
  const destination = to.stop;
  const best = new Map<string, TripOption>();

  // Depth-first search over the small verified network. Each leg rides one
  // route direction forward; a change is only allowed at a stop name that
  // both routes share exactly, and a route is never boarded twice.
  function explore(visit: StopVisit, boardIndex: number, legs: TripLeg[], used: Set<string>) {
    for (let index = boardIndex + 1; index < visit.stops.length; index += 1) {
      const stop = visit.stops[index];
      const ride = [...legs, leg(visit, boardIndex, index)];

      if (stop === destination) {
        const option: TripOption = {
          legs: ride,
          hops: ride.reduce((total, item) => total + item.stops.length - 1, 0),
          transfers: ride.length - 1,
        };
        const key = ride.map((item) => `${item.routeNumber}:${item.direction}`).join(">");
        const existing = best.get(key);
        if (!existing || cost(option) < cost(existing)) best.set(key, option);
        return;
      }

      if (ride.length > MAX_TRANSFERS) continue;
      for (const next of visitsByStop.get(stop) ?? []) {
        if (used.has(next.visit.routeNumber)) continue;
        explore(next.visit, next.index, ride, new Set([...used, next.visit.routeNumber]));
      }
    }
  }

  for (const start of visitsByStop.get(origin) ?? []) {
    explore(start.visit, start.index, [], new Set([start.visit.routeNumber]));
  }

  const ranked = [...best.values()].sort(
    (left, right) =>
      cost(left) - cost(right) ||
      left.transfers - right.transfers ||
      left.legs[0].routeNumber.localeCompare(right.legs[0].routeNumber)
  );

  // Only offer a journey with more changes when it is genuinely shorter than
  // every journey with fewer changes.
  const options: TripOption[] = [];
  let cheapestSoFar = Infinity;
  for (let transfers = 0; transfers <= MAX_TRANSFERS; transfers += 1) {
    const group = ranked.filter((option) => option.transfers === transfers);
    const kept = group.filter((option) => cost(option) < cheapestSoFar).slice(0, MAX_OPTIONS_PER_GROUP);
    options.push(...kept);
    if (kept.length > 0) cheapestSoFar = Math.min(cheapestSoFar, cost(kept[0]));
  }
  options.sort((left, right) => cost(left) - cost(right) || left.transfers - right.transfers);

  if (options.length === 0) {
    return { ok: false, code: "NO_ROUTE", from: origin, to: destination, suggestions: [] };
  }

  return { ok: true, from: origin, to: destination, options };
}
