# This code finds ΔG for a reaction at many temperatures.
# Read it, then press Run.

deltaH = -92.2   # kJ/mol
deltaS = -198.3  # J/(mol·K)

for temperature in range(200, 1001, 50):
    deltaG = deltaH - temperature * deltaS / 1000   # ÷ 1000 turns J into kJ
    label = "spontaneous"

    # Send this temperature's point to the chart.
    plotPoint(temperature, deltaG, label)

# Play every point back on the chart, one temperature at a time.
drawGibbsChart()
