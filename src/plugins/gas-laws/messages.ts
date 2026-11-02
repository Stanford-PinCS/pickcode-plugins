/**
 * Every message the student's code can send to this plugin.
 *
 * One run squeezes the gas through `volumes` (L, largest first). `pressures`
 * holds what the student's calculatePressure returned at each volume (atm).
 */
export type Message = {
    type: "showPiston";
    moles: number;
    celsius: number;
    volumes: readonly number[];
    pressures: readonly number[];
};
