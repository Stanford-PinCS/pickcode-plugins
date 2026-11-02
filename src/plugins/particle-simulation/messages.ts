export type AddParticlesMessage = {
    numParticles: number;
    temperature: number;
    /** A CSS color from older lessons. Empty when `group` picks the color. */
    color: string;
    /** 0 = hot group, 1 = cold group (sent by mixParticles). */
    group?: number;
};
