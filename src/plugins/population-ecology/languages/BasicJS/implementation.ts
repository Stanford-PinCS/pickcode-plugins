import { Message } from "../../messages";

const createExports = (sendMessage: (message: Message) => void) => {
    const runSimulation = (
        initialSize: number,
        dayDuration: number,
        getTick: (day: number) => number,
        totalDays: number,
        initMessage: Message
    ) => {
        sendMessage({ type: "reset" });
        setTimeout(() => {
            sendMessage(initMessage);
            for (let day = 1; day <= totalDays; day++) {
                const population = getTick(day);
                setTimeout(() => {
                    sendMessage({ type: "tick", day, population });
                }, day * dayDuration);
            }
        }, 100);
    };

    return Promise.resolve({
        /**
         * Simulates exponential population growth: N(t) = N₀·e^(r·t)
         *
         * @param initialSize - Starting population (N₀)
         * @param growthRate  - Intrinsic growth rate r (e.g. 0.2)
         * @param days        - Number of days to simulate (default: 10)
         * @param dayDuration - Milliseconds per simulated day (default: 3000)
         *
         * @example
         * createSimulationExponential(100, 0.3, 10, 2000);
         */
        createSimulationExponential: (
            initialSize: number,
            growthRate: number,
            days: number = 10,
            dayDuration: number = 3000
        ) => {
            if (initialSize <= 0) throw new Error("initialSize must be positive");
            if (days <= 0) throw new Error("days must be positive");
            if (dayDuration < 500) throw new Error("dayDuration must be at least 500ms");

            runSimulation(
                initialSize,
                dayDuration,
                (day) => Math.round(initialSize * Math.exp(growthRate * day)),
                days,
                { type: "addPopulation", initialSize, growthRate, dayDuration, label: "Exponential" }
            );
        },

        /**
         * Simulates a custom population schedule from a list of population values.
         * The first value is the initial population (day 0), and each subsequent
         * value is the population at the next day.
         *
         * @param populations - Array of population sizes, e.g. [1000, 1500, 2200, 3000]
         * @param dayDuration - Milliseconds per simulated day (default: 3000)
         *
         * @example
         * createSimulationCustom([1000, 1200, 1500, 1900, 2400], 2000);
         */
        createSimulationCustom: (
            populations: number[],
            dayDuration: number = 3000
        ) => {
            if (!Array.isArray(populations) || populations.length < 2)
                throw new Error("populations must be an array with at least 2 values");
            if (populations.some((p) => p < 0))
                throw new Error("all population values must be non-negative");
            if (dayDuration < 500) throw new Error("dayDuration must be at least 500ms");

            const initialSize = populations[0];
            const totalDays = populations.length - 1;

            runSimulation(
                initialSize,
                dayDuration,
                (day) => populations[day],
                totalDays,
                { type: "addCustomPopulation", populations, dayDuration }
            );
        },
    });
};

export default createExports;