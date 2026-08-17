// Standing Wave Studio — worked solution.
// Expect 5 nodes and a wavelength of 5.00 m.

function sample(f, t) {
    const heights = [];
    for (let i = 0; i < STRING_POINTS; i++) {
        heights.push(f(xAt(i), t));
    }
    return heights;
}

function add(a, b) {
    const total = [];
    for (let i = 0; i < a.length; i++) {
        total.push(a[i] + b[i]); // TODO 1
    }
    return total;
}

function stringAt(t) {
    return add(sample(rightward, t), sample(leftward, t)); // TODO 2
}

animate(stringAt);

// ── The experiment at the end ─────────────────────────────────────────
// Pass rightward twice instead. Nothing inside sample() or add() changes —
// only the function being handed to sample() does. Two waves going the
// same way never cancel, so the node count drops to 0 and the dashed
// envelope goes flat.
//
// function stringAt(t) {
//     return add(sample(rightward, t), sample(rightward, t));
// }
