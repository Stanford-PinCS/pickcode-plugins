// Body A (pink) slides right toward body B (teal). These numbers set up the crash.
// Change the masses, speeds, or bounciness, then press Run.

let massA = 1;        // kilograms
let speedA = 210;     // pixels per second (+ is right, - is left)
let massB = 1;
let speedB = 0;
let bounciness = 0.92; // 1 = perfect bounce, 0 = no bounce

// Crash the two bodies together and measure momentum before and after.
collide(massA, speedA, massB, speedB, bounciness);
