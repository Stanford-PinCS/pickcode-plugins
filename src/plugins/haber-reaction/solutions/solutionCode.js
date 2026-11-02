// Mix hydrogen and nitrogen to make ammonia: N2 + 3H2 -> 2NH3.
// Change h2 and n2, then make findLimiting give the right answer.

let h2 = 6; // moles of hydrogen
let n2 = 2; // moles of nitrogen

// Return the gas that runs out first: "h2", "n2", or "neither".
function findLimiting(h2, n2) {
    if (n2 < h2 / 3) {
        return "n2";
    } else if (n2 > h2 / 3) {
        return "h2";
    } else {
        return "neither";
    }
}

// React the gases and check your answer.
reactGases(h2, n2, findLimiting);
