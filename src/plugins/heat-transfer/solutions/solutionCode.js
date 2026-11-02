// A hot copper block is dropped into cool water. Heat flows until they match.
// Read it, then press Run.

let metalMass = 200;    // grams
let metalC = 0.897;     // specific heat in J/(g·°C). Aluminum: 0.897
let metalTemp = 90;     // °C

let waterMass = 100;    // grams
let waterC = 4.18;      // specific heat of water in J/(g·°C)
let waterTemp = 20;     // °C

// Keep going while the metal is hotter than the water.
while (metalTemp - waterTemp > 10) {
    recordTemps(metalTemp, waterTemp);   // save this pass for the drawing
    let q = 2;   // joules of heat that move this pass
    metalTemp = metalTemp - q / (metalMass * metalC);
    waterTemp = waterTemp + q / (waterMass * waterC);
}

// Draw every saved pass on the right.
drawCalorimeter();
