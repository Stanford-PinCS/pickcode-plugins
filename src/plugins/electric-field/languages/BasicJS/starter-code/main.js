// Electric Field Simulation — starter code
// ─────────────────────────────────────────
// createParticle(x, y, q)
//   x, y : position in the canvas, 0.0 (left/top) to 1.0 (right/bottom)
//   q     : charge — positive (+) = red, negative (−) = blue
//           magnitude scales field strength (e.g. +2 is twice as strong as +1)

// Classic electric dipole: one positive, one negative
createParticle(0.35, 0.5, +1);
createParticle(0.65, 0.5, -1);

// ─── Try these other configurations: ───────────────────────────────────────

// // Two like charges (repel each other)
// createParticle(0.35, 0.5, +1);
// createParticle(0.65, 0.5, +1);

// // Four charges at the corners of a square
// createParticle(0.3, 0.3, +2);
// createParticle(0.7, 0.3, -2);
// createParticle(0.3, 0.7, -2);
// createParticle(0.7, 0.7, +2);

// // Three charges in a triangle
// createParticle(0.5,  0.25, +3);
// createParticle(0.3,  0.7,  -1);
// createParticle(0.7,  0.7,  -1);

// // Clear everything and start fresh
// clearParticles();