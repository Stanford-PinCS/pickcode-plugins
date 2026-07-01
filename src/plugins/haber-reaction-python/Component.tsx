import { observer } from "mobx-react-lite";
import React, { useState, useEffect, useRef } from "react";
import State from "./state";

/* ───────── Animated value hook ───────── */

/**
 * Smoothly animates a number from 0 to `target`.
 * When `resetKey` changes the animation replays from 0, even if `target`
 * is the same as last time (this is what makes re-pressing play work).
 */
const useAnimatedValue = (
    target: number,
    duration = 800,
    delay = 0,
    resetKey = 0
): number => {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        // Cancel any in-flight animation
        clearTimeout(timeoutRef.current);
        cancelAnimationFrame(rafRef.current);

        // Snap to 0 immediately so the count-up is visible
        setDisplay(0);

        if (Math.abs(target) < 0.0001) {
            return;
        }

        timeoutRef.current = setTimeout(() => {
            const t0 = performance.now();
            const animate = (now: number) => {
                const t = Math.min((now - t0) / duration, 1);
                const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
                setDisplay(target * eased);
                if (t < 1) {
                    rafRef.current = requestAnimationFrame(animate);
                } else {
                    setDisplay(target);
                }
            };
            rafRef.current = requestAnimationFrame(animate);
        }, delay);

        return () => {
            clearTimeout(timeoutRef.current);
            cancelAnimationFrame(rafRef.current);
        };
        // resetKey forces a fresh run even when target hasn't changed
    }, [target, duration, delay, resetKey]);

    return display;
};

/* ───────── Data row (flex, good spacing) ───────── */

const DataRow = ({
    label,
    value,
    valueClass = "font-semibold text-gray-800",
    hasBorder = true,
}: {
    label: string;
    value: string;
    valueClass?: string;
    hasBorder?: boolean;
}) => (
    <div
        className={`flex justify-between items-center py-2 ${
            hasBorder ? "border-b border-gray-100" : ""
        }`}
    >
        <span className="text-gray-500 text-sm">{label}</span>
        <span className={`text-sm ${valueClass}`}>{value}</span>
    </div>
);

/* ───────── Reactant card (H₂ or N₂) ───────── */

