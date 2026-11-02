// Hidden helper. Pushes the piston from 44.8 L down to 2.8 L, asks the
// student's calculatePressure for the pressure at each volume, and sends the
// results to the piston, gauge and graph on the right.
function runPiston(moles, celsius, calculatePressure) {
    if (typeof moles !== "number" || !(moles > 0 && moles <= 5)) {
        throw new Error("moles should be a number more than 0 and at most 5, like 1.");
    }
    if (typeof celsius !== "number" || !(celsius > -273.15 && celsius <= 1000)) {
        throw new Error(
            "celsius should be a number above -273.15 (absolute zero) and at most 1000, like 25."
        );
    }
    if (typeof calculatePressure !== "function") {
        throw new Error("runPiston needs your calculatePressure function as its third input.");
    }

    const volumes = [];
    const pressures = [];
    for (let step = 16; step >= 1; step--) {
        const volume = Math.round(step * 28) / 10;
        const pressure = calculatePressure(moles, volume, celsius);
        if (typeof pressure !== "number" || !Number.isFinite(pressure)) {
            throw new Error(
                `calculatePressure should return a number (the pressure in atm), but it returned ${String(pressure)} at ${volume} L.`
            );
        }
        if (pressure < 0) {
            throw new Error(
                `calculatePressure returned ${Number(pressure.toPrecision(3))} atm at ${volume} L. A pressure can't be negative. Is your temperature in kelvins?`
            );
        }
        volumes.push(volume);
        pressures.push(pressure);
    }
    showPiston(moles, celsius, volumes, pressures);
}
