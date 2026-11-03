/**
 * Build road-following paths for the demo fleet.
 *
 *   cd server && npx tsx scripts/build-demo-paths.ts
 *
 * For each demo route direction, asks the public OSRM demo router for a
 * driving route through the approximate stop positions in
 * shared/demoStops.ts, then writes the snapped polyline and the distance of
 * each stop along it to src/lib/demoPaths.json. Run it only when the demo
 * stops change; the app reads the JSON and never calls OSRM at runtime.
 * Only the hand-placed demo coordinates are sent; no user data.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tempuRoutes } from "../../shared/routes";
import { getDirectionData } from "../../shared/journey";
import { DEMO_ROUTE_DIRECTIONS, demoStopPosition } from "../../shared/demoStops";

const OSRM = "https://router.project-osrm.org/route/v1/driving";
const outFile = join(dirname(fileURLToPath(import.meta.url)), "../../src/lib/demoPaths.json");

type OsrmResponse = {
  code: string;
  routes: Array<{
    distance: number;
    geometry: { coordinates: [number, number][] };
  }>;
};

const round = (value: number) => Math.round(value * 1e5) / 1e5;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type NearestResponse = {
  waypoints?: Array<{ location: [number, number]; distance: number; name: string }>;
};

const ABOVE_GROUND = /elevat|flyover|expressway|overpass/i;
const snapCache = new Map<string, [number, number]>();

/**
 * Tempus run on ground-level streets, so snap each approximate stop to the
 * nearest named road within 150 m that is not a flyover or expressway.
 * Unnamed service lanes and the elevated expressway cause long detours.
 */
async function snapToGroundRoad(stop: string, [lat, lng]: [number, number]): Promise<[number, number]> {
  const cached = snapCache.get(stop);
  if (cached) return cached;

  const response = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=10`);
  const body = (await response.json()) as NearestResponse;
  const candidates = body.waypoints ?? [];
  const ground = candidates.filter((item) => !ABOVE_GROUND.test(item.name));
  const pick =
    ground.find((item) => item.name && item.distance <= 150) ?? ground[0] ?? candidates[0];
  const snapped: [number, number] = pick ? [pick.location[1], pick.location[0]] : [lat, lng];
  snapCache.set(stop, snapped);
  await pause(300);
  return snapped;
}

function straightMetres(a: [number, number], b: [number, number]): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

type Leg = { kind: "road" | "reversed" | "straight"; points: [number, number][]; distance: number };

async function roadLeg(from: [number, number], to: [number, number]) {
  const response = await fetch(
    `${OSRM}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=false`
  );
  await pause(500);
  if (!response.ok) return null;
  const body = (await response.json()) as OsrmResponse;
  const best = body.code === "Ok" ? body.routes[0] : undefined;
  if (!best) return null;
  return {
    points: best.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
    distance: best.distance,
  };
}

const isDetour = (road: number, line: number) => road > Math.max(1.8 * line, line + 700);

/**
 * Road path for one leg. One-way streets can turn a 1 km hop into a 4 km
 * loop; for the demo, use the same street driven the other way instead, and
 * fall back to a straight line if that also loops.
 */
async function legPath(from: [number, number], to: [number, number]): Promise<Leg> {
  const line = straightMetres(from, to);
  const forward = await roadLeg(from, to);
  if (forward && !isDetour(forward.distance, line)) return { kind: "road", ...forward };

  const backward = await roadLeg(to, from);
  if (backward && !isDetour(backward.distance, line)) {
    return { kind: "reversed", points: [...backward.points].reverse(), distance: backward.distance };
  }
  return { kind: "straight", points: [from, to], distance: line };
}

async function main() {
  const paths: Record<string, { points: [number, number][]; stopDistances: number[] }> = {};

  for (const [routeNumber, direction] of DEMO_ROUTE_DIRECTIONS) {
    const route = tempuRoutes.find((item) => item.number === routeNumber);
    if (!route) throw new Error(`Unknown route ${routeNumber}`);
    const stops = getDirectionData(route, direction).stops;
    const positions: [number, number][] = [];
    for (const stop of stops) {
      const position = demoStopPosition(stop);
      if (!position) throw new Error(`No demo position for ${stop} (${routeNumber} ${direction})`);
      positions.push(await snapToGroundRoad(stop, position));
    }

    // Route every leg on its own so a one-way loop on one leg cannot drag
    // the whole route off course.
    const points: [number, number][] = [];
    const stopDistances = [0];
    for (let index = 0; index < positions.length - 1; index += 1) {
      const leg = await legPath(positions[index], positions[index + 1]);
      if (leg.kind !== "road") {
        console.warn(`  ${leg.kind}: ${stops[index]} → ${stops[index + 1]}`);
      }
      points.push(...(points.length > 0 ? leg.points.slice(1) : leg.points));
      stopDistances.push(stopDistances[stopDistances.length - 1] + leg.distance);
    }

    paths[`${routeNumber}:${direction}`] = {
      points: points.map(([lat, lng]) => [round(lat), round(lng)]),
      stopDistances: stopDistances.map((value) => Math.round(value)),
    };
    console.log(
      `${routeNumber} ${direction}: ${Math.round(stopDistances[stopDistances.length - 1])} m, ${points.length} points`
    );
    // Be gentle with the shared demo router.
    await pause(1200);
  }

  writeFileSync(outFile, `${JSON.stringify(paths)}\n`);
  console.log(`Wrote ${outFile}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
