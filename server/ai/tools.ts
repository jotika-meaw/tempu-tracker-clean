import { allTripStops, planTrip, resolveStop } from "../../shared/trip";
import { placeName, routeDisplayName, stopFromEnglish } from "../../shared/placeNames";
import { tempuRoutes } from "../../shared/routes";
import { getDirectionData } from "../../shared/journey";
import type { AiLanguage } from "../validation";

/** Function tools offered to Muse Spark, in Responses API format. */
export const ROUTE_TOOLS = [
  {
    type: "function",
    name: "plan_trip",
    description:
      "Plan a tempu journey between two stops in the verified Chattogram dataset. Returns direct rides and journeys with up to two changes, with exact stop names. Use this for any 'how do I get from A to B' question.",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Starting stop name, as written in the dataset." },
        to: { type: "string", description: "Destination stop name, as written in the dataset." },
      },
      required: ["from", "to"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function",
    name: "find_stop",
    description:
      "Look up a stop name in the verified dataset and list every route and direction that serves it. Use this when the user names a single place or when plan_trip reports an unknown stop.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Stop name or part of it." },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
] as const;

export type RouteToolName = (typeof ROUTE_TOOLS)[number]["name"];

function stringArg(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  return typeof value === "string" ? value.slice(0, 200) : "";
}

/** The model may pass a stop in either language; the dataset is keyed in Bangla. */
function stopArg(args: Record<string, unknown>, key: string): string {
  return stopFromEnglish(stringArg(args, key), allTripStops());
}

function findStop(query: string, language: AiLanguage) {
  const resolved = resolveStop(query);
  const stops = (list: string[]) => list.map((stop) => placeName(stop, language));
  if (!resolved.stop) {
    return { found: false, suggestions: stops(resolved.suggestions) };
  }

  const served = tempuRoutes.flatMap((route) =>
    (["outbound", "return"] as const).flatMap((direction) => {
      const data = getDirectionData(route, direction);
      const index = data.stops.indexOf(resolved.stop as string);
      if (index < 0) return [];
      return [
        {
          route: route.number,
          name: routeDisplayName(route.name, language),
          direction,
          position: `${index + 1} of ${data.stops.length}`,
          nextStops: stops(data.stops.slice(index + 1, index + 4)),
          confidence: data.confidence,
        },
      ];
    })
  );

  return { found: true, stop: placeName(resolved.stop, language), servedBy: served };
}

/**
 * Run one tool call. Tools only read the verified route dataset; they never
 * touch tracking sessions, coordinates, or anything user-specific. Place names
 * come back in the answer language.
 */
export function runRouteTool(
  name: string,
  rawArguments: string,
  language: AiLanguage = "bn"
): string {
  let args: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(rawArguments || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      args = parsed as Record<string, unknown>;
    }
  } catch {
    return JSON.stringify({ error: "INVALID_ARGUMENTS" });
  }

  if (name === "plan_trip") {
    const plan = planTrip(stopArg(args, "from"), stopArg(args, "to"));
    const stop = (value: string) => placeName(value, language);
    const optionalStop = (value: string | null) => (value ? stop(value) : value);
    if (!plan.ok) {
      return JSON.stringify({
        ...plan,
        from: optionalStop(plan.from),
        to: optionalStop(plan.to),
        suggestions: plan.suggestions.map(stop),
      });
    }
    return JSON.stringify({
      ok: true,
      from: stop(plan.from),
      to: stop(plan.to),
      options: plan.options.map((option) => ({
        changes: option.transfers,
        stopsRidden: option.hops,
        legs: option.legs.map((item) => ({
          route: item.routeNumber,
          direction: item.direction,
          board: stop(item.boardStop),
          alight: stop(item.alightStop),
          stops: item.stops.map(stop),
          confidence: item.confidence,
        })),
      })),
    });
  }

  if (name === "find_stop") {
    return JSON.stringify(findStop(stopArg(args, "query"), language));
  }

  return JSON.stringify({ error: "UNKNOWN_TOOL" });
}
