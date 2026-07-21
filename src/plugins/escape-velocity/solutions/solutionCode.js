const v0 = 10.0; // starting speed — try changing this!

function isEscaping(v, mu, r) {
  return v >= Math.sqrt((2 * mu) / r);
}

runSimulation(v0, isEscaping);
