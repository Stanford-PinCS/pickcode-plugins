import { action, observable } from "mobx";
import { Message } from "./messages";

/** Each worker's marginal product: how much total product rises when the firm hires that worker. Entry i belongs to worker i + 1. */
export function marginalProducts(totalProduct: readonly number[]): number[] {
    return totalProduct.slice(1).map((tp, i) => tp - totalProduct[i]);
}

/** Each worker's marginal revenue product, MRP = MP × P: in a perfectly competitive output market, marginal revenue equals the price. Entry i belongs to worker i + 1. */
export function marginalRevenueProducts(totalProduct: readonly number[], price: number): number[] {
    return marginalProducts(totalProduct).map((mp) => mp * price);
}

/** Everything the plot and the bottom row show for one run. */
export interface Hiring {
    /** Total product with 0, 1, 2, … workers. */
    totalProduct: number[];
    price: number;
    wage: number;
    /** How many workers the student's loop hired: workers 1 to `hired`. */
    hired: number;
    /** Each worker's marginal product and marginal revenue product. Entry i belongs to worker i + 1. */
    mp: number[];
    mrp: number[];
    /** MRP of the last worker hired, or null when the loop hired nobody. */
    lastMRP: number | null;
    /** MRP of the first worker the loop didn't hire, or null when it hired every worker in the table. */
    nextMRP: number | null;
    /** Total revenue from what the hired workers produce: price × total product. */
    revenue: number;
    /** What the firm pays the hired workers in all: wage × workers hired. */
    wages: number;
}

export function summarizeHiring(totalProduct: readonly number[], price: number, wage: number, hired: number): Hiring {
    const mp = marginalProducts(totalProduct);
    const mrp = marginalRevenueProducts(totalProduct, price);
    return {
        totalProduct: [...totalProduct],
        price,
        wage,
        hired,
        mp,
        mrp,
        lastMRP: hired > 0 ? mrp[hired - 1] : null,
        nextMRP: hired < mrp.length ? mrp[hired] : null,
        revenue: price * totalProduct[hired],
        wages: wage * hired,
    };
}

export class State {
    @observable accessor hiring: Hiring | null = null;

    public init = () => {
        this.hiring = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showHiring":
                this.hiring = summarizeHiring(m.totalProduct, m.price, m.wage, m.hired);
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
