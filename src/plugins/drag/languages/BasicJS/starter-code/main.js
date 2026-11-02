// Predict a tennis ball's flight: what speeds it up or slows it down.
// Change getAcceleration or the timestep, then press Run.

let timestep = 0.05;

// The push from air resistance. The wind blows at the ball at 12 m/s.
function getDrag(velocity) {
    let airX = velocity.x + 12;
    let airY = velocity.y;
    let airSpeed = Math.sqrt(airX * airX + airY * airY);
    let strength = 0.0211 * airSpeed;
    return { x: -strength * airX, y: -strength * airY };
}

// Returns the ball's acceleration for its current velocity.
function getAcceleration(velocity) {
    let gravity = 9.81;
    return { x: 0, y: -gravity };
}

// Launch the ball and draw your prediction next to the real flight.
launchBall(getAcceleration, timestep);
