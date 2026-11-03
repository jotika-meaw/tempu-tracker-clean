import { describe, expect, it } from "vitest";
import { getDirectionData, tempuRoutes } from "../routes";
import {
  DEMO_ROUTE_LINES,
  DEMO_ROUTE_NUMBERS,
  DEMO_SECONDS_PER_STOP,
  DEMO_VEHICLE_COUNT,
  approachingDemoVehicle,
  demoVehiclesAt,
} from "./demoFleet";

const T0 = Date.parse("2026-11-04T10:00:00.000Z");

describe("demo fleet", () => {
  it("runs two vehicles per route direction and labels every one as demo", () => {
    const vehicles = demoVehiclesAt(T0);
    expect(vehicles).toHaveLength(DEMO_VEHICLE_COUNT);
    expect(DEMO_VEHICLE_COUNT).toBe(20);
    expect(DEMO_ROUTE_NUMBERS.sort()).toEqual(["01", "02", "04", "15", "17"]);
    expect(new Set(vehicles.map((vehicle) => vehicle.publicId)).size).toBe(vehicles.length);
    for (const vehicle of vehicles) {
      expect(vehicle.demo).toBe(true);
      expect(vehicle.publicId.startsWith("demo-")).toBe(true);
    }
  });

  it("follows the verified stop order and stays inside Chattogram", () => {
    for (const vehicle of demoVehiclesAt(T0)) {
      const route = tempuRoutes.find((item) => item.number === vehicle.routeNumber)!;
      expect(vehicle.segmentStops).toEqual(getDirectionData(route, vehicle.direction).stops);
      expect(vehicle.stopIndex).toBeGreaterThanOrEqual(0);
      expect(vehicle.stopIndex).toBeLessThan(vehicle.segmentStops.length);
      expect(vehicle.latitude).toBeGreaterThan(22.25);
      expect(vehicle.latitude).toBeLessThan(22.45);
      expect(vehicle.longitude).toBeGreaterThan(91.75);
      expect(vehicle.longitude).toBeLessThan(91.9);
    }
  });

  it("is the same on every device for the same time, and moves over time", () => {
    expect(demoVehiclesAt(T0)).toEqual(demoVehiclesAt(T0));
    const later = demoVehiclesAt(T0 + DEMO_SECONDS_PER_STOP * 500);
    const moved = demoVehiclesAt(T0).filter((vehicle, index) => {
      const next = later[index];
      return next.latitude !== vehicle.latitude || next.longitude !== vehicle.longitude;
    });
    expect(moved.length).toBeGreaterThan(10);
  });

  it("finds the nearest demo vehicle that has not passed the boarding stop", () => {
    const vehicles = demoVehiclesAt(T0)
      .filter((vehicle) => !vehicle.publicId.endsWith("-b"))
      .map((vehicle) =>
        vehicle.routeNumber === "15" && vehicle.direction === "outbound"
          ? { ...vehicle, stopIndex: 1 }
          : vehicle
      );
    const stops = vehicles.find(
      (vehicle) => vehicle.routeNumber === "15" && vehicle.direction === "outbound"
    )!.segmentStops;

    expect(approachingDemoVehicle(vehicles, "15", "outbound", stops[4])?.stopsAway).toBe(3);
    expect(approachingDemoVehicle(vehicles, "15", "outbound", stops[1])?.stopsAway).toBe(0);
    expect(approachingDemoVehicle(vehicles, "15", "outbound", stops[0])).toBeNull();
    expect(approachingDemoVehicle(vehicles, "11", "outbound", "সিডিএ")).toBeNull();
  });

  it("follows road paths, not straight lines between stops", () => {
    expect(DEMO_ROUTE_LINES).toHaveLength(5);
    for (const line of DEMO_ROUTE_LINES) {
      expect(line.points.length).toBeGreaterThan(50);
    }
    // Vehicles report which way they face so the side-view icon can flip.
    const facing = new Set(demoVehiclesAt(T0).map((vehicle) => vehicle.facingRight));
    expect(facing.size).toBe(2);
  });
});
