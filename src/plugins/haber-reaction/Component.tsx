import { observer } from "mobx-react-lite";
import React, { useState, useEffect, useMemo, useRef } from "react";
import State from "./state";

// Make the card for the N2/H2 visualization
const InfoCard = ({
    title,
    emoji,
    data,
    isHighlighted,
    isPulsing,
    isCorrect,
}: {
    title: string;
    emoji: string;
    data: { label: string; value: string | number }[];
    isHighlighted: boolean;
    isPulsing: boolean;
    isCorrect: boolean | null;
}) => {
    const classNames = [
        "bg-white p-4 rounded-lg shadow-md sm:w-64 flex-shrink-0 transition-all duration-300",
    ];

    // Make it smaller during the pulsing period.
    if (isPulsing) {
        classNames.push("transform scale-95");
    }

    // Highlight it and border it solid green or dashed red if depending on correctness.
    if (isHighlighted) {
        if (isCorrect === true) {
            classNames.push("border-4 border-green-500 bg-green-50");
        } else if (isCorrect === false) {
            classNames.push("border-dashed border-4 border-red-500 bg-red-50");
        }
    }

    return (
        <div className={classNames.join(" ")}>
            <h3 className="text-lg font-semibold mb-1.5 flex items-center gap-1 text-gray-800">
                <span>{emoji}</span>
                <span>{title}</span>
            </h3>
            <table className="w-full text-left">
                <tbody>
                    {data.map(({ label, value }, index) => (
                        <tr
                            key={index}
                            className="border-b last:border-b-0 border-gray-100"
                        >
                            <td className="py-1 pr-2 text-gray-600">
                                {label}:
                            </td>
                            <td className="py-1 pl-2 font-medium text-gray-800">
                                {value}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
const Component = observer(({ state }: { state: State | undefined }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
            <div className="flex flex-row gap-4 flex-wrap justify-center">
                <InfoCard
                    title="N₂ Leftover"
                    emoji="⚗️"
                    data={[
                        { label: "Moles", value: state?.n2_left ?? 0 }
                    ]}
                    isHighlighted={false}
                    isPulsing={false}
                    isCorrect={null}
                />
                <InfoCard
                    title="H₂ Leftover"
                    emoji="⚗️"
                    data={[
                        { label: "Moles", value: state?.h2_left ?? 0 }
                    ]}
                    isHighlighted={false}
                    isPulsing={false}
                    isCorrect={null}
                />
            </div>
        </div>
    );
});

export default Component;
