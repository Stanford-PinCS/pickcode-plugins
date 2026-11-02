import { Message } from "../../messages";

/** Seconds of the session with the food dispenser on, then off. */
const FOOD_ON_S = 60;
const SESSION_S = 100;
/** How many presses the prefix asks shouldReward about. More than a rat can make in FOOD_ON_S. */
const MAX_PRESSES = 300;
/** Seconds the rat spends eating each pellet. */
const EAT_S = 1;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const spread = (xs: number[]) => {
    const m = mean(xs);
    return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

/**
 * A simulated rat that learns from the rewards it gets. It never sees the
 * schedule, only which presses paid off, and responds the way lab animals do:
 *  - Needing more presses per pellet makes it press faster (ratio schedules
 *    produce high response rates).
 *  - When pellets come after a predictable number of presses (fixed ratio),
 *    it rests after each pellet: the post-reinforcement pause. The bigger the
 *    ratio, the longer the pause. Unpredictable rewards (variable ratio)
 *    leave no reason to pause.
 *  - Once pellets stop, it keeps pressing for about as long as dry spells
 *    used to last, then slows and gives up (extinction). Rewards that came
 *    after long, uneven dry spells make it much more persistent: the reason
 *    variable-ratio behavior resists extinction.
 */
function simulate(rewards: boolean[]) {
    const pressTimes: number[] = [];
    const rewarded: number[] = [];
    const gaps: number[] = [];
    let longestGap = 0;
    let sinceReward = 0;
    let t = 0.5;

    while (t < SESSION_S && pressTimes.length < 1000) {
        const pressNumber = pressTimes.length + 1;
        const reward = t < FOOD_ON_S && (rewards[pressNumber - 1] ?? false);
        pressTimes.push(Number(t.toFixed(3)));
        rewarded.push(reward ? 1 : 0);
        sinceReward++;

        const recent = gaps.slice(-6);
        // Before the first pellet, the rat presses at a middling rate.
        const pressesPerPellet = recent.length ? mean(recent) : 3;
        const rate = 1 + 0.6 * clamp((pressesPerPellet - 1) / 4, 0, 1);
        const pressGap = () => (0.7 + 0.6 * Math.random()) / rate;

        if (reward) {
            gaps.push(sinceReward);
            longestGap = Math.max(longestGap, sinceReward);
            sinceReward = 0;
            const latest = gaps.slice(-6);
            const avg = mean(latest);
            const predictable = latest.length >= 2 ? clamp(1 - (1.5 * spread(latest)) / avg, 0, 1) : 0.5;
            const pause = 0.7 * (avg - 1) * predictable;
            t += EAT_S + pause + pressGap();
        } else {
            // A dry spell longer than usual makes the rat slow down, and a much
            // longer one makes it stop. Before a few rewards have come, it has
            // nothing to judge by and keeps trying for a while.
            const unevenness = gaps.length ? spread(gaps) : 0;
            const patience = Math.max(
                1.5 * longestGap + 2 + 2 * unevenness,
                gaps.length < 4 ? 30 : 0
            );
            const over = sinceReward - patience;
            const vigor = over > 0 ? Math.exp(-over / (longestGap + 4 + 2 * unevenness)) : 1;
            if (vigor < 0.06) break; // the rat stops pressing
            // Once a pellet is overdue, it also stops now and then to check the
            // empty tray.
            const overdue = sinceReward > 2 * (gaps.length ? mean(gaps) : 3) + 1;
            t += pressGap() / (vigor * (overdue ? 0.7 : 1));
        }
    }
    return { pressTimes, rewarded };
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Runs one Skinner box session. `rewards` has one entry per press
         * number, starting at press 1: 1 (or true) if that press earns a
         * pellet, 0 (or false) if not.
         */
        showSkinnerBox: (rewards: unknown) => {
            const message = `showSkinnerBox expects a list of ${MAX_PRESSES} 1s and 0s, one per lever press.`;
            if (
                rewards == null ||
                typeof rewards === "string" ||
                typeof (rewards as Iterable<unknown>)[Symbol.iterator] !== "function"
            ) {
                throw new Error(message);
            }
            const list = Array.from(rewards as Iterable<unknown>, (r) => {
                if (r === true || r === 1) return true;
                if (r === false || r === 0) return false;
                throw new Error(message);
            });
            if (list.length === 0) throw new Error(message);

            const { pressTimes, rewarded } = simulate(list);
            sendMessage({
                type: "showSession",
                pressTimes,
                rewarded,
                foodOffAt: FOOD_ON_S,
                endAt: SESSION_S,
            });
        },
    });
};

export default createExports;
