// summonCells(n) brings n cells onto the tray.
// Each cell has its own size, roundness, and hidden cancer status.
summonCells(10); // try summoning more cells

// You can check cell measurements by using checkCell(n).
// n is the cell number of each cell.
// The measurements show up under the cell.
// The left number is the size, right number is the roundness.
checkCell(1); // try checking other cells

// revealCancer(n) checks if the cell is cancerous or not.
// It will draw a red outline around the cell if it is cancerous.
// A teal outline means the cell is not cancerous.
revealCancer(1); //try revealing other cells

// Use addExample() to plot a cell's info onto the data graph.
// The inputs are: cell number, size, roundness, label
// The label has to be "cancer" or "no-cancer"
addExample(1, 8, 6, "cancer");
// addExample(2, size, roundness, cancer?); // fill this in!

// Use this to check and reveal many cells at once.
const bound = 2; // change this to check more cells
for (let index = 1; index <= bound; index++) {
  checkCell(index);
  revealCancer(index);
}