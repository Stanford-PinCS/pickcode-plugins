// Hidden helpers. runBanks checks the numbers, runs the student's createMoney function, and sends the chain of banks to the plot on the right. createMoney's loop calls addBank once for each bank, and addBank checks that bank's deposit and loan before adding it to the chain.
const { runBanks, addBank } = (() => {
    // A new deposit from $10 to $1,000,000 and a required reserve ratio from 0.05 to 1 keep every chain on the plot: a loop that stops once the deposit is $1 or less then goes through at most 270 banks.
    const MIN_DEPOSIT = 10;
    const MAX_DEPOSIT = 1000000;
    const MIN_RATIO = 0.05;
    // The most banks the plot draws, which also stops a loop that would never end.
    const MAX_BANKS = 300;

    // The chain createMoney is building while runBanks runs it, and null the rest of the time.
    let chain = null;

    // Shows a value the way the student wrote it: text in quotes, lists in brackets and objects in braces, much as Python does.
    function show(value) {
        if (typeof value === "string") return JSON.stringify(value);
        if (Array.isArray(value)) return `[${value.map(show).join(", ")}]`;
        if (typeof value === "function") return "a function";
        if (value !== null && typeof value === "object") {
            try {
                return JSON.stringify(value);
            } catch (e) {
                return "an object";
            }
        }
        return String(value);
    }

    // Dollars with thousands separators, and cents only when they aren't zero: $800, $1.24.
    function money(value) {
        const cents = Math.round(Math.abs(value) * 100);
        const dollars = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const text = cents % 100 === 0 ? dollars : `${dollars}.${String(cents % 100).padStart(2, "0")}`;
        return `${value < 0 && cents > 0 ? "−" : ""}$${text}`;
    }

    // A dollar amount rounded to the nearest 1 ÷ scale of a dollar, as a whole number with its sign: 262144 for $262.144 at scale 1000.
    function units(value, scale) {
        const n = Math.round(Math.abs(value) * scale);
        return value < 0 ? -n : n;
    }

    // Dollars with thousands separators and exactly `digits` decimals: $262.144.
    function preciseMoney(value, digits) {
        const scale = 10 ** digits;
        const n = Math.abs(units(value, scale));
        const dollars = String((n - (n % scale)) / scale).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return `${value < 0 && n > 0 ? "−" : ""}$${dollars}.${String(n % scale).padStart(digits, "0")}`;
    }

    // Two different dollar amounts for an error message, as text, and how far apart they are. withinACent is true when they're at most a cent apart, allowing for floating-point rounding (8.1 − 0.81 comes out as 7.289999999999999, which rounds down to 7.28). underACent is true when they're less than a cent apart by more than that rounding; then both get the fewest decimals, from 3 up, that show them less than a cent apart ($3.910 and $3.905), so a message never reads "should be $262.14, but addBank got $262.14" or calls $3.91 and $3.90 less than a cent apart. Otherwise both show to the cent.
    function amounts(a, b) {
        const withinACent = Math.abs(a - b) <= 0.01 + 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
        for (let digits = 3; digits <= 9; digits++) {
            const scale = 10 ** digits;
            const gap = Math.abs(units(a, scale) - units(b, scale));
            if (gap > 0 && gap < scale / 100) return { a: preciseMoney(a, digits), b: preciseMoney(b, digits), withinACent, underACent: true };
        }
        // Amounts a cent apart can still round to the same cent when each sits on a half cent, so then they get 3 decimals.
        if (money(a) === money(b)) return { a: preciseMoney(a, 3), b: preciseMoney(b, 3), withinACent, underACent: false };
        return { a: money(a), b: money(b), withinACent, underACent: false };
    }

    // Two dollar amounts that differ only by floating-point rounding count as equal.
    function close(a, b) {
        return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
    }

    function runBanks(newDeposit, reserveRatio, createMoney) {
        // NaN fails every comparison, and Infinity is past the limit, so these catch both.
        if (typeof newDeposit !== "number" || !(newDeposit >= MIN_DEPOSIT && newDeposit <= MAX_DEPOSIT)) {
            throw new Error(`newDeposit should be a number of dollars from ${MIN_DEPOSIT} to ${MAX_DEPOSIT}, but it's ${show(newDeposit)}.`);
        }
        if (typeof reserveRatio !== "number" || !(reserveRatio >= MIN_RATIO && reserveRatio <= 1)) {
            throw new Error(`reserveRatio should be a number from ${MIN_RATIO} to 1, like 0.2 for 20%, but it's ${show(reserveRatio)}.`);
        }
        if (typeof createMoney !== "function") {
            throw new Error("runBanks needs your createMoney function as its last input.");
        }

        chain = { newDeposit, reserveRatio, deposits: [], loans: [] };
        let finished;
        try {
            createMoney(newDeposit, reserveRatio);
        } finally {
            finished = chain;
            chain = null;
        }
        if (finished.deposits.length === 0) {
            throw new Error("createMoney didn't add any banks. Its loop should run while the deposit is more than $1 and call addBank(deposit, loan) once for each bank.");
        }
        showChain(reserveRatio, finished.deposits, finished.loans);
    }

    function addBank(deposit, loan) {
        if (chain === null) {
            throw new Error("addBank only works inside createMoney, while runBanks runs it.");
        }
        const bank = chain.deposits.length + 1;
        if (bank > MAX_BANKS) {
            throw new Error(`Your loop is still going after ${MAX_BANKS} banks. Make sure its condition stops it once the deposit gets small, the way deposit > 1 does.`);
        }
        if (typeof deposit !== "number" || !Number.isFinite(deposit)) {
            throw new Error(`addBank's first input should be the bank's deposit, a number of dollars, but for Bank ${bank} it's ${show(deposit)}.`);
        }
        if (typeof loan !== "number" || !Number.isFinite(loan)) {
            throw new Error(`addBank's second input should be the bank's loan, a number of dollars, but for Bank ${bank} it's ${show(loan)}.`);
        }
        if (bank === 1 && !close(deposit, chain.newDeposit)) {
            const shown = amounts(chain.newDeposit, deposit);
            const fix = shown.withinACent ? "Set deposit to newDeposit itself, without rounding." : "Start the loop with deposit set to newDeposit, and call addBank before the line that passes the loan on.";
            throw new Error(`Bank 1's deposit should be the new deposit, ${shown.a}, but addBank got ${shown.b}. ${fix}`);
        }
        if (bank > 1) {
            const previousLoan = chain.loans[bank - 2];
            if (!close(deposit, previousLoan)) {
                const shown = amounts(previousLoan, deposit);
                const fix = shown.withinACent ? "Set deposit to the loan itself, without rounding." : "Each loan is deposited in the next bank, so the loop's last line should set deposit to the loan.";
                throw new Error(`Bank ${bank}'s deposit should be Bank ${bank - 1}'s loan, ${shown.a}, but addBank got ${shown.b}. ${fix}`);
            }
        }
        // A loan may miss $0 or the excess reserves by floating-point rounding (a billionth of the deposit), but by no more.
        const tolerance = 1e-9 * Math.max(1, deposit);
        if (loan < -tolerance) {
            const shown = amounts(loan, 0);
            const fix = shown.underACent
                ? "That's less than a cent below $0, which rounding to the nearest cent can cause. Don't round the reserves or the loan."
                : "Check the line that sets loan: a bank lends from $0 up to its excess reserves, and a share such as holdRatio should be like 0.05 for 5%.";
            throw new Error(`Bank ${bank}'s loan is ${shown.a}, but a loan can't be less than $0. ${fix}`);
        }
        const required = deposit * chain.reserveRatio;
        const excess = deposit - required;
        if (loan > excess + tolerance) {
            const shown = amounts(loan, excess);
            const why = shown.underACent
                ? "That's less than a cent too much, which rounding to the nearest cent can cause. Don't round the reserves or the loan."
                : `A bank has to keep its required reserves: ${chain.reserveRatio} × ${money(deposit)} = ${money(required)}.`;
            throw new Error(`Bank ${bank} lent ${shown.a}, but its excess reserves are only ${shown.b}. ${why}`);
        }
        chain.deposits.push(deposit);
        // A loan a hair below $0 is floating-point rounding, as when a bank holds all its excess reserves, so it counts as $0.
        chain.loans.push(Math.max(0, loan));
    }

    return { runBanks, addBank };
})();
