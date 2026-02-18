import { Message } from "../../messages";

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Creates and runs an exponential population growth simulation.
         *
         * @param initialSize - Starting population size (N₀)
         * @param growthRate  - Intrinsic growth rate r (e.g. 0.1 means 10% per day)
         * @param days        - Number of days to simulate (default: 10)
         * @param dayDuration - Milliseconds per simulated day in the visualization (default: 3000)
         *
         * @example
         * createSimulationExponential(50, 0.2, 15, 2000);
         */
        createSimulationExponential: (
            initialSize: number,
            growthRate: number,
            days: number = 10,
            dayDuration: number = 3000
        ) => {
            // Validate inputs
            if (initialSize <= 0) throw new Error("initialSize must be positive");
            if (days <= 0) throw new Error("days must be positive");
            if (dayDuration < 500) throw new Error("dayDuration must be at least 500ms");

            // Reset any previous simulation and send initial config
            sendMessage({ type: "reset" });

            // Small delay so the reset can propagate before we start
            setTimeout(() => {
                sendMessage({
                    type: "addPopulation",
                    initialSize,
                    growthRate,
                    dayDuration,
                });

                // Tick through each day, sending population updates
                for (let day = 1; day <= days; day++) {
                    const delay = day * dayDuration;
                    const population = Math.round(initialSize * Math.exp(growthRate * day));

                    setTimeout(() => {
                        sendMessage({ type: "tick", day, population });
                    }, delay);
                }
            }, 100);
        },
    });
};

export default createExports;