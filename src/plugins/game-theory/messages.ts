/**
 * Every message the student's code can send to this plugin.
 *
 * Prices are numbered the way the student's code numbers them: 0 is the high price and 1 is the low price. `gull` and `heron` are each airline's own payoffs, as payoffs[myPrice][otherPrice]: its monthly profit, in thousands of dollars, when it charges myPrice and the other airline charges otherPrice.
 *
 * `showGame` draws the payoff matrix. `gullPicks[h]` is the price the student's bestResponse function returned for Gull when Heron charges h, and `heronPicks[g]` the price it returned for Heron when Gull charges g. `showDeal` marks a deal in which Gull charges `gull` and Heron charges `heron`.
 */
export type Message =
    | {
          type: "showGame";
          gull: readonly (readonly number[])[];
          heron: readonly (readonly number[])[];
          gullPicks: readonly (0 | 1)[];
          heronPicks: readonly (0 | 1)[];
      }
    | {
          type: "showDeal";
          gull: 0 | 1;
          heron: 0 | 1;
      };
