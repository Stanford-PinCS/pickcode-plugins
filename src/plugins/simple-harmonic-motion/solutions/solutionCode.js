// Workbench 1 — Static Method (Hooke's Law).
// Goal: measure k by hanging masses and reading displacements.
// Then plot mg vs x (in your head — really, do it on paper if it helps),
// and the slope of that line is k.

function logTable(label, rows) {
  console.log(`${label}\n${JSON.stringify(rows, null, 2)}`);
}

// Slope of best-fit line through the origin: y = k * x
// Formula: slope = sum(x * y) / sum(x * x)
function linearFitSlope(xs, ys) {
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += xs[i] * ys[i];
    sxx += xs[i] * xs[i];
  }
  return sxy / sxx;
}

const G = 9.81;
const masses = [0.100, 0.150, 0.200, 0.250, 0.300]; // kg

// Step 1 — collect (m, x) data by hanging each mass and reading displacement.
const rows = [];
for (const m of masses) {
  const x = springLab.measureDisplacement(m);
  rows.push({ m, x });
}

logTable("Static method data", rows);

// Step 2 — feed (x, mg) into linearFitSlope to get k.
// Remember: the y-axis is FORCE (m * g), not mass alone.
const xs = rows.map(r => r.x);
const ys = rows.map(r => r.m * G);
const kStatic = linearFitSlope(xs, ys);

console.log(`k_static = ${kStatic.toFixed(2)} N/m`);

// Step 3 — visualize. Pick any mass to animate on screen.
const model = springLab.createModel({
  inputs: { method: "static", masses, rows, activeMass: 0.200 },
  display: { showEquilibriumLine: true },
});
springLab.run(model);
