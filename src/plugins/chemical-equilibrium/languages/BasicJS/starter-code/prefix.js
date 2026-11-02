// Hidden helper for N2O4 <=> 2NO2. A while loop calls the student's
// chooseDirection(Q, K) and reacts a little in the direction it returns,
// until it returns "equilibrium" or the loop reaches its pass limit.
// If addN2O4 is above 0, it then adds that much N2O4 and runs the loop again.
function runReaction(startN2O4, startNO2, K, addN2O4, chooseDirection) {
    const STEP_LIMIT = 50; // most passes one while loop may take
    const RATE_STEP = 0.1; // how much of the net reaction rate happens per pass
    const MIN_STEP = 0.002; // smallest amount (mol/L of N2O4) that reacts per pass

    const checkAmount = (value, name) => {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 5) {
            throw new Error(`${name} should be a concentration from 0 to 5, like 1.0.`);
        }
    };
    checkAmount(startN2O4, "startN2O4");
    checkAmount(startNO2, "startNO2");
    checkAmount(addN2O4, "addN2O4");
    if (startN2O4 === 0 && startNO2 === 0) {
        throw new Error("Put some N2O4 or NO2 in the container: startN2O4 and startNO2 can't both be 0.");
    }
    if (typeof K !== "number" || !Number.isFinite(K) || K <= 0 || K > 100) {
        throw new Error("K should be a number greater than 0, like 0.36.");
    }
    if (typeof chooseDirection !== "function") {
        throw new Error("runReaction needs your chooseDirection function as its last input.");
    }

    let n2o4 = startN2O4;
    let no2 = startNO2;
    const n2o4Values = [];
    const no2Values = [];
    const answers = [];
    let addAt = -1;

    // Q = [NO2]^2 / [N2O4]. With no N2O4 at all, Q is infinitely large.
    const reactionQuotient = () => (n2o4 > 0 ? (no2 * no2) / n2o4 : Infinity);

    const ask = () => {
        const answer = chooseDirection(reactionQuotient(), K);
        if (answer !== "forward" && answer !== "reverse" && answer !== "equilibrium") {
            throw new Error(
                `chooseDirection returned ${JSON.stringify(answer)}, but it should return ` +
                    '"forward", "reverse", or "equilibrium".'
            );
        }
        n2o4Values.push(n2o4);
        no2Values.push(no2);
        answers.push(answer);
        return answer;
    };

    const runLoop = () => {
        let passes = 0;
        let direction = ask();
        while (direction !== "equilibrium" && passes < STEP_LIMIT) {
            // Forward rate minus reverse rate sets how much reacts: a lot when
            // far from equilibrium, a little when close.
            const netRate = Math.abs(K * n2o4 - no2 * no2);
            let amount = Math.max(MIN_STEP, netRate * RATE_STEP);
            if (direction === "forward") {
                amount = Math.min(amount, n2o4);
                n2o4 = n2o4 - amount;
                no2 = no2 + 2 * amount;
            } else {
                amount = Math.min(amount, no2 / 2);
                n2o4 = n2o4 + amount;
                no2 = no2 - 2 * amount;
            }
            passes = passes + 1;
            direction = ask();
        }
    };

    runLoop();
    if (addN2O4 > 0) {
        // Le Chatelier: disturb the mixture, then let the loop shift it again.
        n2o4 = n2o4 + addN2O4;
        addAt = n2o4Values.length;
        runLoop();
    }

    showReaction(n2o4Values, no2Values, answers, K, addAt, STEP_LIMIT);
}
