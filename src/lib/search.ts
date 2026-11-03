import {
  getDirectionData,
  tempuRoutes,
  type Direction,
  type TempuRoute,
} from "../routes";

export type DirectionMatch = {
  direction: Direction;
  /** Indices of stops that matched the query; empty for a route-name match. */
  matchedIndices: number[];
};

export type RouteSearchResult = {
  route: TempuRoute;
  matchedRouteNumber: boolean;
  matchedRouteName: boolean;
  directions: DirectionMatch[];
  score: number;
};

const bengaliDigits = "০১২৩৪৫৬৭৮৯";

export function normalizeSearchText(value: string): string {
  const withAsciiDigits = [...value]
    .map((character) => {
      const index = bengaliDigits.indexOf(character);
      return index >= 0 ? String(index) : character;
    })
    .join("");

  return withAsciiDigits
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/^(রুট|route)\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stopScore(stop: string, query: string): number {
  const normalized = normalizeSearchText(stop);
  if (normalized === query) return 100;
  if (normalized.startsWith(query)) return 60;
  if (normalized.includes(query)) return 30;
  return 0;
}

/**
 * Deterministic search over the verified route data. It intentionally does not
 * geocode or infer stops that are not in the supplied dataset.
 */
export function searchRoutes(rawQuery: string): RouteSearchResult[] {
  const query = normalizeSearchText(rawQuery);
  if (!query) return [];

  const results: RouteSearchResult[] = [];

  for (const route of tempuRoutes) {
    const normalizedNumber = normalizeSearchText(route.number);
    const matchedRouteNumber =
      normalizedNumber === query ||
      (normalizedNumber.startsWith("0") &&
        normalizedNumber.slice(1) === query);
    const matchedRouteName = normalizeSearchText(route.name).includes(query);

    let score = 0;
    if (matchedRouteNumber) score += 90;
    if (matchedRouteName) score += 40;

    const directions: DirectionMatch[] = [];

    for (const direction of ["outbound", "return"] as const) {
      const stops = getDirectionData(route, direction).stops;
      const matchedIndices: number[] = [];
      let directionScore = 0;

      stops.forEach((stop, index) => {
        const current = stopScore(stop, query);
        if (current > 0) {
          matchedIndices.push(index);
          directionScore = Math.max(directionScore, current);
        }
      });

      if (matchedIndices.length > 0) {
        directions.push({ direction, matchedIndices });
        score += directionScore;
      } else if (matchedRouteNumber || matchedRouteName) {
        directions.push({ direction, matchedIndices: [] });
      }
    }

    if (matchedRouteNumber || matchedRouteName || directions.length > 0) {
      results.push({
        route,
        matchedRouteNumber,
        matchedRouteName,
        directions,
        score,
      });
    }
  }

  return results.sort(
    (left, right) =>
      right.score - left.score ||
      left.route.number.localeCompare(right.route.number)
  );
}

/** Returns a sorted, de-duplicated list of every verified stop. */
export function allStops(): string[] {
  const stops = new Set<string>();
  for (const route of tempuRoutes) {
    for (const direction of ["outbound", "return"] as const) {
      for (const stop of getDirectionData(route, direction).stops) {
        stops.add(stop);
      }
    }
  }
  return [...stops].sort((left, right) => left.localeCompare(right, "bn"));
}
