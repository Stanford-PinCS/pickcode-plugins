# Hidden helper. Your while loop calls recordTemps once per pass. When your
# code ends, the hidden suffix adds the final temperatures and draws.
recordedMetalTemps = []
recordedWaterTemps = []


def recordTemps(metalTemp, waterTemp):
    for value in (metalTemp, waterTemp):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError("recordTemps needs two numbers: recordTemps(metalTemp, waterTemp).")
    if len(recordedMetalTemps) >= 100000:
        raise RuntimeError(
            "Your while loop has run 100000 times without stopping. "
            "Make sure each pass moves metalTemp and waterTemp closer together."
        )
    recordedMetalTemps.append(metalTemp)
    recordedWaterTemps.append(waterTemp)


# Called by the last line of main: adds the final temperatures and draws.
drewCalorimeter = [False]


def drawCalorimeter():
    drewCalorimeter[0] = True
    recordedMetalTemps.append(metalTemp)
    recordedWaterTemps.append(waterTemp)
    show_calorimeter(metalMass, metalC, waterMass, waterC, recordedMetalTemps, recordedWaterTemps)
