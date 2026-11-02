// Hidden helpers. plotPoint saves each point your loop sends. After your code
// finishes, drawGibbsChart (the last line of main) animates them on the chart.
const gibbsPoints = { temperatures: [], deltaGs: [], labels: [] };

function plotPoint(temperature, deltaG, label) {
    if (typeof temperature !== "number" || !Number.isFinite(temperature) || temperature <= 0) {
        throw new Error(
            `plotPoint expects a temperature in kelvin above 0, like 300, but got ${String(temperature)}.`
        );
    }
    if (typeof deltaG !== "number" || !Number.isFinite(deltaG)) {
        throw new Error(
            `plotPoint expects deltaG to be a number, but at ${temperature} K it got ${String(deltaG)}.`
        );
    }
    const cleaned = typeof label === "string" ? label.trim().toLowerCase() : "";
    if (cleaned !== "spontaneous" && cleaned !== "nonspontaneous" && cleaned !== "not spontaneous") {
        throw new Error(
            `plotPoint expects label to be "spontaneous" or "nonspontaneous", but at ${temperature} K it got ${JSON.stringify(label)}.`
        );
    }
    if (gibbsPoints.temperatures.length >= 1000) {
        throw new Error("Your loop sent more than 1000 points. Use a bigger step, like 50.");
    }
    gibbsPoints.temperatures.push(temperature);
    gibbsPoints.deltaGs.push(deltaG);
    gibbsPoints.labels.push(cleaned);
}

let drewGibbsChart = false;
function drawGibbsChart() {
    drewGibbsChart = true;
    if (gibbsPoints.temperatures.length === 0) {
        throw new Error(
            "Your loop didn't send any points. Check the start, end, and step of your for loop."
        );
    }
    showGibbs(gibbsPoints.temperatures, gibbsPoints.deltaGs, gibbsPoints.labels);
}
