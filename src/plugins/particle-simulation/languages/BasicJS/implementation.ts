import type { AddParticlesMessage } from "../../messages";

const createExports = (sendMessage: (message: AddParticlesMessage) => void) => {
  return Promise.resolve({
    addParticles: (
      numParticles: number,
      temperature: number,
      color: string
    ) => {
      const message = {
        numParticles,
        temperature,
        color,
      };

      console.log("addParticles called:", message);
      sendMessage(message);
    },
  });
};

export default createExports;
