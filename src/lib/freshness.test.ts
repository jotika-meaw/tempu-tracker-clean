import { describe, expect, it } from "vitest";
import {
  ageSecondsFrom,
  classifyFreshness,
  estimateAgeSeconds,
} from "./freshness";

describe("GPS freshness", () => {
  it("classifies live, aging, and stale positions at the server boundary", () => {
    expect(classifyFreshness(0, 30)).toBe("live");
    expect(classifyFreshness(18, 30)).toBe("live");
    expect(classifyFreshness(19, 30)).toBe("aging");
    expect(classifyFreshness(30, 30)).toBe("aging");
    expect(classifyFreshness(31, 30)).toBe("stale");
  });

  it("computes age from an ISO timestamp without going negative", () => {
    const now = new Date("2026-01-01T00:00:30.000Z").getTime();
    expect(
      ageSecondsFrom("2026-01-01T00:00:00.000Z", now)
    ).toBe(30);
    expect(
      ageSecondsFrom("2026-01-01T00:01:00.000Z", now)
    ).toBe(0);
    expect(ageSecondsFrom("not-a-date", now)).toBeNull();
  });

  it("grows the server age between polls using the local fetch time", () => {
    const fetchedAt = 1_000_000;
    expect(estimateAgeSeconds(2, fetchedAt, fetchedAt + 5_500)).toBe(7);
    expect(estimateAgeSeconds(2, fetchedAt, fetchedAt - 10_000)).toBe(2);
  });

  it("treats an old snapshot as stale even when no new response arrives", () => {
    const fetchedAt = 1_000_000;
    const age = estimateAgeSeconds(5, fetchedAt, fetchedAt + 40_000);
    expect(classifyFreshness(age, 30)).toBe("stale");
  });
});
