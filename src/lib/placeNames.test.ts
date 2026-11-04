import { describe, expect, it } from "vitest";
import { getDirectionData, planTrip, tempuRoutes, allTripStops } from "../routes";
import {
  englishPlaceName,
  placeName,
  routeDisplayName,
  routeNote,
  stopFromEnglish,
} from "./placeNames";
import { searchRoutes } from "./search";

const BANGLA = /[ঀ-৿]/;

describe("English place names", () => {
  it("shows every route name without Bangla text in English", () => {
    for (const route of tempuRoutes) {
      expect(routeDisplayName(route.name, "en")).not.toMatch(BANGLA);
    }
  });

  it("shows every stop, via road and note without Bangla text in English", () => {
    for (const route of tempuRoutes) {
      for (const direction of ["outbound", "return"] as const) {
        const data = getDirectionData(route, direction);
        for (const name of [...data.stops, ...(data.via ?? [])]) {
          expect(placeName(name, "en")).not.toMatch(BANGLA);
        }
        if (data.note) expect(routeNote(data.note, "en")).not.toMatch(BANGLA);
      }
    }
  });

  it("leaves names exactly as supplied in Bangla", () => {
    const route = tempuRoutes[0];
    expect(routeDisplayName(route.name, "bn")).toBe(route.name);
    expect(placeName("লালদীঘি", "bn")).toBe("লালদীঘি");
  });

  it("gives distinct stops distinct English names", () => {
    const names = allTripStops().map((stop) => englishPlaceName(stop)?.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("falls back to the supplied name when no translation exists", () => {
    expect(placeName("অজানা স্টপ", "en")).toBe("অজানা স্টপ");
  });
});

describe("English input", () => {
  it("finds routes by English stop and route names", () => {
    const byStop = searchRoutes("lal dighi").map((result) => result.route.number);
    expect(byStop).toEqual(searchRoutes("লালদীঘি").map((result) => result.route.number));

    const byName = searchRoutes("Barek Building");
    expect(byName.map((result) => result.route.number)).toContain("01");
    expect(byName.find((result) => result.route.number === "01")?.matchedRouteName).toBe(true);
  });

  it("still never invents route 09", () => {
    expect(searchRoutes("09")).toEqual([]);
  });

  it("plans a trip from English stop names", () => {
    const stops = allTripStops();
    const plan = planTrip(stopFromEnglish("Lal Dighi", stops), stopFromEnglish("cda", stops));
    expect(plan.ok).toBe(true);
  });

  it("does not guess when a partial English name fits several stops", () => {
    expect(stopFromEnglish("Khan", allTripStops())).toBe("Khan");
  });

  it("passes Bangla input through unchanged", () => {
    expect(stopFromEnglish("লালদীঘি", allTripStops())).toBe("লালদীঘি");
  });
});
