export type Message =
    // The memory over time: retentions[i] (0 to 1) at days[i]. A study day
    // appears twice in a row at the same day: just before the review, then
    // just after it. studyDays lists the review days; threshold is the
    // "remembered" line.
    | {
          type: "showMemory";
          days: number[];
          retentions: number[];
          studyDays: number[];
          threshold: number;
      };
