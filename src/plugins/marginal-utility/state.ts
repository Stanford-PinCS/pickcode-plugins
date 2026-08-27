import { action, computed, observable } from "mobx";
import { Message } from "./messages";

/* ───────── Game constants ─────────
 * This is the whole "economy" of the activity: what each fruit costs,
 * where its marginal utility starts, how fast that utility falls as you
 * buy more of it, and how much money the shopper has to spend.
 *
 * Apple:  starts at MU 30, drops 10 per unit, costs $2.
 * Banana: starts at MU 20, drops 5 per unit, costs $1.
 * Budget: $7.
 *
 * These match the numbers in instructions.md — if you change one, change
 * the other.
 */
export const BUDGET = 7;

export const APPLE_PRICE = 2;
export const APPLE_START_MU = 30;
export const APPLE_MU_STEP = 10;

export const BANANA_PRICE = 1;
export const BANANA_START_MU = 20;
export const BANANA_MU_STEP = 5;

export type Choice = "apple" | "banana";

// The marginal utility of the (countSoFar + 1)th unit of a fruit.
const nextMU = (start: number, step: number, countSoFar: number) =>
  start - step * countSoFar;

// Sum of marginal utility across every unit purchased of a fruit whose MU
// starts at `start` and falls by `step` each unit (a simple arithmetic
// series sum).
export const totalUtilityFor = (start: number, step: number, count: number) =>
  count * start - (step * count * (count - 1)) / 2;

// The best total utility ANY sequence of picks could earn from this budget
// — found by always buying whichever affordable fruit currently has the
// higher MU/price ratio. Greedy-by-ratio is provably optimal here (each
// fruit's ratio only falls as you buy more of it), so this is the true
// ceiling, not just an estimate. Used to grade how close a run got.
const computeOptimalUtility = () => {
  let apples = 0;
  let bananas = 0;
  let spent = 0;
  // Budget / cheapest price is a hard upper bound on how many rounds this
  // could ever take.
  const maxRounds = Math.ceil(BUDGET / Math.min(APPLE_PRICE, BANANA_PRICE)) + 1;
  for (let i = 0; i < maxRounds; i++) {
    const remaining = BUDGET - spent;
    const canApple = remaining >= APPLE_PRICE;
    const canBanana = remaining >= BANANA_PRICE;
    if (!canApple && !canBanana) break;
    const appleRatio = canApple
      ? nextMU(APPLE_START_MU, APPLE_MU_STEP, apples) / APPLE_PRICE
      : -Infinity;
    const bananaRatio = canBanana
      ? nextMU(BANANA_START_MU, BANANA_MU_STEP, bananas) / BANANA_PRICE
      : -Infinity;
    if (appleRatio >= bananaRatio) {
      apples++;
      spent += APPLE_PRICE;
    } else {
      bananas++;
      spent += BANANA_PRICE;
    }
  }
  return (
    totalUtilityFor(APPLE_START_MU, APPLE_MU_STEP, apples) +
    totalUtilityFor(BANANA_START_MU, BANANA_MU_STEP, bananas)
  );
};

// Computed once at module load — depends only on the constants above.
export const OPTIMAL_UTILITY = computeOptimalUtility();

export class State {
  @observable
  accessor choices: Choice[] = [];
  @observable
  accessor error: string | null = null;

  public init = () => {};

  @computed
  get appleCount() {
    return this.choices.filter((c) => c === "apple").length;
  }

  @computed
  get bananaCount() {
    return this.choices.filter((c) => c === "banana").length;
  }

  @computed
  get appleMU() {
    return nextMU(APPLE_START_MU, APPLE_MU_STEP, this.appleCount);
  }

  @computed
  get bananaMU() {
    return nextMU(BANANA_START_MU, BANANA_MU_STEP, this.bananaCount);
  }

  @computed
  get appleMUP() {
    return this.appleMU / APPLE_PRICE;
  }

  @computed
  get bananaMUP() {
    return this.bananaMU / BANANA_PRICE;
  }

  @computed
  get totalCost() {
    return this.appleCount * APPLE_PRICE + this.bananaCount * BANANA_PRICE;
  }

  @computed
  get remainingBudget() {
    return BUDGET - this.totalCost;
  }

  @computed
  get totalUtility() {
    return (
      totalUtilityFor(APPLE_START_MU, APPLE_MU_STEP, this.appleCount) +
      totalUtilityFor(BANANA_START_MU, BANANA_MU_STEP, this.bananaCount)
    );
  }

  @computed
  get canAffordApple() {
    return this.remainingBudget >= APPLE_PRICE;
  }

  @computed
  get canAffordBanana() {
    return this.remainingBudget >= BANANA_PRICE;
  }

  // Neither fruit fits in what's left — the shopping trip is over.
  @computed
  get isShoppingDone() {
    return !this.canAffordApple && !this.canAffordBanana;
  }

  @action
  public onMessage = (message: Message) => {
    if (this.isShoppingDone) {
      this.error = `Your $${BUDGET} budget is already spent — there's nothing left to buy.`;
      return false;
    }

    switch (message) {
      case "apple":
        if (!this.canAffordApple) {
          this.error = `An apple costs $${APPLE_PRICE}, but only $${this.remainingBudget} is left. Try banana instead.`;
          return false;
        }
        this.choices.push("apple");
        this.error = null;
        return true;
      case "banana":
        if (!this.canAffordBanana) {
          this.error = `A banana costs $${BANANA_PRICE}, but only $${this.remainingBudget} is left.`;
          return false;
        }
        this.choices.push("banana");
        this.error = null;
        return true;
      default:
        this.error = `choose() returned "${message}" — it needs to return "apple" or "banana".`;
        return false;
    }
  };
}

export default State;
