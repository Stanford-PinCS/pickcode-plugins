// Change totalSteps and run again.
let totalSteps = 20;

let values = [];
for (let i = 1; i <= totalSteps; i++) {
    values.push(i / totalSteps);
}

setReference(1.0);
plotSeries(values);
