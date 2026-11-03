import type { VehicleType } from "../../shared/vehicles";

const WHEEL = (cx: number, r: number, hub = "#F4F1EA") =>
  `<circle cx="${cx}" cy="35.5" r="${r}" fill="#10231C"/><circle cx="${cx}" cy="35.5" r="${(r * 0.4).toFixed(1)}" fill="${hub}"/>`;

/**
 * Side views (front on the left) of the three vehicles on Chattogram tempu
 * routes, drawn on one 64×44 grid so they share map pins and layouts.
 */
export const VEHICLE_SVGS: Record<VehicleType, string> = {
  // Long three-wheeler with open bench sides, painted name panel and canopy.
  tempu: `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M9 6.5Q10.5 3 16 3h42.5Q62 3 62 6.5V8.5H9z" fill="#5C6B65"/>
  <rect x="9" y="8.5" width="53" height="1.6" fill="#D63031"/>
  <path d="M3 30v-7.5Q3 16.5 9 15.2L12.5 10H17v20z" fill="#1E9E5A"/>
  <path d="M7.2 16.8 10.4 11.6H15V18H6.6z" fill="#E7F3EC"/>
  <circle cx="5.2" cy="24.6" r="1.6" fill="#F2B233"/>
  <rect x="17" y="10" width="45" height="20" fill="#1E9E5A"/>
  <rect x="19" y="11.5" width="41" height="7.5" rx="1" fill="#173F31"/>
  <rect x="30" y="11.5" width="1.6" height="7.5" fill="#F2B233"/>
  <rect x="44" y="11.5" width="1.6" height="7.5" fill="#F2B233"/>
  <rect x="19" y="20.5" width="41" height="5.5" rx="1" fill="#F2B233"/>
  <path d="M21 24.6l2.6-2.6 2.6 2.6 2.6-2.6 2.6 2.6 2.6-2.6 2.6 2.6 2.6-2.6 2.6 2.6 2.6-2.6 2.6 2.6 2.6-2.6 2.6 2.6 2.6-2.6 2.6 2.6" fill="none" stroke="#D63031" stroke-width="1.3" stroke-linejoin="round"/>
  <rect x="17" y="27" width="45" height="1.8" fill="#D63031"/>
  <rect x="2" y="29.5" width="60" height="4" rx="2" fill="#0A3F2E"/>
  ${WHEEL(10, 5.5)}${WHEEL(50, 6.5)}
</svg>`,
  // Green diesel tempu (three-wheeler) with its black canopy.
  "diesel-tempu": `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M13 9.5Q14.5 3.5 22 3.5h26Q55 3.5 55 10v2.5H12z" fill="#1F2A26"/>
  <path d="M5 30v-6.5Q5 18 11 16.5L14 12h42v18z" fill="#1E9E5A"/>
  <path d="M9.4 17.6 12.4 13.5H19V20H8.6z" fill="#E7F3EC"/>
  <rect x="21" y="13.5" width="14" height="10" rx="1.5" fill="#E7F3EC"/>
  <rect x="37.5" y="13.5" width="16" height="10" rx="1.5" fill="#173F31"/>
  <rect x="44.6" y="13.5" width="1.6" height="10" fill="#1F2A26"/>
  <rect x="19.2" y="12" width="1.8" height="12" fill="#1F2A26"/>
  <circle cx="7" cy="24.6" r="1.7" fill="#F2B233"/>
  <rect x="5" y="25.8" width="51" height="1.8" fill="#F2B233"/>
  <rect x="3" y="29.5" width="55" height="4" rx="2" fill="#0A3F2E"/>
  ${WHEEL(13, 5.5)}${WHEEL(46, 6.5)}
</svg>`,
  // White four-wheel mini truck with passenger box, route board and stripes.
  "human-hauler": `<svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <rect x="21" y="2.5" width="40" height="5.5" rx="1.5" fill="#FFFFFF" stroke="#C9CCC6" stroke-width="0.8"/>
  <rect x="25" y="4.5" width="32" height="1.5" rx="0.75" fill="#C0392B"/>
  <path d="M3 30V17Q3 9 11 8h10v22z" fill="#F7F7F2" stroke="#C9CCC6" stroke-width="0.8"/>
  <path d="M6.2 17.5Q6.2 11.2 12 11.2h6.6v6.3z" fill="#9FC3D6"/>
  <rect x="21" y="8" width="40" height="22" rx="1.5" fill="#F7F7F2" stroke="#C9CCC6" stroke-width="0.8"/>
  <rect x="23" y="9.3" width="36" height="2" fill="#2E5A9E"/>
  <rect x="24" y="11.6" width="34" height="7.6" rx="1" fill="#34433D"/>
  <path d="M32.5 11.6v7.6M41 11.6v7.6M49.5 11.6v7.6" stroke="#F7F7F2" stroke-width="1.2"/>
  <rect x="21" y="21.6" width="40" height="1.7" fill="#D63031"/>
  <rect x="21" y="23.4" width="40" height="1.7" fill="#1E9E5A"/>
  <rect x="21" y="25.2" width="40" height="1.7" fill="#F2B233"/>
  <rect x="2" y="29.5" width="60" height="4" rx="2" fill="#5F6B66"/>
  ${WHEEL(12, 6.2, "#C8CCD0")}${WHEEL(50, 6.2, "#C8CCD0")}
</svg>`,
};

/** The long tempu, used for the brand mark and illustrations. */
export const TEMPU_SVG = VEHICLE_SVGS.tempu;