const ReactantCard = ({
    title,
    input,
    consumed,
    remaining,
    isLimiting,
    runId,
}: {
    title: string;
    input: number;
    consumed: number;
    remaining: number;
    isLimiting: boolean;
    runId: number;
}) => {
    // Animate consumed counting up; remaining is derived so it counts down
    const animConsumed = useAnimatedValue(consumed, 1800, 200, runId);
    const animRemaining = input - animConsumed;

    // Delay the limiting-reactant highlight until after NH₃ finishes counting
    // NH₃ anim = 700ms delay + 2000ms duration = 2700ms, so reveal at ~2800ms
    const [showHighlight, setShowHighlight] = useState(false);
    useEffect(() => {
        if (!isLimiting) {
            setShowHighlight(false);
            return;
        }
        setShowHighlight(false);
        const timer = setTimeout(() => setShowHighlight(true), 2800);
        return () => clearTimeout(timer);
    }, [runId, isLimiting]);

    const border = showHighlight
        ? "border-2 border-amber-400 bg-amber-50 shadow-md"
        : "border border-gray-200 bg-white shadow-sm";

    const remainingColor =
        remaining <= 0 ? "font-bold text-red-500" : "font-bold text-green-600";

    return (
        <div
            className={`p-4 rounded-xl w-56 flex-shrink-0 transition-all duration-700 ${border}`}
        >
            <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>

            {isLimiting && showHighlight && (
                <span className="inline-block mb-2 px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold uppercase rounded-full tracking-wide animate-fade-in">
                    Limiting Reactant
                </span>
            )}

            <div className="mt-1">
                <DataRow label="Input" value={`${fmt(input)} mol`} />
                <DataRow
                    label="Consumed"
                    value={`${fmt(animConsumed)} mol`}
                />
                <DataRow
                    label="Remaining"
                    value={`${fmt(animRemaining)} mol`}
                    valueClass={remainingColor}
                    hasBorder={false}
                />
            </div>
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
    runId,
}: {
    trueNh3: number;
    trueLimiting: string;
    studentNh3: number;
    studentLimiting: string;
    nh3Correct: boolean | null;
    limitingCorrect: boolean | null;
    runId: number;
}) => {
    const animNh3 = useAnimatedValue(trueNh3, 2000, 700, runId);
    const hasStudentAnswer = nh3Correct !== null || limitingCorrect !== null;

    return (
        <div className="p-5 rounded-xl shadow-md w-80 bg-white border border-gray-200 transition-all duration-300">
            <h3 className="text-base font-bold text-gray-800 mb-3">
                NH₃ (Ammonia)
            </h3>

            {/* True values */}
            <div className="mb-3">
                <div className="text-3xl font-extrabold text-indigo-600">
                    {fmt(animNh3)} mol
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
                    <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center py-1">
                            <span className="text-gray-500 text-sm">
                                NH₃ produced
                            </span>
                            <span
                                className={`text-sm font-semibold ${
                                    nh3Correct
                                        ? "text-green-600"
                                        : "text-red-500"
                                }`}
                            >
                                {studentNh3} mol{" "}
                                {nh3Correct ? "✓" : "✗"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                            <span className="text-gray-500 text-sm">
                                Limiting
                            </span>
                            <span
                                className={`text-sm font-semibold ${
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

/** Format a number to 2 dp, drop trailing zeros */
const fmt = (n: number): string => {
    if (Math.abs(n) < 0.005) return "0";
    if (Number.isInteger(n)) return String(n);
    return n
        .toFixed(2)
        .replace(/0+$/, "")
        .replace(/\.$/, "");
};

const prettyLimiting = (s: string): string => {
    if (!s) return "—";
    switch (s.toLowerCase()) {
        case "h2":
            return "H₂";
        case "n2":
            return "N₂";
        case "none":
            return "Neither (exact ratio)";
        default:
            return s;
    }
};

/* ───────── Converging arrow SVG (with glow animation) ───────── */

const ConvergingArrow = ({ runId }: { runId: number }) => {
    const [active, setActive] = useState(false);

    useEffect(() => {
        if (runId === 0) return; // no run yet

        // Briefly deactivate → reactivate so the CSS transition replays
        setActive(false);
        const timer = setTimeout(() => setActive(true), 60);
        return () => clearTimeout(timer);
    }, [runId]);

    const stroke = active ? "#6366F1" : "#9CA3AF";
    const glow = active
        ? "drop-shadow(0 0 5px rgba(99, 102, 241, 0.6))"
        : "none";

    return (
        <svg
            width="180"
            height="52"
            viewBox="0 0 180 52"
            className="my-2"
            style={{
                filter: glow,
                transition: active
                    ? "filter 600ms ease-out 300ms"
                    : "filter 0ms",
            }}
            aria-hidden="true"
        >
            {/* left line (from H₂ card) */}
            <line
                x1="50"
                y1="2"
                x2="90"
                y2="36"
                stroke={stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{
                    transition: active
                        ? "stroke 600ms ease-out 300ms"
                        : "stroke 0ms",
                }}
            />
            {/* right line (from N₂ card) */}
            <line
                x1="130"
                y1="2"
                x2="90"
                y2="36"
                stroke={stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{
                    transition: active
                        ? "stroke 600ms ease-out 300ms"
                        : "stroke 0ms",
                }}
            />
            {/* arrow head */}
            <polygon
                points="83,38 90,50 97,38"
                fill={stroke}
                style={{
                    transition: active
                        ? "fill 600ms ease-out 300ms"
                        : "fill 0ms",
                }}
            />
        </svg>
    );
};

/* ───────── Main component ───────── */

const Component = observer(({ state }: { state: State | undefined }) => {
    const runId = state?.run_id ?? 0;
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
                    runId={runId}
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
                    runId={runId}
                />
            </div>

            {/* ── Converging arrow ── */}
            <ConvergingArrow runId={runId} />

            {/* ── Product card ── */}
            <ProductCard
                trueNh3={trueNh3}
                trueLimiting={trueLimiting}
                studentNh3={studentNh3}
                studentLimiting={studentLimiting}
                nh3Correct={nh3Correct}
                limitingCorrect={limitingCorrect}
                runId={runId}
            />
        </div>
    );
});

export default Component;
