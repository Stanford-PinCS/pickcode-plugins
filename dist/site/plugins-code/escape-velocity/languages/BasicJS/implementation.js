const MU = 15000;
const R0 = 100;
const DT = 0.05;
const MAX_STEPS = 1400;
const CANVAS_HALF = 250; // stop if object exits this radius from center
const createExports = (sendMessage) => {
    return Promise.resolve({
        /**
         * Runs a 2-D Euler gravity integration and evaluates the student's escape velocity formula.
         *
         * @param rawV0 - Initial tangential speed (pixels/s). Non-finite values default to 1.
         * @param isEscapingFn - Student-supplied function (v, mu, r) => boolean.
         *
         * @example
         * runSimulation(10.0, isEscaping);
         */
        runSimulation: (rawV0, isEscapingFn) => {
            // --- Sanitize v0 ---
            const v0 = typeof rawV0 === "number" && isFinite(rawV0) ? rawV0 : 1;
            // --- Euler integration ---
            const trajectory = [];
            let px = R0;
            let py = 0;
            let vx = 0;
            let vy = v0;
            for (let i = 0; i < MAX_STEPS; i++) {
                trajectory.push({ x: px, y: py });
                const dist = Math.sqrt(px * px + py * py);
                if (dist < 4)
                    break; // swallowed by central body
                if (dist > CANVAS_HALF)
                    break; // escaped canvas
                const accel = -MU / (dist * dist * dist);
                vx += accel * px * DT;
                vy += accel * py * DT;
                px += vx * DT;
                py += vy * DT;
            }
            // --- True escape velocity ---
            const trueEscapeVelocity = Math.sqrt((2 * MU) / R0);
            const escapes = v0 >= trueEscapeVelocity;
            // --- Evaluate student formula ---
            let studentPrediction = null;
            let studentFormulaCorrect = false;
            let studentFormulaError = false;
            if (typeof isEscapingFn === "function") {
                try {
                    const fn = isEscapingFn;
                    // What does the student's function predict for this specific v0?
                    const raw = fn(v0, MU, R0);
                    studentPrediction = raw === true ? true : raw === false ? false : null;
                    // Is the formula correct in general? Test at the boundary.
                    const testAbove = fn(trueEscapeVelocity * 1.01, MU, R0) === true;
                    const testBelow = fn(trueEscapeVelocity * 0.99, MU, R0) === false;
                    studentFormulaCorrect = testAbove && testBelow;
                }
                catch {
                    studentFormulaError = true;
                }
            }
            else {
                studentFormulaError = true;
            }
            sendMessage({
                v0,
                mu: MU,
                r0: R0,
                trueEscapeVelocity,
                studentPrediction,
                studentFormulaCorrect,
                studentFormulaError,
                trajectory,
                escapes,
            });
        },
    });
};
export default createExports;
