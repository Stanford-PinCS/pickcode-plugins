// Older lessons have no drawCalorimeter() line in main, so draw for them here.
if (!drewCalorimeter) {
    recordedMetalTemps.push(metalTemp);
    recordedWaterTemps.push(waterTemp);
    showCalorimeter(metalMass, metalC, waterMass, waterC, recordedMetalTemps, recordedWaterTemps);
}
