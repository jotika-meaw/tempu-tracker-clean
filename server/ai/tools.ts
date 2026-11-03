import { planTrip, resolveStop } from "../../shared/trip";
import { tempuRoutes } from "../../shared/routes";
import { getDirectionData } from "../../shared/journey";

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
        from: { type: "string", description: "Starting stop name, in Bangla as written in the dataset." },
        to: { type: "string", description: "Destination stop name, in Bangla as written in the dataset." },
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

function findStop(query: string) {
  const resolved = resolveStop(query);
  if (!resolved.stop) {
    return { found: false, suggestions: resolved.suggestions };
  }

  const served = tempuRoutes.flatMap((route) =>
    (["outbound", "return"] as const).flatMap((direction) => {
      const data = getDirectionData(route, direction);
      const index = data.stops.indexOf(resolved.stop as string);
      if (index < 0) return [];
      return [
        {
          route: route.number,
          name: route.name,
          direction,
          position: `${index + 1} of ${data.stops.length}`,
          nextStops: data.stops.slice(index + 1, index + 4),
          confidence: data.confidence,
        },
      ];
    })
  );

  return { found: true, stop: resolved.stop, servedBy: served };
}

/**
 * Run one tool call. Tools only read the verified route dataset; they never
 * touch tracking sessions, coordinates, or anything user-specific.
 */
export function runRouteTool(name: string, rawArguments: string): string {
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
    const plan = planTrip(stringArg(args, "from"), stringArg(args, "to"));
    if (!plan.ok) return JSON.stringify(plan);
    return JSON.stringify({
      ok: true,
      from: plan.from,
      to: plan.to,
      options: plan.options.map((option) => ({
        changes: option.transfers,
        stopsRidden: option.hops,
        legs: option.legs.map((item) => ({
          route: item.routeNumber,
          direction: item.direction,
          board: item.boardStop,
          alight: item.alightStop,
          stops: item.stops,
          confidence: item.confidence,
        })),
      })),
    });
  }

  if (name === "find_stop") {
    return JSON.stringify(findStop(stringArg(args, "query")));
  }

  return JSON.stringify({ error: "UNKNOWN_TOOL" });
}
