// Baseline lab setup: equal masses, with body B initially at rest.
// For the main conservation lab, start by keeping friction at 0.
// Then compare this setup with a second run where both bodies move.
// Keep the object structure the same.

const experiment = {
    inputs: {
        restitution: 0.92,
        friction: 0,
        bodies: [
            {
                label: "A",
                mass: 1,
                radius: 34,
                position: { x: 200, y: 280 },
                velocity: { x: 210, y: 0 },
                color: "#38bdf8",
            },
            {
                label: "B",
                mass: 1,
                radius: 34,
                position: { x: 560, y: 328 },
                velocity: { x: 0, y: 0 },
                color: "#fb7185",
            },
        ],
    },
};

momentum2d.run(experiment);