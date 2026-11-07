/**
 * Every message the student's code can send to this plugin.
 *
 * The foreign exchange market for Pellia's currency, the pell. At an exchange rate of `rate` quors per pell, the quantity of pells demanded is `demandAtZero + demandSlope × rate` and the quantity supplied is `supplyAtZero + supplySlope × rate`, in millions of pells a day. `shift` moves the demand curve right (more than 0) or left (less than 0) by that many millions of pells a day at every exchange rate. `rateBefore` and `rateAfter` are the equilibrium exchange rates before and after the shift.
 *
 * `prices` are what Pellia's exports sell for in Pellia, in pells. `pricesBefore` and `pricesAfter` are the prices in quors the student's code gave for them at `rateBefore` and at `rateAfter`.
 */
export type Message = {
    type: "showExchangeMarket";
    demandAtZero: number;
    demandSlope: number;
    supplyAtZero: number;
    supplySlope: number;
    shift: number;
    rateBefore: number;
    rateAfter: number;
    prices: readonly number[];
    pricesBefore: readonly number[];
    pricesAfter: readonly number[];
};
