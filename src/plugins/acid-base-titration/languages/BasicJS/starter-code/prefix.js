// Hidden helper. Adds NaOH to 25.0 mL of HCl, 0.5 mL at a time up to 50.0 mL,
// asks your calculatePH function for the pH after each addition, and draws the run.
function runTitration(acidConcentration, baseConcentration, calculatePH) {
    checkTitrationConcentration(acidConcentration, "acidConcentration");
    checkTitrationConcentration(baseConcentration, "baseConcentration");
    if (typeof calculatePH !== "function") {
        throw new Error("runTitration needs your calculatePH function as its third input.");
    }

    const acidVolumeML = 25.0;
    const volumesML = [];
    const pHs = [];
    const regions = [];
    for (let i = 0; i <= 100; i++) {
        const baseVolumeML = i * 0.5;
        const molesH = roundTitrationMoles((acidConcentration * acidVolumeML) / 1000);
        const molesOH = roundTitrationMoles((baseConcentration * baseVolumeML) / 1000);
        const totalVolumeL = (acidVolumeML + baseVolumeML) / 1000;

        const pH = calculatePH(molesH, molesOH, totalVolumeL);
        const where = `${baseVolumeML.toFixed(1)} mL of base`;
        if (typeof pH !== "number") {
            throw new Error(
                `calculatePH should return a pH number, but at ${where} it returned ${String(pH)}.`
            );
        }
        if (!Number.isFinite(pH)) {
            throw new Error(
                `calculatePH tried to take the log of 0 or a negative number at ${where}. Give that case its own branch.`
            );
        }

        volumesML.push(baseVolumeML);
        pHs.push(pH);
        if (molesH > molesOH) {
            regions.push("excessH");
        } else if (molesOH > molesH) {
            regions.push("excessOH");
        } else {
            regions.push("equivalence");
        }
    }

    showTitration(acidConcentration, baseConcentration, acidVolumeML, volumesML, pHs, regions);
}

function checkTitrationConcentration(value, name) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0.001 || value > 1) {
        throw new Error(`${name} should be a number of mol/L from 0.001 to 1, like 0.100.`);
    }
}

// Rounds away tiny floating-point leftovers so equal moles compare as equal.
function roundTitrationMoles(moles) {
    return Math.round(moles * 1e12) / 1e12;
}
