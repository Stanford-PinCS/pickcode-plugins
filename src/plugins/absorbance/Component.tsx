import { observer } from "mobx-react-lite";
import { useState } from "react";
import State from "./state";

const Component = observer(({ state }: { state: State }) => {
    // SECTION 1: slider lesson
    const [concentration, setConcentration] = useState(0.3);
    const [epsilon, setEpsilon] = useState(1.5);
    const [pathLength, setPathLength] = useState(1.0);

    const sliderAbsorbance = concentration * epsilon * pathLength;

    // SECTION 2: student code output
    const result = state.value;
    const codeEpsilon = result?.epsilon ?? 1.5;
    const codePathLength = result?.pathLength ?? 1.0;
    const codeConcentration = result?.concentration ?? 0.3;
    const codeAbsorbance = result?.absorbance ?? 0;

    const correctAbsorbance = codeEpsilon * codePathLength * codeConcentration;
    const isCorrect = Math.abs(codeAbsorbance - correctAbsorbance) < 0.001;

    const sliderDarkness = Math.min(sliderAbsorbance / 5, 1);
    const codeDarkness = Math.min(codeAbsorbance / 5, 1);

    return (
        <div
            style={{
                fontFamily: "Arial",
                padding: "32px",
                background: "#f4f8ff",
                minHeight: "100vh",
                color: "black",
            }}
        >
            <h1 style={{ color: "#1d4ed8" }}>
                AP Chemistry Absorbance Lesson
            </h1>

            <p style={{ maxWidth: 850, fontSize: 18 }}>
                Chemists use absorbance to estimate how concentrated a solution is.
                In this lesson, you will first explore absorbance with sliders, then
                write code that calculates absorbance using the Beer-Lambert Law.
            </p>

            <hr style={{ margin: "28px 0" }} />

            {/* SECTION 1 */}
            <h2 style={{ color: "#2563eb" }}>
                Part 1: Interactive Beer-Lambert Simulator
            </h2>

            <h3>A = ε × l × c</h3>

            <p style={{ maxWidth: 800 }}>
                Move the sliders and observe what happens to absorbance. A higher
                absorbance means the solution absorbs more light and appears darker.
            </p>

            <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
                <div>
                    <div style={{ marginTop: 20 }}>
                        <label>
                            Concentration (c): {concentration.toFixed(2)}
                        </label>
                        <br />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={concentration}
                            onChange={(e) =>
                                setConcentration(Number(e.target.value))
                            }
                            style={{ width: 320 }}
                        />
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <label>
                            Molar absorptivity (ε): {epsilon.toFixed(2)}
                        </label>
                        <br />
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={epsilon}
                            onChange={(e) =>
                                setEpsilon(Number(e.target.value))
                            }
                            style={{ width: 320 }}
                        />
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <label>
                            Path length (l): {pathLength.toFixed(2)}
                        </label>
                        <br />
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={pathLength}
                            onChange={(e) =>
                                setPathLength(Number(e.target.value))
                            }
                            style={{ width: 320 }}
                        />
                    </div>

                    <h3 style={{ marginTop: 28 }}>
                        Absorbance: {sliderAbsorbance.toFixed(3)}
                    </h3>
                </div>

                <div>
                    <p><b>Solution visual</b></p>
                    <div
                        style={{
                            width: 220,
                            height: 220,
                            border: "4px solid #1e293b",
                            borderRadius: 16,
                            background: `rgba(29, 78, 216, ${sliderDarkness})`,
                            transition: "0.3s",
                        }}
                    />
                    <p style={{ maxWidth: 300 }}>
                        As absorbance increases, the simulated solution becomes darker.
                    </p>
                </div>
            </div>

            <hr style={{ margin: "40px 0" }} />

            {/* SECTION 2 */}
            <h2 style={{ color: "#d97706" }}>
                Part 2: Coding Capstone
            </h2>

            <p style={{ maxWidth: 850 }}>
                Now students write their own code to calculate absorbance. In the
                starter code, they should replace the TODO line with the Beer-Lambert
                formula.
            </p>

            <div
                style={{
                    background: "#111827",
                    color: "#e5e7eb",
                    padding: 20,
                    borderRadius: 12,
                    maxWidth: 720,
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    marginTop: 20,
                }}
            >
{`function calculate_absorbance() {
  let epsilon = 1.5;
  let pathLength = 1.0;
  let concentration = 0.30;

  // TODO: calculate absorbance
  let absorbance = 0;

  return absorbance;
}`}
            </div>

            <p style={{ marginTop: 20 }}>
                Goal: change <code>let absorbance = 0;</code> into:
            </p>

            <div
                style={{
                    background: "#ecfdf5",
                    color: "#065f46",
                    padding: 12,
                    borderRadius: 8,
                    maxWidth: 600,
                    fontFamily: "monospace",
                }}
            >
                let absorbance = epsilon * pathLength * concentration;
            </div>

            <div
                style={{
                    marginTop: 30,
                    padding: 20,
                    background: "white",
                    border: "2px solid #cbd5e1",
                    borderRadius: 12,
                    maxWidth: 760,
                }}
            >
                <h3>Student Code Output</h3>

                <p><b>Epsilon:</b> {codeEpsilon}</p>
                <p><b>Path length:</b> {codePathLength}</p>
                <p><b>Concentration:</b> {codeConcentration}</p>
                <p><b>Student absorbance:</b> {codeAbsorbance}</p>
                <p><b>Correct absorbance:</b> {correctAbsorbance.toFixed(3)}</p>

                <h2 style={{ color: isCorrect ? "green" : "red" }}>
                    {isCorrect ? "Correct!" : "Not yet — check your formula."}
                </h2>

                <div
                    style={{
                        width: 180,
                        height: 180,
                        border: "4px solid #1e293b",
                        borderRadius: 16,
                        background: `rgba(29, 78, 216, ${codeDarkness})`,
                        transition: "0.3s",
                    }}
                />
            </div>
        </div>
    );
});

export default Component;