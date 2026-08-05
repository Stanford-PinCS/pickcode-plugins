function getNextPosition(currentPosition, currentVelocity, timestep, getDrag) {
  // getDrag returns acceleration caused by air resistance.
  const dragAcceleration = getDrag(currentVelocity);

  const accelerationX = dragAcceleration.x;
  const accelerationY = dragAcceleration.y - 9.81;

  // Update position using the current velocity.
  const nextPosX = currentPosition.x + timestep * currentVelocity.x;
  const nextPosY = currentPosition.y + timestep * currentVelocity.y;

  // Update velocity using acceleration.
  const nextVelX = currentVelocity.x + timestep * accelerationX;
  const nextVelY = currentVelocity.y + timestep * accelerationY;

  return {
    x: nextPosX,
    y: nextPosY,
    xVel: nextVelX,
    yVel: nextVelY,
  };
}

runSimulation(getNextPosition, 0.05);
