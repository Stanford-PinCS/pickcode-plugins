// This code finds ΔG for a reaction at many temperatures.
// Read it, then press Run.

let deltaH = -92.2;   // kJ/mol
let deltaS = -198.3;  // J/(mol·K)

for (let temperature = 200; temperature <= 1000; temperature += 50) {
    let deltaG = deltaH - temperature * deltaS / 1000;   // ÷ 1000 turns J into kJ
    let label = "spontaneous";

    // Send this temperature's point to the chart.
    plotPoint(temperature, deltaG, label);
}

// Play every point back on the chart, one temperature at a time.
drawGibbsChart();
