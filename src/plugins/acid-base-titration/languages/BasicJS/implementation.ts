import { Message, Region } from "../../messages";

const REGIONS: readonly Region[] = ["excessH", "equivalence", "excessOH"];

function toNumber(input: unknown, what: string): number {
    const n = typeof input === "number" ? input : Number.NaN;
    if (!Number.isFinite(n)) throw new Error(`showTitration expects ${what} to be a number.`);
    return n;
}

/** Student code may hand us a JS array or a Python list proxy. */
function toList(input: unknown, what: string): unknown[] {
    if (input == null || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error(`showTitration expects ${what} to be a list.`);
    }
    return Array.from(input as Iterable<unknown>);
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws one titration run: the buret, the flask, and the pH curve.
         * The hidden runTitration helper builds these lists from the
         * student's calculatePH function and calls this once.
         */
        showTitration: (
            acidConcentration: unknown,
            baseConcentration: unknown,
            acidVolumeML: unknown,
            volumesML: unknown,
            pHs: unknown,
            regions: unknown
        ) => {
            const acid = toNumber(acidConcentration, "acidConcentration");
            const base = toNumber(baseConcentration, "baseConcentration");
            const acidVolume = toNumber(acidVolumeML, "acidVolumeML");
            if (acid <= 0 || base <= 0 || acidVolume <= 0) {
                throw new Error("showTitration expects concentrations and volume above 0.");
            }

            const volumes = toList(volumesML, "volumesML").map((v, i) =>
                toNumber(v, `volume ${i + 1}`)
            );
            const values = toList(pHs, "pHs").map((v, i) => toNumber(v, `pH ${i + 1}`));
            const kinds = toList(regions, "regions").map((r) => {
                if (typeof r !== "string" || !REGIONS.includes(r as Region)) {
                    throw new Error(
                        'showTitration expects each region to be "excessH", "equivalence", or "excessOH".'
                    );
                }
                return r as Region;
            });
            if (volumes.length < 2 || values.length !== volumes.length || kinds.length !== volumes.length) {
                throw new Error("showTitration expects lists of volumes, pHs, and regions of the same length.");
            }

            sendMessage({
                type: "showTitration",
                acidConcentration: acid,
                baseConcentration: base,
                acidVolumeML: acidVolume,
                // moles of acid = moles of base at equivalence: Ca·Va = Cb·Vb
                equivalenceML: (acid * acidVolume) / base,
                volumesML: volumes,
                pHs: values,
                regions: kinds,
            });
        },
    });
};

export default createExports;
