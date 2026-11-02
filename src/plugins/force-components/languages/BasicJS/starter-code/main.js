// This force pushes at an angle. getComponents splits it into x and y parts.
// Fill in xComponent and yComponent, then press Run.

let magnitude = 100; // how strong the force is
let angle = 35;      // degrees, counterclockwise from the +x axis

function getComponents(magnitude, angle) {
  let xComponent = 0;
  let yComponent = 0;
  return [xComponent, yComponent];
}

// Draw the force, then the x and y parts your function returns.
drawForceComponents(magnitude, angle, getComponents);
