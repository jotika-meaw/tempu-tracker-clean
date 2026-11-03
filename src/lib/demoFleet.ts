import type { PublicVehicle } from "../api/types";
import { getDirectionData, tempuRoutes, type Direction } from "../routes";
import { VEHICLE_TYPES, type VehicleType } from "../../shared/vehicles";
import { demoStopPosition } from "../../shared/demoStops";
import roadPaths from "./demoPaths.json";

type RoadPathFile = Record<string, { points: [number, number][]; stopDistances: number[] }>;

/** A polyline with the distance (metres) along it at each point and stop. */
type RoadPath = {
  points: [number, number][];
  along: number[];
  stopDistances: number[];
};

function metresBetween(a: [number, number], b: [number, number]): number {
  // Equirectangular is accurate enough over a few hundred metres.
  const toRad = Math.PI / 180;
  const x = (b[1] - a[1]) * toRad * Math.cos(((a[0] + b[0]) / 2) * toRad);
  const y = (b[0] - a[0]) * toRad;
  return Math.sqrt(x * x + y * y) * 6371000;
}

function toRoadPath(raw: RoadPathFile[string] | undefined, stopCount: number): RoadPath | null {
  if (!raw || raw.points.length < 2 || raw.stopDistances.length !== stopCount) return null;
  const along = [0];
  for (let index = 1; index < raw.points.length; index += 1) {
    along.push(along[index - 1] + metresBetween(raw.points[index - 1], raw.points[index]));
  }
  // The file stores road distances from the router; rescale them onto this
  // polyline's own measure so stops land exactly on it.
  const total = along[along.length - 1];
  const routerTotal = raw.stopDistances[raw.stopDistances.length - 1] || total;
  const stopDistances = raw.stopDistances.map((value) => (value / routerTotal) * total);
  return { points: raw.points, along, stopDistances };
}

function pointAlong(path: RoadPath, distance: number): [number, number] {
  const { points, along } = path;
  const target = Math.max(0, Math.min(distance, along[along.length - 1]));
  let low = 0;
  let high = along.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (along[middle] <= target) low = middle;
    else high = middle;
  }
  const span = along[high] - along[low] || 1;
  const fraction = (target - along[low]) / span;
  return [
    points[low][0] + (points[high][0] - points[low][0]) * fraction,
    points[low][1] + (points[high][1] - points[low][1]) * fraction,
  ];
}

/**
 * Demo fleet for the hackathon demo accounts.
 *
 * No real drivers are registered yet, so the demo shows simulated vehicles
 * moving between stops. They are computed in the browser from the clock
 * (every device shows the same positions), are never sent to the server,
 * and are always labelled as demo in the UI.
 *
 * Vehicles follow road paths built once from the approximate stop positions
 * in shared/demoStops.ts (see server/scripts/build-demo-paths.ts); without a
 * road path they fall back to straight lines between stops.
 */


/** Seconds a demo vehicle takes between two stops, and its wait at each end. */
export const DEMO_SECONDS_PER_STOP = 24;
const DEMO_TERMINAL_WAIT_SECONDS = 20;

type DemoSpec = {
  routeNumber: string;
  direction: Direction;
  vehicleType: VehicleType;
  /** Phase offset in seconds for the first vehicle on this direction. */
  offset: number;
};

const DEMO_SPECS: DemoSpec[] = [
  { routeNumber: "01", direction: "outbound", vehicleType: "tempu", offset: 0 },
  { routeNumber: "01", direction: "return", vehicleType: "human-hauler", offset: 90 },
  { routeNumber: "02", direction: "outbound", vehicleType: "diesel-tempu", offset: 30 },
  { routeNumber: "02", direction: "return", vehicleType: "tempu", offset: 10 },
  { routeNumber: "04", direction: "outbound", vehicleType: "human-hauler", offset: 60 },
  { routeNumber: "04", direction: "return", vehicleType: "diesel-tempu", offset: 140 },
  { routeNumber: "15", direction: "outbound", vehicleType: "diesel-tempu", offset: 45 },
  { routeNumber: "15", direction: "return", vehicleType: "tempu", offset: 120 },
  { routeNumber: "17", direction: "outbound", vehicleType: "tempu", offset: 20 },
  { routeNumber: "17", direction: "return", vehicleType: "human-hauler", offset: 75 },
];

export type DemoVehicle = PublicVehicle & {
  demo: true;
  /** True when travelling east, so the side-view icon faces forward. */
  facingRight: boolean;
  /** Index of the stop most recently passed in `segmentStops`. */
  stopIndex: number;
  nextStop: string | null;
};

type DemoPath = {
  id: string;
  spec: DemoSpec;
  /** Phase offset in seconds for this vehicle. */
  offset: number;
  routeName: string;
  stops: string[];
  points: [number, number][];
  /** Road-following polyline; null falls back to straight lines. */
  road: RoadPath | null;
};


