/**
 * The three kinds of shared vehicle that run tempu routes in Chattogram.
 * The driver declares which one they drive when they start sharing GPS;
 * it is not verified.
 */
export const VEHICLE_TYPES = ["tempu", "diesel-tempu", "human-hauler"] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

/** Used for sessions created before vehicle types existed. */
export const DEFAULT_VEHICLE_TYPE: VehicleType = "tempu";

export function isVehicleType(value: unknown): value is VehicleType {
  return typeof value === "string" && (VEHICLE_TYPES as readonly string[]).includes(value);
}
