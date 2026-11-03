export type UserRole = "driver" | "passenger";

export type DemoAccount = {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
};

/**
 * Hackathon demo accounts. The passwords are published on the login page on
 * purpose so judges can try both roles; they only decide which interface
 * opens and which API actions are allowed. There is no sign-up and no real
 * driver verification.
 */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    username: "driver.demo",
    password: "Tempu-Driver-2026",
    role: "driver",
    displayName: "Demo driver",
  },
  {
    username: "passenger.demo",
    password: "Tempu-Ride-2026",
    role: "passenger",
    displayName: "Demo passenger",
  },
];
