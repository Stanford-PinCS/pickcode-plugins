export type Message =
    // One Skinner box session. pressTimes[i] is when press i + 1 happened, in
    // seconds; rewarded[i] is 1 when that press earned a pellet. The food
    // dispenser turns off at foodOffAt, and the session ends at endAt.
    | {
          type: "showSession";
          pressTimes: number[];
          rewarded: number[];
          foodOffAt: number;
          endAt: number;
      };
