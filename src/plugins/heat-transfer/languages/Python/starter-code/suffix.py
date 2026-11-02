# Older lessons have no drawCalorimeter() line in main, so draw for them here.
if not drewCalorimeter[0]:
    recordedMetalTemps.append(metalTemp)
    recordedWaterTemps.append(waterTemp)
    show_calorimeter(metalMass, metalC, waterMass, waterC, recordedMetalTemps, recordedWaterTemps)
