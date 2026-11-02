# This code finds ΔG for a reaction at many temperatures.
# Read it, then press Run.

deltaH = 6.01    # kJ/mol
deltaS = 22.0    # J/(mol·K)

for temperature in range(250, 301, 5):
    deltaG = deltaH - temperature * deltaS / 1000   # ÷ 1000 turns J into kJ
    label = "nonspontaneous"
    if deltaG < 0:
        label = "spontaneous"

    # Send this temperature's point to the chart.
    plotPoint(temperature, deltaG, label)

# Play every point back on the chart, one temperature at a time.
drawGibbsChart()
