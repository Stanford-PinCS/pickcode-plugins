import { action, observable } from "mobx";
import { Message } from "./messages";

export type Vec3 = readonly [number, number, number];

/** VSEPR molecular shape for each (bonding pairs, lone pairs) combination. */
const SHAPES: Record<string, string> = {
    "2,0": "linear",
    "3,0": "trigonal planar",
    "2,1": "bent",
    "4,0": "tetrahedral",
    "3,1": "trigonal pyramidal",
    "2,2": "bent",
    "5,0": "trigonal bipyramidal",
    "4,1": "seesaw",
    "3,2": "T-shaped",
    "2,3": "linear",
    "6,0": "octahedral",
    "5,1": "square pyramidal",
    "4,2": "square planar",
    "3,3": "T-shaped",
    "2,4": "linear",
};

/** Every shape name the plugin recognizes, normalized. */
const KNOWN_SHAPES = new Set(Object.values(SHAPES).map(normalizeShape));

/** Lowercase, no hyphens or extra spaces: "T-Shaped " -> "t shaped". */
export function normalizeShape(name: string): string {
    return name
        .toLowerCase()
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^see saw$/, "seesaw");
}

export function correctShape(bondingPairs: number, lonePairs: number): string {
    return SHAPES[`${bondingPairs},${lonePairs}`] ?? "unknown";
}

/** How the student's answer compares with the real VSEPR shape. */
export function judgeShape(
    answer: string,
    bondingPairs: number,
    lonePairs: number
): "match" | "unknown" | "mismatch" {
    const given = normalizeShape(answer);
    if (given === normalizeShape(correctShape(bondingPairs, lonePairs))) return "match";
    if (!KNOWN_SHAPES.has(given)) return "unknown";
    return "mismatch";
}

const S3 = Math.sqrt(3) / 2;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Three directions spread around the -y axis, each `polar` degrees from it. */
function tripod(polar: number): Vec3[] {
    const s = Math.sin(rad(polar));
    const c = Math.cos(rad(polar));
    return [0, 120, 240].map(
        (a) => [s * Math.sin(rad(a)), -c, s * Math.cos(rad(a))] as Vec3
    );
}

/** Polar angle from -y that puts three bonds `angle` degrees apart. */
const tripodPolar = (angle: number) =>
    (Math.acos(Math.sqrt((Math.cos(rad(angle)) + 0.5) / 1.5)) * 180) / Math.PI;

/**
 * Where each electron domain settles, as unit vectors from the central atom.
 * Lone pairs come first in the list, then bonding pairs. Lone pairs repel
 * more strongly than bonding pairs, so with 3 or 4 domains they squeeze the
 * bond angles: about 107° for NH3 and 104.5° for H2O, about 119°
 * for SO2. With 5 or 6 domains this keeps the ideal 90° / 120° angles and
 * puts lone pairs where VSEPR does (equatorial for 5, opposite for 6).
 */
export function settledDirections(bondingPairs: number, lonePairs: number): Vec3[] {
    const domains = bondingPairs + lonePairs;
    if (domains === 2) return [[-1, 0, 0], [1, 0, 0]];
    if (domains === 3) {
        if (lonePairs === 0) return [[0, 1, 0], [S3, -0.5, 0], [-S3, -0.5, 0]];
        const h = rad(119 / 2);
        return [[0, 1, 0], [Math.sin(h), -Math.cos(h), 0], [-Math.sin(h), -Math.cos(h), 0]];
    }
    if (domains === 4) {
        if (lonePairs === 0) return [[0, 1, 0], ...tripod(tripodPolar(109.47))];
        if (lonePairs === 1) return [[0, 1, 0], ...tripod(tripodPolar(107))];
        const h = rad(104.5 / 2);
        const l = rad(115 / 2);
        return [
            [0, Math.cos(l), Math.sin(l)],
            [0, Math.cos(l), -Math.sin(l)],
            [Math.sin(h), -Math.cos(h), 0],
            [-Math.sin(h), -Math.cos(h), 0],
        ];
    }
    if (domains === 5) {
        // Equatorial slots first, so lone pairs take them.
        return [[-1, 0, 0], [0.5, 0, S3], [0.5, 0, -S3], [0, 1, 0], [0, -1, 0]];
    }
    // Opposite slots first, so two lone pairs sit 180° apart.
    return [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
}

export class State {
    @observable accessor bondingPairs: number = 0;
    @observable accessor lonePairs: number = 0;
    /** The student's answer; null until they run their code. */
    @observable accessor shape: string | null = null;

    public init = () => {
        this.bondingPairs = 0;
        this.lonePairs = 0;
        this.shape = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showMolecule":
                this.bondingPairs = m.bondingPairs;
                this.lonePairs = m.lonePairs;
                this.shape = m.shape;
                break;
            default:
                assertNever(m.type);
        }
    };
}

/** Compile-time guarantee that the switch above handles every Message variant. */
function assertNever(x: never): never {
    throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

export default State;
