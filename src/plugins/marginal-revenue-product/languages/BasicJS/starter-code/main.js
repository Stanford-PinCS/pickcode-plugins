// This code decides how many pickers an apple orchard hires and draws their MRPs.
// Change pickersToHire so it hires only pickers who add more than they cost.

// Total product: crates of apples picked per day by 0 to 8 pickers.
let totalProduct = [0, 20, 38, 53, 65, 74, 80, 83, 83];
let price = 5;   // the market price of apples, in dollars per crate
let wage = 50;   // the market wage, in dollars per picker per day

// Returns how many pickers the orchard hires. The loop hires them one at a time.
function pickersToHire(totalProduct, price, wage) {
    let pickers = 0;
    while (pickers < totalProduct.length - 1) {
        pickers = pickers + 1;
    }
    return pickers;
}

// Find how many pickers to hire, then draw each picker's MRP and the wage.
runHiring(totalProduct, price, wage, pickersToHire);
