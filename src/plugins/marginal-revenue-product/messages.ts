/**
 * Every message the student's code can send to this plugin.
 *
 * `totalProduct` is the firm's total product with 0, 1, 2, … workers, so its index is the number of workers. `price` is the output price and `wage` the market wage. `hired` is how many workers the student's pickersToHire function returned.
 */
export type Message = {
    type: "showHiring";
    totalProduct: readonly number[];
    price: number;
    wage: number;
    hired: number;
};
