// The reaction N2O4 <=> 2NO2, starting from these concentrations (mol/L).
// Read it, then press Run. The steps ask you to change the values and chooseDirection.

let startN2O4 = 1.0;
let startNO2 = 0.0;
let K = 0.36;
let addN2O4 = 0; // extra N2O4 to add after it settles

// Return "forward", "reverse", or "equilibrium".
function chooseDirection(Q, K) {
    if (Q < K) {
        return "forward";
    } else {
        return "equilibrium";
    }
}

// Run the reaction, asking chooseDirection which way to go on every pass.
runReaction(startN2O4, startNO2, K, addN2O4, chooseDirection);
