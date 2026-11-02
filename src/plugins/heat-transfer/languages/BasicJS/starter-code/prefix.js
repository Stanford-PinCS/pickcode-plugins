// Hidden helper. Your while loop calls recordTemps once per pass. When your
// code ends, the hidden suffix adds the final temperatures and draws.
const recordedMetalTemps = [];
const recordedWaterTemps = [];

function recordTemps(metalTemp, waterTemp) {
    if (
        typeof metalTemp !== "number" || !Number.isFinite(metalTemp) ||
        typeof waterTemp !== "number" || !Number.isFinite(waterTemp)
    ) {
        throw new Error("recordTemps needs two numbers: recordTemps(metalTemp, waterTemp).");
    }
    if (recordedMetalTemps.length >= 100000) {
        throw new Error(
            "Your while loop has run 100000 times without stopping. " +
                "Make sure each pass moves metalTemp and waterTemp closer together."
        );
    }
    recordedMetalTemps.push(metalTemp);
    recordedWaterTemps.push(waterTemp);
}

// Called by the last line of main: adds the final temperatures and draws.
let drewCalorimeter = false;
function drawCalorimeter() {
    drewCalorimeter = true;
    recordedMetalTemps.push(metalTemp);
    recordedWaterTemps.push(waterTemp);
    showCalorimeter(metalMass, metalC, waterMass, waterC, recordedMetalTemps, recordedWaterTemps);
}
