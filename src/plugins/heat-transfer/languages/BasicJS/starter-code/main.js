// A hot copper block is dropped into cool water. Heat flows until they match.
// Read it, then press Run.

let metalMass = 50;     // grams
let metalC = 0.385;     // specific heat in J/(g·°C). Copper: 0.385
let metalTemp = 90;     // °C

let waterMass = 100;    // grams
let waterC = 4.18;      // specific heat of water in J/(g·°C)
let waterTemp = 20;     // °C

// Keep going while the metal is hotter than the water.
while (metalTemp - waterTemp > 0.1) {
    recordTemps(metalTemp, waterTemp);   // save this pass for the drawing
    metalTemp = metalTemp - 0.1;
    waterTemp = waterTemp + 0.1;
}

// Draw every saved pass on the right.
drawCalorimeter();
