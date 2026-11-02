import type { AddParticlesMessage } from "../../messages";

// More particles than this slow the animation down for everyone.
const MAX_PER_GROUP = 2000;

const HOT_GROUP = 0;
const COLD_GROUP = 1;

const createExports = (sendMessage: (message: AddParticlesMessage) => void) => {
  const checkNumber = (name: string, value: unknown) => {
    if (typeof value !== "number" || !isFinite(value)) {
      throw new Error(`${name} must be a number, but it is ${String(value)}.`);
    }
    if (value < 0) {
      throw new Error(`${name} can't be negative. Try 0 or a bigger number.`);
    }
    return value;
  };

  return Promise.resolve({
    addParticles: (
      numParticles: number,
      temperature: number,
      color: string
    ) => {
      sendMessage({ numParticles, temperature, color });
    },

    /**
     * Fills the box with a cold group and a hot group of particles. The pane
     * colors the cold group teal and the hot group pink.
     */
    mixParticles: (
      numCold: unknown,
      coldTemperature: unknown,
      numHot: unknown,
      hotTemperature: unknown
    ) => {
      const groups = [
        {
          count: checkNumber("numCold", numCold),
          temperature: checkNumber("coldTemperature", coldTemperature),
          group: COLD_GROUP,
        },
        {
          count: checkNumber("numHot", numHot),
          temperature: checkNumber("hotTemperature", hotTemperature),
          group: HOT_GROUP,
        },
      ];
      for (const g of groups) {
        const count = Math.min(Math.floor(g.count), MAX_PER_GROUP);
        if (count === 0) continue;
        sendMessage({
          numParticles: count,
          temperature: g.temperature,
          color: "",
          group: g.group,
        });
      }
    },
  });
};

export default createExports;