function buildPaths(): DemoPath[] {
  const paths: DemoPath[] = [];
  for (const spec of DEMO_SPECS) {
    const route = tempuRoutes.find((item) => item.number === spec.routeNumber);
    if (!route) continue;
    const stops = getDirectionData(route, spec.direction).stops;
    const points = stops.map((stop) => demoStopPosition(stop));
    // Only simulate directions where every stop has a demo position.
    if (points.some((point) => !point)) continue;
    // Two vehicles per direction, half a loop apart, so riders usually
    // see one coming; the second is a different vehicle type.
    const cycle = (stops.length - 1) * DEMO_SECONDS_PER_STOP + DEMO_TERMINAL_WAIT_SECONDS;
    const nextType = VEHICLE_TYPES[(VEHICLE_TYPES.indexOf(spec.vehicleType) + 1) % VEHICLE_TYPES.length];
    const base = `demo-${spec.routeNumber}-${spec.direction}`;
    const road = toRoadPath(
      (roadPaths as unknown as RoadPathFile)[`${spec.routeNumber}:${spec.direction}`],
      stops.length
    );
    const shared = { routeName: route.name, stops, points: points as [number, number][], road };
    paths.push({ id: `${base}-a`, spec, offset: spec.offset, ...shared });
    paths.push({
      id: `${base}-b`,
      spec: { ...spec, vehicleType: nextType },
      offset: spec.offset + cycle / 2,
      ...shared,
    });
  }
  return paths;
}

const DEMO_PATHS = buildPaths();

/** How many demo vehicles run at once. */
export const DEMO_VEHICLE_COUNT = DEMO_PATHS.length;

/** Outbound road lines for routes with demo vehicles, drawn on the map. */
export const DEMO_ROUTE_LINES = DEMO_PATHS.filter(
  (path) => path.spec.direction === "outbound" && path.id.endsWith("-a")
).map((path) => ({
  routeNumber: path.spec.routeNumber,
  points: path.road ? path.road.points : path.points,
}));

/** Route numbers that have a demo vehicle, for tests and UI hints. */
export const DEMO_ROUTE_NUMBERS = [...new Set(DEMO_PATHS.map((path) => path.spec.routeNumber))];

/**
 * Where every demo vehicle is at `nowMs`. Each one drives its route,
 * waits at the terminal, and starts again, so the demo never runs dry.
 */
export function demoVehiclesAt(nowMs: number): DemoVehicle[] {
  const nowIso = new Date(nowMs).toISOString();

  return DEMO_PATHS.map(({ id, spec, offset, routeName, stops, points, road }) => {
    const legs = stops.length - 1;
    const cycle = legs * DEMO_SECONDS_PER_STOP + DEMO_TERMINAL_WAIT_SECONDS;
    const elapsed = (((nowMs / 1000 + offset) % cycle) + cycle) % cycle;
    const travelled = Math.min(elapsed / DEMO_SECONDS_PER_STOP, legs);
    const stopIndex = Math.min(Math.floor(travelled), legs);
    const fraction = travelled - stopIndex;
    const nextIndex = Math.min(stopIndex + 1, legs);

    let position: [number, number];
    let ahead: [number, number];
    if (road) {
      const from = road.stopDistances[stopIndex];
      const to = road.stopDistances[nextIndex];
      const distance = from + (to - from) * fraction;
      position = pointAlong(road, distance);
      ahead = pointAlong(road, distance + 25);
    } else {
      const from = points[stopIndex];
      const to = points[nextIndex];
      position = [from[0] + (to[0] - from[0]) * fraction, from[1] + (to[1] - from[1]) * fraction];
      ahead = to;
    }

    return {
      demo: true,
      publicId: id,
      routeNumber: spec.routeNumber,
      routeName,
      direction: spec.direction,
      startStop: stops[0],
      endStop: stops[legs],
      segmentStops: stops,
      vehicleType: spec.vehicleType,
      latitude: position[0],
      longitude: position[1],
      facingRight: ahead[1] > position[1] + 1e-7,
      accuracy: null,
      lastLocationAt: nowIso,
      ageSeconds: 0,
      freshness: "live",
      source: "driver-device-gps",
      stopIndex,
      nextStop: stopIndex < legs ? stops[stopIndex + 1] : null,
    };
  });
}

export type ApproachingDemo = {
  vehicle: DemoVehicle;
  /** Stops between the vehicle and the boarding stop; 0 means it is there. */
  stopsAway: number;
};

/**
 * The nearest demo vehicle on a route and direction that has not yet passed
 * the boarding stop. Used to show "a demo tempu is 2 stops away".
 */
export function approachingDemoVehicle(
  vehicles: DemoVehicle[],
  routeNumber: string,
  direction: Direction,
  boardStop: string
): ApproachingDemo | null {
  let best: ApproachingDemo | null = null;
  for (const vehicle of vehicles) {
    if (vehicle.routeNumber !== routeNumber || vehicle.direction !== direction) continue;
    const boardIndex = vehicle.segmentStops.indexOf(boardStop);
    if (boardIndex < 0 || vehicle.stopIndex > boardIndex) continue;
    const stopsAway = boardIndex - vehicle.stopIndex;
    if (!best || stopsAway < best.stopsAway) best = { vehicle, stopsAway };
  }
  return best;
}
