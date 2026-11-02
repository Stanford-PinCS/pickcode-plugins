import { Message } from "../../messages";

const XMIN = 0;
const XMAX = 4;
const SAMPLE_POINTS = ["left", "right", "middle"] as const;
type SamplePoint = (typeof SAMPLE_POINTS)[number];

const isSamplePoint = (value: unknown): value is SamplePoint =>
    typeof value === "string" &&
    (SAMPLE_POINTS as readonly string[]).includes(value);

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        xmin: XMIN,
        xmax: XMAX,

        drawCurve: () => sendMessage({ type: "drawCurve" }),

        setColor: (color: string) => sendMessage({ type: "setColor", color }),

        drawRect: (x: number, width: number, height: number) =>
            sendMessage({ type: "drawRect", x, width, height }),

        showArea: (area: number) => sendMessage({ type: "showArea", area }),

        /**
         * Fills the area under f(x) = x² from xmin to xmax with n rectangles
         * and shows their total area.
         *
         * @param n           - How many rectangles (a whole number, 1 or more)
         * @param samplePoint - Where each rectangle touches the curve:
         *                      "left", "right", or "middle"
         *
         * @example
         * drawRiemannSum(10, "middle");
         */
        drawRiemannSum: (n: unknown, samplePoint: unknown = "left") => {
            if (typeof n !== "number" || !Number.isInteger(n) || n < 1) {
                throw new Error(
                    "n must be a whole number of rectangles, like 4 or 10."
                );
            }
            if (n > 2000) {
                throw new Error("n can be at most 2000 rectangles. Try 500.");
            }
            if (!isSamplePoint(samplePoint)) {
                throw new Error(
                    'samplePoint must be "left", "right", or "middle".'
                );
            }

            const offset =
                samplePoint === "left" ? 0 : samplePoint === "right" ? 1 : 0.5;
            const dx = (XMAX - XMIN) / n;
            let area = 0;

            sendMessage({ type: "drawCurve" });
            for (let i = 0; i < n; i++) {
                const xLeft = XMIN + i * dx;
                const xSample = xLeft + offset * dx;
                const height = xSample * xSample;
                sendMessage({ type: "drawRect", x: xLeft, width: dx, height });
                area += height * dx;
            }
            sendMessage({ type: "showArea", area });
        },
    });
};

export default createExports;
