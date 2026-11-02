// These forces all push on one object at the origin.
// Fill in sumForces so it adds them up into one net force.

let forces = [
  {x: 10, y: 10},
  {x: -15, y: -5},
  {x: -15, y: 5},
  {x: 20, y: 0}
];

function sumForces(forces) {
  let netForce = {x: 0, y: 0};
  for (let force of forces) {
    netForce.x = netForce.x + force.x;
    netForce.y = netForce.y + force.y;
  }
  return netForce;
}

// Draw each force in teal, then the net force from sumForces in pink.
drawForces(forces, sumForces);
