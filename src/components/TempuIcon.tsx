import type { VehicleType } from "../../shared/vehicles";
import { VEHICLE_SVGS } from "./vehicleSvgs";

type VehicleIconProps = {
  type?: VehicleType;
  className?: string;
  size?: number;
};

export function VehicleIcon({ type = "tempu", className, size = 40 }: VehicleIconProps) {
  return (
    <span
      className={className ? `tempu-icon ${className}` : "tempu-icon"}
      style={{ width: size, height: Math.round((size * 44) / 64) }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: VEHICLE_SVGS[type] }}
    />
  );
}

export function TempuIcon(props: Omit<VehicleIconProps, "type">) {
  return <VehicleIcon {...props} type="tempu" />;
}
