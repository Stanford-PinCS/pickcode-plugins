// You are given two wave functions, rightward and leftward. Each one takes
// a position and a time, and returns one height.

// sample() is handed a wave function as `f`, then calls it at every point
// on the string. Change which function you pass in, and you get a different
// wave back — without changing a single line inside the loop.

function sample(f, t) {
    const heights = [];
    for (let i = 0; i < STRING_POINTS; i++) {
        heights.push(f(xAt(i), t));
    }
    return heights;
}

// add() combines two lists by walking them together, point by point.

function add(a, b) {
    const total = [];
    for (let i = 0; i < a.length; i++) {
        // TODO 1: push the sum of a[i] and b[i] onto total.
    }
    return total;
}

// stringAt() says what the whole string looks like at one moment in time.

function stringAt(t) {
    // TODO 2: return the two waves sampled and added together.
    return sample(rightward, t);
}

animate(stringAt);
