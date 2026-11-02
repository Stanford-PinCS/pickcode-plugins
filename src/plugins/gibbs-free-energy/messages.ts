/** What the student's if statement decided for one temperature. */
/** "not spontaneous" is the older spelling of "nonspontaneous"; both are accepted. */
export type GibbsLabel = "spontaneous" | "nonspontaneous" | "not spontaneous";

export type Message = {
    type: "showGibbs";
    /** Kelvin, in the order the student's loop sent them. */
    temperatures: number[];
    /** kJ/mol, one per temperature. */
    deltaGs: number[];
    labels: GibbsLabel[];
    /** Whether each label agrees with the sign of ΔG (ΔG < 0 is spontaneous). */
    correct: boolean[];
    /** Temperature where ΔG crosses 0 inside the swept range, or null. */
    crossoverK: number | null;
};
