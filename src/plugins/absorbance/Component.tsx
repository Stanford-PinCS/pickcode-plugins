import { observer } from "mobx-react-lite";
import State from "./state";

const Component = observer(({ state }: { state: State }) => {
    const absorbance =
        state.concentration * state.epsilon * state.pathLength;

    return (
        <div
            style={{
                fontFamily: "Arial",
                padding: "30px",
                background: "#f4f8ff",
                minHeight: "100vh",
            }}
        >
            <h1 style={{ color: "#1d4ed8" }}>
                Beer-Lambert Law Simulator
            </h1>

            <p style={{ fontSize: "18px" }}>
                A = ε × l × c
            </p>

            <div style={{ marginTop: "30px" }}>
                <label>
                    Concentration: {state.concentration.toFixed(2)}
                </label>

                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={state.concentration}
                    onChange={(e) =>
                        state.setConcentration(Number(e.target.value))
                    }
                    style={{ width: "300px", display: "block" }}
                />
            </div>

            <div style={{ marginTop: "20px" }}>
                <label>
                    Epsilon: {state.epsilon.toFixed(2)}
                </label>

                <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={state.epsilon}
                    onChange={(e) =>
                        state.setEpsilon(Number(e.target.value))
                    }
                    style={{ width: "300px", display: "block" }}
                />
            </div>

            <div style={{ marginTop: "20px" }}>
                <label>
                    Path Length: {state.pathLength.toFixed(2)}
                </label>

                <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={state.pathLength}
                    onChange={(e) =>
                        state.setPathLength(Number(e.target.value))
                    }
                    style={{ width: "300px", display: "block" }}
                />
            </div>

            <h2 style={{ marginTop: "30px" }}>
                Absorbance: {absorbance.toFixed(3)}
            </h2>

            <div
                style={{
                    marginTop: "30px",
                    width: "220px",
                    height: "220px",
                    background: `rgba(29,78,216,${
                        Math.min(absorbance / 5, 1)
                    })`,
                    border: "4px solid #1e293b",
                    borderRadius: "16px",
                    transition: "0.3s",
                }}
            />

            <p style={{ marginTop: "20px", maxWidth: "700px" }}>
                As concentration, molar absorptivity, or path length
                increase, absorbance increases. The solution becomes
                darker because more light is absorbed.
            </p>
        </div>
    );
});

export default Component;