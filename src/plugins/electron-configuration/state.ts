import { action, observable } from "mobx";
import { Message } from "./messages";

export interface Subshell {
    name: string;
    /** Principal energy level (shell number). */
    n: number;
    capacity: number;
}

const CAPACITY: Record<string, number> = { s: 2, p: 6, d: 10, f: 14 };

/** Subshells in Aufbau (lowest energy first) order, through 7p. */
export const SUBSHELLS: readonly Subshell[] = [
    "1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d",
    "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p",
].map((name) => ({
    name,
    n: Number(name[0]),
    capacity: CAPACITY[name[1]],
}));

export const ELEMENT_SYMBOLS: readonly string[] = (
    "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co " +
    "Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb " +
    "Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re " +
    "Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es " +
    "Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og"
).split(" ");

/** One electron, in the order the student's loop placed it. */
export interface PlacedElectron {
    /** Which loop pass (placeElectrons call) placed it, from 0. */
    pass: number;
    subshell: number;
    /** Its position among all electrons in this subshell, from 0. */
    indexInSubshell: number;
}

/**
 * Expands the student's placements into single electrons. Within a subshell
 * the orbital (box) and spin follow Hund's rule: one spin-up electron in each
 * box first, then a spin-down partner in each. Anything past the subshell's
 * capacity is an overflow electron (it breaks the Pauli exclusion principle).
 */
export function expandElectrons(
    placements: readonly { subshell: number; count: number }[]
): PlacedElectron[] {
    const filled = new Array(SUBSHELLS.length).fill(0);
    const out: PlacedElectron[] = [];
    placements.forEach(({ subshell, count }, pass) => {
        for (let k = 0; k < count; k++) {
            out.push({ pass, subshell, indexInSubshell: filled[subshell]++ });
        }
    });
    return out;
}

/** Box index and spin for the k-th electron of a subshell (Hund's rule). */
export function orbitalSlot(subshell: number, indexInSubshell: number) {
    const capacity = SUBSHELLS[subshell].capacity;
    const orbitals = capacity / 2;
    if (indexInSubshell >= capacity) {
        return { overflow: true, box: indexInSubshell - capacity, spinUp: true };
    }
    return indexInSubshell < orbitals
        ? { overflow: false, box: indexInSubshell, spinUp: true }
        : { overflow: false, box: indexInSubshell - orbitals, spinUp: false };
}

export class State {
    @observable accessor atomicNumber: number | null = null;
    @observable accessor placements: { subshell: number; count: number }[] = [];

    public init = () => {
        this.atomicNumber = null;
        this.placements = [];
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showAtom":
                this.placements = Array.from(m.placements, (p) => ({
                    subshell: p.subshell,
                    count: p.count,
                }));
                this.atomicNumber = m.atomicNumber;
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
