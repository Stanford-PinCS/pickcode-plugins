// ========================================================
// Change the 'n' value below to see how adding 
// more rectangles makes our area approximation perfect. Notice
// how the 'n' value is used both to determine the width of each rectangle
// and the number of rectangles to draw in the for loop.
//
// NOTE: You only need to edit the line 'let n = 5;'. Feel free to read 
// the other comments to see how the "For Loop" does the math!
// ========================================================

let n = 5; // <--- CHANGE THIS! Try 10, 50, or 500.

drawCurve();
setColor("orange");

let dx = (xmax - xmin) / n;
let area = 0;

for (let i = 0; i < n; i++) {
    // 1. Find the x-coordinate of the LEFT side of rectangle #i
    let xLeft = xmin + i * dx;

    // 2. Use the function f(x) = x² to find the height at this spot
    let height = xLeft * xLeft;

    // 3. DRAW: Render the rectangle on the graph
    drawRect(xLeft, dx, height);
    
    // 4. ACCUMULATE: Add this rectangle's area to our "running total"
    area += height * dx;
}

// Display the final result in the graph
showArea(area);