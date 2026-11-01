import type { FeaturedTarget } from "./types";

/**
 * Well-known sky targets for quick access.
 * Coordinates are J2000 ICRS decimal degrees.
 */
export const FEATURED_TARGETS: FeaturedTarget[] = [
  {
    name: "Vela Molecular Ridge",
    ra: 128.8,
    dec: -43.5,
    description:
      "A complex of giant molecular clouds at ~700 pc, active star-forming region.",
    type: "Molecular Cloud",
  },
  {
    name: "Orion Nebula",
    ra: 83.8221,
    dec: -5.3911,
    description:
      "M42 — one of the brightest nebulae and nearest regions of massive star formation.",
    type: "Nebula",
  },
  {
    name: "Andromeda Galaxy",
    ra: 10.6847,
    dec: 41.269,
    description:
      "M31 — our nearest large spiral galaxy neighbour at ~2.5 Mpc.",
    type: "Galaxy",
  },
  {
    name: "Mira (o Ceti)",
    ra: 34.8366,
    dec: -2.9774,
    description:
      "Prototype long-period variable star, brightens and fades over ~332 days.",
    type: "Variable Star",
  },
  {
    name: "Galactic Center",
    ra: 266.4168,
    dec: -29.0078,
    description:
      "Sgr A* region — infrared bright core of the Milky Way.",
    type: "Galactic Core",
  },
  {
    name: "Crab Nebula",
    ra: 83.6331,
    dec: 22.0145,
    description:
      "M1 — supernova remnant from 1054 AD, powered by a pulsar.",
    type: "Supernova Remnant",
  },
];
