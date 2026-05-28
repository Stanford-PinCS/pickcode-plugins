function calculate_absorbance() {
  // These are the chemistry values.
  let epsilon = 1.5;
  let pathLength = 1.0;
  let concentration = 0.30;

  // TODO: Change this line.
  // Hint: absorbance = epsilon * pathLength * concentration
  let absorbance = 0;

  return {
    epsilon: epsilon,
    pathLength: pathLength,
    concentration: concentration,
    absorbance: absorbance
  };
}

proceed(calculate_absorbance);