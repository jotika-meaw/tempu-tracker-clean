import type { MessageKey } from "../i18n";
import {
  DEFAULT_VEHICLE_TYPE,
  VEHICLE_TYPES,
  isVehicleType,
  type VehicleType,
} from "../../shared/vehicles";

export { DEFAULT_VEHICLE_TYPE, VEHICLE_TYPES, type VehicleType };

export const VEHICLE_LABEL: Record<VehicleType, MessageKey> = {
  tempu: "vehicleTempu",
  "diesel-tempu": "vehicleDiesel",
  "human-hauler": "vehicleHumanHauler",
};

export const VEHICLE_HINT: Record<VehicleType, MessageKey> = {
  tempu: "vehicleTempuHint",
  "diesel-tempu": "vehicleDieselHint",
  "human-hauler": "vehicleHumanHaulerHint",
};

/** Older servers omit the field; treat unknown values as the default. */
export function vehicleTypeOf(value: unknown): VehicleType {
  return isVehicleType(value) ? value : DEFAULT_VEHICLE_TYPE;
}
