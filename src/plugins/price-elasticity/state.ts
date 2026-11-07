import { action, observable } from "mobx";
import { Message, Range } from "./messages";

/** The percentage change from an old value to a new one, measured from where the change starts: (new − old) ÷ old × 100. */
export function percentChange(oldValue: number, newValue: number): number {
    return ((newValue - oldValue) / oldValue) * 100;
}

/** Total revenue at one price of the schedule: the price times the quantity demanded there. */
export function totalRevenue(price: number, quantity: number): number {
    return price * quantity;
}

/** One stretch of the demand curve: the price increase from one price of the schedule to the next. */
export interface Stretch {
    /** The stretch runs from point `index` of the schedule to point `index + 1`. */
    index: number;
    /** What the student's elasticity function returned for this price increase. */
    elasticity: number;
    /** What the student's describe function returned for that elasticity. */
    range: Range;
    /** The percentage changes in price and in quantity demanded, each measured from the stretch's lower price. */
    percentPrice: number;
    percentQuantity: number;
    /** Total revenue at the higher price minus total revenue at the lower one. */
    revenueChange: number;
    /** Whether the student listed this price increase in `raises`. */
    tested: boolean;
}

/** Everything the graphs show for one run. The elasticities, their ranges and the counts come from the student's functions; the total revenues come from the schedule alone. */
export interface Walk {
    /** The demand schedule, prices from lowest to highest. */
    prices: number[];
    quantities: number[];
    /** Total revenue at each price. */
    revenues: number[];
    stretches: Stretch[];
    /** The highest total revenue, and every point of the schedule that reaches it. */
    topRevenue: number;
    topPoints: number[];
    /** How many stretches the student's describe function put in each range. */
    counts: Record<Range, number>;
    /** The smallest and largest elasticity the student's function returned. */
    lowest: number;
    highest: number;
}

export function summarize(
    prices: readonly number[],
    quantities: readonly number[],
    elasticities: readonly number[],
    ranges: readonly Range[],
    raises: readonly number[],
): Walk {
    const revenues = prices.map((p, i) => totalRevenue(p, quantities[i]));
    const tested = new Set(raises);
    const stretches = elasticities.map((elasticity, i) => ({
        index: i,
        elasticity,
        range: ranges[i],
        percentPrice: percentChange(prices[i], prices[i + 1]),
        percentQuantity: percentChange(quantities[i], quantities[i + 1]),
        revenueChange: revenues[i + 1] - revenues[i],
        tested: tested.has(i),
    }));
    const topRevenue = Math.max(...revenues);
    // Revenues that differ from the top only by floating-point rounding count as tied for it.
    const tolerance = 1e-9 * Math.max(1, Math.abs(topRevenue));
    const counts: Record<Range, number> = { elastic: 0, "unit elastic": 0, inelastic: 0 };
    for (const s of stretches) counts[s.range]++;
    return {
        prices: [...prices],
        quantities: [...quantities],
        revenues,
        stretches,
        topRevenue,
        topPoints: revenues.flatMap((r, i) => (topRevenue - r <= tolerance ? [i] : [])),
        counts,
        lowest: Math.min(...elasticities),
        highest: Math.max(...elasticities),
    };
}

export class State {
    @observable accessor walk: Walk | null = null;

    public init = () => {
        this.walk = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showDemand":
                this.walk = summarize(m.prices, m.quantities, m.elasticities, m.ranges, m.raises);
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
