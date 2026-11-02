// Hang a mass on a spring and watch it bounce.
// Change mass or the weight function, then press Run.

// Weight is how hard gravity pulls the mass down, in newtons.
function weight(mass) {
    return mass * 9.81;
}

let mass = 0.2; // kilograms

// Hang the mass on the spring, using your weight function, and let it bounce.
hangMass(mass, weight);
