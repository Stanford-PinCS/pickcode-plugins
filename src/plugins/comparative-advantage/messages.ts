/**
 * Every message the student's code can send to this plugin.
 *
 * `arvia` and `bovia` are the two ends of each country's straight-line PPC: the most corn it can make if it makes no fish, and the most fish if it makes no corn, from 1 to 1000 tons each. `arviaCornCost` and `boviaCornCost` are what the student's opportunityCost returned for each country's corn: the opportunity cost of 1 ton of corn in tons of fish only once the function is right. `cornMaker` is the country the student's whoMakesCorn picked to make only corn; the other makes only fish. The corn maker then ships `cornTraded` tons of corn to the other country for `fishPerCorn` tons of fish per ton (the terms of trade).
 */
export type Message = {
    type: "showTrade";
    arvia: { corn: number; fish: number };
    bovia: { corn: number; fish: number };
    arviaCornCost: number;
    boviaCornCost: number;
    cornMaker: "Arvia" | "Bovia";
    fishPerCorn: number;
    cornTraded: number;
};
