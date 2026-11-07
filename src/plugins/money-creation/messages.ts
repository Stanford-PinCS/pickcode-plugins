/**
 * Every message the student's code can send to this plugin.
 *
 * `reserveRatio` is the required reserve ratio. `deposits` and `loans` hold one entry per bank in the chain, in order: Bank 1's deposit is the new deposit, and each later bank's deposit is the loan the bank before it made.
 */
export type Message = {
    type: "showChain";
    reserveRatio: number;
    deposits: readonly number[];
    loans: readonly number[];
};
