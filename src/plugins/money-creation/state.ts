import { action, observable } from "mobx";
import { Message } from "./messages";

/** A bank's required reserves: the required reserve ratio times its deposits. */
export function requiredReserves(deposit: number, reserveRatio: number): number {
    return deposit * reserveRatio;
}

/** The maximum value of the money multiplier: the reciprocal of the required reserve ratio. */
export function maxMoneyMultiplier(reserveRatio: number): number {
    return 1 / reserveRatio;
}

/** One bank's balance sheet in the chain, counting only its new deposit and what it did with it. Its assets (required reserves, excess reserves and loans) add up to its liability, the deposit. */
export interface BankSheet {
    /** The new demand deposit the bank got. */
    deposit: number;
    /** Its required reserves: the required reserve ratio times the deposit. */
    required: number;
    /** The excess reserves it still holds after making its loan: the deposit minus its required reserves and its loan. */
    excess: number;
    /** What the bank lent. It's spent and deposited in the next bank. */
    loan: number;
    /** The new money so far: this bank's loan plus the loans of every bank before it. */
    newMoneySoFar: number;
}

/** Everything the plot and the bottom row show for one run. */
export interface Chain {
    reserveRatio: number;
    /** The maximum value of the money multiplier, 1 ÷ the required reserve ratio. */
    multiplier: number;
    banks: BankSheet[];
    /** Bank 1's excess reserves when the new deposit arrives, before it lends anything: the deposit minus its required reserves. */
    firstExcess: number;
    /** The most new money the simple money multiplier predicts: Bank 1's excess reserves times the maximum money multiplier. */
    maxNewMoney: number;
    /** The new money the chain created: every bank's loan, added up. */
    newMoney: number;
}

export function summarizeChain(reserveRatio: number, deposits: readonly number[], loans: readonly number[]): Chain {
    let newMoneySoFar = 0;
    const banks = deposits.map((deposit, i) => {
        const loan = loans[i];
        const required = requiredReserves(deposit, reserveRatio);
        newMoneySoFar += loan;
        // A loan can be up to a billionth of the deposit over the bank's excess reserves (floating-point rounding), so the excess it holds never goes below 0.
        return { deposit, required, excess: Math.max(0, deposit - required - loan), loan, newMoneySoFar };
    });
    const multiplier = maxMoneyMultiplier(reserveRatio);
    const firstExcess = deposits[0] - requiredReserves(deposits[0], reserveRatio);
    return {
        reserveRatio,
        multiplier,
        banks,
        firstExcess,
        maxNewMoney: firstExcess * multiplier,
        newMoney: newMoneySoFar,
    };
}

export class State {
    @observable accessor chain: Chain | null = null;

    public init = () => {
        this.chain = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showChain":
                this.chain = summarizeChain(m.reserveRatio, m.deposits, m.loans);
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
