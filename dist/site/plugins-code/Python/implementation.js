/**
 * JS implementation used by the Python runtime bridge.
 * Python student code calls these exported APIs as snake_case.
 */
function computeTrueValues(n2, h2) {
  const nh3FromN2 = n2 * 2;
  const nh3FromH2 = h2 * (2 / 3);
  const trueNh3 = Math.min(nh3FromN2, nh3FromH2);

  let trueLimiting;
  if (nh3FromN2 < nh3FromH2) {
    trueLimiting = "n2";
  } else if (nh3FromH2 < nh3FromN2) {
    trueLimiting = "h2";
  } else {
    trueLimiting = "None";
  }

  const n2Consumed = trueNh3 / 2;
  const h2Consumed = (trueNh3 * 3) / 2;
  const n2Remaining = n2 - n2Consumed;
  const h2Remaining = h2 - h2Consumed;

  return {
    true_nh3: trueNh3,
    true_limiting: trueLimiting,
    n2_consumed: n2Consumed,
    h2_consumed: h2Consumed,
    n2_remaining: n2Remaining,
    h2_remaining: h2Remaining,
  };
}

let runCounter = 0;

const createExports = (sendMessage) =>
  Promise.resolve({
    proceed: (resulting_nh3) => {
      runCounter++;
      let input_h2 = 0;
      let input_n2 = 0;
      let student_nh3 = 0;
      let student_limiting = "???";

      try {
        const result = resulting_nh3();
        if (Array.isArray(result) && result.length >= 4) {
          input_h2 = Number(result[0]) || 0;
          input_n2 = Number(result[1]) || 0;
          student_nh3 = Number(result[2]) || 0;
          student_limiting = String(result[3]) || "???";
        } else if (result && typeof result === "object") {
          input_h2 = Number(result.h2_reactant_amount) || 0;
          input_n2 = Number(result.n2_reactant_amount) || 0;
          student_nh3 = Number(result.nh3_product_made) || 0;
          student_limiting = String(result.limiting_reactant || "???");
        }
      } catch (error) {
        console.error("Error calling student function:", error);
        student_limiting = "Error";
      }

      const trueVals = computeTrueValues(input_n2, input_h2);
      const nh3_correct = Math.abs(student_nh3 - trueVals.true_nh3) < 0.01;
      const limiting_correct =
        student_limiting.toLowerCase() === trueVals.true_limiting.toLowerCase();

      sendMessage({
        run_id: runCounter,
        input_n2,
        input_h2,
        true_nh3: trueVals.true_nh3,
        true_limiting: trueVals.true_limiting,
        n2_consumed: trueVals.n2_consumed,
        h2_consumed: trueVals.h2_consumed,
        n2_remaining: trueVals.n2_remaining,
        h2_remaining: trueVals.h2_remaining,
        student_nh3,
        student_limiting,
        nh3_correct,
        limiting_correct,
      });
    },
  });

export default createExports;
