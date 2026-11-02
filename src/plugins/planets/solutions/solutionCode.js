// Your solar system: where each planet orbits, and how fast it goes around.
// Change the radii or the orbitSpeed rule, then press Run.

let planetRadii = [500, 1000, 1500, 2000];

// Returns how fast a planet at this radius goes around the sun.
function orbitSpeed(radius) {
    return 10 * (1000 / radius) ** 1.5;
}

// Put a planet at each radius, using orbitSpeed to set its speed.
buildSolarSystem(planetRadii, orbitSpeed);
