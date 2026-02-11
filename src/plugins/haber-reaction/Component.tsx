import { observer } from "mobx-react-lite";
import React from "react";
import State from "./state";

/* ───────── Reactant card (H₂ or N₂) ───────── */

const ReactantCard = ({
    title,
    input,
    consumed,
    remaining,
    isLimiting,
}: {
    title: string;
    input: number;
    consumed: number;
    remaining: number;
    isLimiting: boolean;
}) => {
    const border = isLimiting
        ? "border-2 border-amber-400 bg-amber-50 shadow-md"
        : "border border-gray-200 bg-white shadow-sm";

    return (
        <div
            className={`p-4 rounded-xl sm:w-56 flex-shrink-0 transition-all duration-300 ${border}`}
        >
            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-bold text-gray-800">{title}</h3>
            </div>

            {isLimiting && (
                <span className="inline-block mb-2 px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold uppercase rounded-full tracking-wide">
                    Limiting Reactant
                </span>
            )}

            <table className="w-full text-sm">
                <tbody>
                    <tr className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-500">Input</td>
                        <td className="py-1.5 text-right font-semibold text-gray-800">
                            {fmt(input)} mol
                        </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-500">Consumed</td>
                        <td className="py-1.5 text-right font-semibold text-gray-800">
                            {fmt(consumed)} mol
                        </td>
                    </tr>
                    <tr>
                        <td className="py-1.5 text-gray-500">Remaining</td>
                        <td
                            className={`py-1.5 text-right font-bold ${
                                remaining <= 0 ? "text-red-500" : "text-green-600"
                            }`}
                        >
                            {fmt(remaining)} mol
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

/* ───────── Product card (NH₃) ───────── */

const ProductCard = ({
    trueNh3,
    trueLimiting,
    studentNh3,
    studentLimiting,
    nh3Correct,
    limitingCorrect,
}: {
    trueNh3: number;
    trueLimiting: string;
    studentNh3: number;
    studentLimiting: string;
    nh3Correct: boolean | null;
    limitingCorrect: boolean | null;
}) => {
    const hasStudentAnswer = nh3Correct !== null || limitingCorrect !== null;

    return (
        <div className="p-5 rounded-xl shadow-md sm:w-80 bg-white border border-gray-200 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xl"></span>
                <h3 className="text-base font-bold text-gray-800">
                    NH₃ (Ammonia)
                </h3>
            </div>

            {/* True values */}
            <div className="mb-3">
                <div className="text-3xl font-extrabold text-indigo-600">
                    {fmt(trueNh3)} mol
                </div>
                <div className="text-sm text-gray-500 mt-1">
                    Limiting reactant:{" "}
                    <span className="font-semibold text-amber-600">
                        {prettyLimiting(trueLimiting)}
                    </span>
                </div>
            </div>

            {/* Student comparison */}
            {hasStudentAnswer && (
                <div className="border-t border-gray-100 pt-3 mt-2">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                        Your Answer
                    </div>
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">NH₃ produced</span>
                            <span
                                className={`font-semibold ${
                                    nh3Correct
                                        ? "text-green-600"
                                        : "text-red-500"
                                }`}
                            >
                                {studentNh3} mol{" "}
                                {nh3Correct ? "✓" : "✗"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Limiting</span>
                            <span
                                className={`font-semibold ${
                                    limitingCorrect
                                        ? "text-green-600"
                                        : "text-red-500"
                                }`}
                            >
                                {studentLimiting || "—"}{" "}
                                {limitingCorrect ? "✓" : "✗"}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ───────── Helpers ───────── */

/** Format a number to 2 dp, but drop trailing zeros */
const fmt = (n: number): string =>
    Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

const prettyLimiting = (s: string): string => {
    switch (s.toLowerCase()) {
        case "h2":
            return "H₂";
        case "n2":
            return "N₂";
        case "none":
            return "Neither (exact ratio)";
        default:
            return s || "—";
    }
};

/* ───────── Converging arrow SVG ───────── */

const ConvergingArrow = () => (
    <svg
        width="180"
        height="52"
        viewBox="0 0 180 52"
        className="my-2"
        aria-hidden="true"
    >
        {/* left line  (from H₂ card) */}
        <line
            x1="50"
            y1="2"
            x2="90"
            y2="36"
            stroke="#9CA3AF"
            strokeWidth="2.5"
            strokeLinecap="round"
        />
        {/* right line (from N₂ card) */}
        <line
            x1="130"
            y1="2"
            x2="90"
            y2="36"
            stroke="#9CA3AF"
            strokeWidth="2.5"
            strokeLinecap="round"
        />
        {/* arrow head */}
        <polygon points="83,38 90,50 97,38" fill="#9CA3AF" />
    </svg>
);

/* ───────── Main component ───────── */

const Component = observer(({ state }: { state: State | undefined }) => {
    const inputN2 = state?.input_n2 ?? 0;
    const inputH2 = state?.input_h2 ?? 0;
    const trueNh3 = state?.true_nh3 ?? 0;
    const trueLimiting = state?.true_limiting ?? "";
    const n2Consumed = state?.n2_consumed ?? 0;
    const h2Consumed = state?.h2_consumed ?? 0;
    const n2Remaining = state?.n2_remaining ?? 0;
    const h2Remaining = state?.h2_remaining ?? 0;
    const studentNh3 = state?.student_nh3 ?? 0;
    const studentLimiting = state?.student_limiting ?? "";
    const nh3Correct = state?.nh3_correct ?? null;
    const limitingCorrect = state?.limiting_correct ?? null;

    const isH2Limiting = trueLimiting.toLowerCase() === "h2";
    const isN2Limiting = trueLimiting.toLowerCase() === "n2";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
            {/* ── Equation header ── */}
            <div className="mb-5 text-center">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Haber Process
                </div>
                <div className="text-lg font-bold text-gray-700 mt-1">
                    N₂ + 3H₂ &rarr; 2NH₃
                </div>
            </div>

            {/* ── Reactant row ── */}
            <div className="flex flex-row items-end gap-3 justify-center flex-wrap">
                <ReactantCard
                    title="H₂ (Hydrogen)"
                    input={inputH2}
                    consumed={h2Consumed}
                    remaining={h2Remaining}
                    isLimiting={isH2Limiting}
                />
                <span className="text-2xl font-bold text-gray-300 pb-14 select-none">
                    +
                </span>
                <ReactantCard
                    title="N₂ (Nitrogen)"
                    input={inputN2}
                    consumed={n2Consumed}
                    remaining={n2Remaining}
                    isLimiting={isN2Limiting}
                />
            </div>

            {/* ── Converging arrow ── */}
            <ConvergingArrow />

            {/* ── Product card ── */}
            <ProductCard
                trueNh3={trueNh3}
                trueLimiting={trueLimiting}
                studentNh3={studentNh3}
                studentLimiting={studentLimiting}
                nh3Correct={nh3Correct}
                limitingCorrect={limitingCorrect}
            />
        </div>
    );
});

export default Component;
