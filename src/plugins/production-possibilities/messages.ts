/**
 * Every message the student's code can send to this plugin.
 *
 * `capitalGoods` is the PPC table: `capitalGoods[i]` is the most capital goods the country can make while it makes i units of consumption goods, from 2 to 21 rows, each from 0 to 1000 and less than the one before, and the last one 0. `costs` is what the student's opportunityCosts returned, one number for each additional unit of consumption goods, from 0 to the capital goods in the row before that unit (`costs[i]` is at most `capitalGoods[i]`): the opportunity cost of that unit, in capital goods, only once the function is right. `growth` is how many percent more of each good the country can make after economic growth, from 0 to 100, which shifts the PPC outward. `points` are the combinations tested, and `answers` holds what the student's describePoint called each one when it compared the combination with the PPC after growth.
 */
export type Message = {
    type: "showPossibilities";
    capitalGoods: readonly number[];
    costs: readonly number[];
    growth: number;
    points: readonly { consumption: number; capital: number }[];
    answers: readonly ("efficient" | "inefficient" | "unattainable")[];
};
