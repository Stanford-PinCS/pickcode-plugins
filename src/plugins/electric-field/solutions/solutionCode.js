// Each charge has a spot (x and y, from 0 to 1) and a charge (+ or -).
// Change, add or remove charges in the list, then press Run.

let charges = [
  {x: 0.35, y: 0.5, charge: 2},
  {x: 0.65, y: 0.5, charge: -1},
  {x: 0.5, y: 0.25, charge: -1}
];

// Place every charge in the list and draw the electric field.
placeCharges(charges);
