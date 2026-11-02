/** Which reactant is left over after an addition of base. */
export type Region = "excessH" | "equivalence" | "excessOH";

export type Message = {
    type: "showTitration";
    /** mol/L of the acid (HCl) in the flask. */
    acidConcentration: number;
    /** mol/L of the base (NaOH) in the buret. */
    baseConcentration: number;
    /** mL of acid in the flask before any base is added. */
    acidVolumeML: number;
    /** mL of base needed to reach the equivalence point. */
    equivalenceML: number;
    /** mL of base added so far, one entry per addition (starts at 0). */
    volumesML: number[];
    /** The pH the student's calculatePH returned after each addition. */
    pHs: number[];
    regions: Region[];
};
