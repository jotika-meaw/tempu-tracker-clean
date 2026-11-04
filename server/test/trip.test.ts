import assert from "node:assert/strict";
import test from "node:test";
import { allTripStops, planTrip, resolveStop } from "../../shared/trip.ts";
import { runRouteTool } from "../ai/tools.ts";

test("trip planner finds a direct ride with exact stop order", () => {
  const plan = planTrip("মুরাদপুর", "লালদীঘি");
  assert.equal(plan.ok, true);
  if (!plan.ok) return;

  const [best] = plan.options;
  assert.equal(best.transfers, 0);
  assert.equal(best.legs[0].routeNumber, "15");
  assert.equal(best.legs[0].stops[0], "মুরাদপুর");
  assert.equal(best.legs[0].stops.at(-1), "লালদীঘি");
  assert.equal(best.hops, best.legs[0].stops.length - 1);
});

test("trip planner changes only at stops both routes share", () => {
  const plan = planTrip("লালদীঘি", "সিডিএ");
  assert.equal(plan.ok, true);
  if (!plan.ok) return;

  for (const option of plan.options) {
    assert.ok(option.transfers >= 1);
    assert.equal(option.legs[0].boardStop, "লালদীঘি");
    assert.equal(option.legs.at(-1)?.alightStop, "সিডিএ");
    for (let index = 1; index < option.legs.length; index += 1) {
      assert.equal(option.legs[index].boardStop, option.legs[index - 1].alightStop);
      assert.notEqual(option.legs[index].routeNumber, option.legs[index - 1].routeNumber);
    }
  }
});

test("trip planner never merges distinct AK Khan stops", () => {
  const resolved = resolveStop("একে খান");
  assert.equal(resolved.stop, null);
  const nfc = (values: string[]) => values.map((value) => value.normalize("NFC")).sort();
  assert.deepEqual(nfc(resolved.suggestions), nfc(["একে খান গেট", "একে খান মোড়"]));

  const plan = planTrip("একে খান", "বহদ্দারহাট");
  assert.equal(plan.ok, false);
  if (!plan.ok) assert.equal(plan.code, "UNKNOWN_FROM");
});

test("trip planner rejects same stop and unknown stops", () => {
  const same = planTrip("লালদীঘি", "লালদীঘি");
  assert.equal(same.ok, false);
  if (!same.ok) assert.equal(same.code, "SAME_STOP");

  const unknown = planTrip("লালদীঘি", "ঢাকা বিমানবন্দর");
  assert.equal(unknown.ok, false);
  if (!unknown.ok) assert.equal(unknown.code, "UNKNOWN_TO");
});

test("every planned leg uses only verified stops and routes", () => {
  const stops = new Set(allTripStops());
  for (const [from, to] of [
    ["মুরাদপুর", "কালুরঘাট"],
    ["টাইগারপাস", "বহদ্দারহাট"],
    ["লালদীঘি", "সিডিএ"],
  ]) {
    const plan = planTrip(from, to);
    if (!plan.ok) continue;
    for (const option of plan.options) {
      assert.ok(option.transfers <= 2);
      for (const leg of option.legs) {
        assert.notEqual(leg.routeNumber, "09");
        for (const stop of leg.stops) assert.ok(stops.has(stop), stop);
      }
    }
  }
});

test("route tools return grounded JSON and reject bad arguments", () => {
  const trip = JSON.parse(runRouteTool("plan_trip", JSON.stringify({ from: "মুরাদপুর", to: "লালদীঘি" })));
  assert.equal(trip.ok, true);
  assert.equal(trip.options[0].legs[0].route, "15");

  const stop = JSON.parse(runRouteTool("find_stop", JSON.stringify({ query: "লালদীঘি" })));
  assert.equal(stop.found, true);
  assert.deepEqual(
    [...new Set(stop.servedBy.map((item: { route: string }) => item.route))].sort(),
    ["03", "04", "15"]
  );

  assert.deepEqual(JSON.parse(runRouteTool("plan_trip", "{not json")), { error: "INVALID_ARGUMENTS" });
  assert.deepEqual(JSON.parse(runRouteTool("delete_everything", "{}")), { error: "UNKNOWN_TOOL" });
});

test("route tools accept either language and answer in the selected one", () => {
  const bangla = /[ঀ-৿]/;
  const args = JSON.stringify({ from: "Muradpur", to: "Lal Dighi" });

  const english = runRouteTool("plan_trip", args, "en");
  assert.doesNotMatch(english, bangla);
  const trip = JSON.parse(english);
  assert.equal(trip.options[0].legs[0].route, "15");
  assert.equal(trip.options[0].legs[0].board, "Muradpur");
  assert.equal(trip.options[0].legs[0].alight, "Lal Dighi");

  const standard = JSON.parse(runRouteTool("plan_trip", args, "ctg"));
  assert.equal(standard.options[0].legs[0].board, "মুরাদপুর");

  const stop = runRouteTool("find_stop", JSON.stringify({ query: "লালদীঘি" }), "en");
  assert.doesNotMatch(stop, bangla);
  assert.equal(JSON.parse(stop).stop, "Lal Dighi");

  // একে খান মোড় and এ কে খান মোড় stay separate stops in English too.
  assert.equal(JSON.parse(runRouteTool("find_stop", JSON.stringify({ query: "AK Khan Mor" }), "en")).servedBy[0].route, "11");
  assert.equal(JSON.parse(runRouteTool("find_stop", JSON.stringify({ query: "A K Khan Mor" }), "en")).servedBy[0].route, "10");
});
