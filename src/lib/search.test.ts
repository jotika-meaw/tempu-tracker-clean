import { describe, expect, it } from "vitest";
import { allStops, normalizeSearchText, searchRoutes } from "./search";

function routeNumbers(query: string): string[] {
  return searchRoutes(query).map((result) => result.route.number);
}

describe("route search", () => {
  it("returns no results for an empty query instead of every route", () => {
    expect(searchRoutes("")).toEqual([]);
    expect(searchRoutes("   ")).toEqual([]);
  });

  it("normalizes Bangla digits and the word রুট", () => {
    expect(normalizeSearchText("রুট ১১")).toBe("11");
    expect(normalizeSearchText("  ROUTE 9 ")).toBe("9");
  });

  it("finds every route that serves Lal Dighi", () => {
    const numbers = routeNumbers("লালদীঘি");
    expect(numbers).toContain("03");
    expect(numbers).toContain("04");
    expect(numbers).toContain("15");
    expect(numbers).not.toContain("09");
  });

  it("finds route 11 by its Bangla route number", () => {
    const results = searchRoutes("রুট ১১");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].route.number).toBe("11");
    expect(results[0].matchedRouteNumber).toBe(true);
  });

  it("keeps একে খান মোড় and একে খান গেট distinct", () => {
    const mod = searchRoutes("একে খান মোড়");
    const gate = searchRoutes("একে খান গেট");

    const modRoute = mod.find((result) => result.route.number === "11");
    const gateRoute = gate.find((result) => result.route.number === "11");

    expect(modRoute).toBeDefined();
    expect(gateRoute).toBeDefined();
    expect(modRoute?.directions.map((item) => item.direction)).toEqual([
      "outbound",
    ]);
    expect(gateRoute?.directions.map((item) => item.direction)).toEqual([
      "return",
    ]);
  });

  it("never invents route 09", () => {
    expect(searchRoutes("০৯")).toEqual([]);
    expect(searchRoutes("09")).toEqual([]);
    expect(searchRoutes("route 09")).toEqual([]);
  });

  it("matches an exact stop before a partial stop", () => {
    const results = searchRoutes("মুরাদপুর");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].directions[0].matchedIndices.length).toBeGreaterThan(0);
  });

  it("builds a de-duplicated stop index from both directions", () => {
    const stops = allStops().map((stop) => stop.normalize("NFC"));
    expect(new Set(stops).size).toBe(stops.length);
    expect(stops).toContain("একে খান মোড়".normalize("NFC"));
    expect(stops).toContain("একে খান গেট".normalize("NFC"));
    // A via-road instruction is not a passenger stop.
    expect(stops).not.toContain("আবদুস সাত্তার রোড".normalize("NFC"));
  });
});
