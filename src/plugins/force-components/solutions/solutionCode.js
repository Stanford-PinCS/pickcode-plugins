// This force pushes at an angle. getComponents splits it into x and y parts.
// Fill in xComponent and yComponent, then press Run.

let magnitude = 100; // how strong the force is
let angle = 150;     // degrees, counterclockwise from the +x axis

function getComponents(magnitude, angle) {
  let radians = angle * Math.PI / 180;
  let xComponent = magnitude * Math.cos(radians);
  let yComponent = magnitude * Math.sin(radians);
  return [xComponent, yComponent];
}

// Draw the force, then the x and y parts your function returns.
drawForceComponents(magnitude, angle, getComponents);
