import { Curve, Message } from "../../messages";

/**
 * The boundary between student code and the plugin.
 *
 * The lesson is two ideas and no more: a function can be passed to another
 * function, and two arrays can be combined element by element. So this file
 * hands the student the two wave functions ready-made and asks for one
 * function back — the one that says what the whole string looks like at a
 * given moment.
 *
 * Every error message here is read by a student who just made a mistake, so
 * each one says what is wrong and what to do about it.
 */

/** Sample points making up the string. Odd, so there is a point at the centre. */
const STRING_POINTS = 121;
/** Length of the string in metres. */
const STRING_LENGTH = 10;
/** Frames captured per simulated second. */
const FPS = 20;
const MIN_SECONDS = 0.5;
const MAX_SECONDS = 6;
/** Displacements are rounded before sending; the payload is one big message. */
const DECIMALS = 4;

const AMPLITUDE = 1;
const WAVELENGTH = 5;
const FREQUENCY = 1;
const WAVE_NUMBER = (2 * Math.PI) / WAVELENGTH;
const ANGULAR_FREQUENCY = 2 * Math.PI * FREQUENCY;

function round(value: number): number {
  const factor = Math.pow(10, DECIMALS);
  return Math.round(value * factor) / factor;
}

/** Position in metres of sample point `i`. */
function positionOf(index: number): number {
  return (index * STRING_LENGTH) / (STRING_POINTS - 1);
}

/** A wave travelling right (`direction` +1) or left (`direction` -1). */
function travelling(direction: number) {
  return (rawX: unknown, rawT: unknown): number => {
    const x = Number(rawX);
    const t = Number(rawT);
    return (
      AMPLITUDE * Math.sin(WAVE_NUMBER * x - direction * ANGULAR_FREQUENCY * t)
    );
  };
}

const rightward = travelling(+1);
const leftward = travelling(-1);

/** Sample a wave function at every point on the string. */
function sampleInternal(
  f: (x: number, t: number) => number,
  time: number
): number[] {
  const heights: number[] = [];
  for (let i = 0; i < STRING_POINTS; i++) {
    heights.push(round(f(positionOf(i), time)));
  }
  return heights;
}

/**
 * Check one frame returned by the student's function. The common mistakes are
 * a loop that never pushes, a loop with the wrong bound, and maths that
 * produces NaN — each gets its own message.
 */
function toDisplacements(returned: unknown, time: number): number[] {
  if (!Array.isArray(returned)) {
    throw new Error(
      `Your stringAt function did not return a list of numbers. ` +
        `It should return the array that add() builds.`
    );
  }
  if (returned.length !== STRING_POINTS) {
    throw new Error(
      `Your stringAt function returned ${returned.length} numbers, but the string has ` +
        `${STRING_POINTS} points. Does your loop add one value for every point?`
    );
  }
  const out = new Array<number>(STRING_POINTS);
  for (let i = 0; i < STRING_POINTS; i++) {
    const value = Number(returned[i]);
    if (!Number.isFinite(value)) {
      throw new Error(
        `Your stringAt function gave ${String(returned[i])} at point ${i} ` +
          `(x = ${positionOf(i).toFixed(2)} m, t = ${time.toFixed(2)} s). ` +
          `Check that sample() and add() are both getting the values they need.`
      );
    }
    out[i] = round(value);
  }
  return out;
}

const createExports = (sendMessage: (message: Message) => void) => {
  return Promise.resolve({
    /** Sample points making up the string. Loop from 0 up to this number. */
    STRING_POINTS,

    /**
     * Position in metres of sample point `i`, from 0 at the left end to the
     * far end of the string.
     *
     * @example
     * xAt(0)   // 0
     * xAt(120) // 10
     */
    xAt: (rawIndex: unknown) => {
      const index = Number(rawIndex);
      if (!Number.isFinite(index)) {
        throw new Error(`xAt expects a point number, like xAt(i).`);
      }
      if (index < 0 || index > STRING_POINTS - 1) {
        throw new Error(
          `xAt(${index}) is off the string. Point numbers run from 0 to ${
            STRING_POINTS - 1
          }.`
        );
      }
      return positionOf(index);
    },

    /**
     * A wave travelling to the right. Give it a position and a time and it
     * returns one height.
     */
    rightward,

    /** The same wave, travelling to the left. */
    leftward,

    /**
     * Plays your string. Calls your function once per frame, hands it the
     * time, and draws whatever array comes back.
     *
     * @param stringAt - Your function that takes a time and returns the string.
     * @param seconds  - How long to run, from 0.5 to 6. Defaults to 4.
     *
     * @example
     * animate(stringAt);
     */
    animate: (rawStringAt: unknown, rawSeconds: unknown = 4) => {
      if (typeof rawStringAt !== "function") {
        throw new Error(
          `animate needs a function — the name of your function, with no ` +
            `parentheses after it. Example: animate(stringAt).`
        );
      }
      const stringAt = rawStringAt as (t: number) => unknown;

      const seconds = Number(rawSeconds);
      if (!Number.isFinite(seconds)) {
        throw new Error(
          `animate expects a number of seconds, like animate(stringAt, 4).`
        );
      }
      if (seconds < MIN_SECONDS || seconds > MAX_SECONDS) {
        throw new Error(
          `animate(stringAt, ${seconds}) is out of range. Ask for between ` +
            `${MIN_SECONDS} and ${MAX_SECONDS} seconds.`
        );
      }

      const frameCount = Math.max(2, Math.round(seconds * FPS) + 1);
      const frameTimes: number[] = [];
      for (let f = 0; f < frameCount; f++) {
        frameTimes.push(round((f * seconds) / (frameCount - 1)));
      }

      const xValues: number[] = [];
      for (let i = 0; i < STRING_POINTS; i++) xValues.push(round(positionOf(i)));

      const studentFrames: number[][] = [];
      for (const time of frameTimes) {
        let returned: unknown;
        try {
          returned = stringAt(time);
        } catch (e) {
          const detail = e instanceof Error ? e.message : String(e);
          // By far the most common cause: calling the wave instead of passing it.
          const hint = /is not a function/.test(detail)
            ? ` Did you write sample(rightward(x, t)) where you meant sample(rightward, t)?`
            : ``;
          throw new Error(
            `Your stringAt function stopped with an error at t = ${time.toFixed(
              2
            )} s: ${detail}.${hint}`
          );
        }
        studentFrames.push(toDisplacements(returned, time));
      }

      // The two waves you were given are always drawn, so you can see what
      // your result was built out of.
      const curves: Curve[] = [
        {
          name: "Rightward",
          role: "component",
          frames: frameTimes.map((t) => sampleInternal(rightward, t)),
        },
        {
          name: "Leftward",
          role: "component",
          frames: frameTimes.map((t) => sampleInternal(leftward, t)),
        },
        { name: "Your result", role: "result", frames: studentFrames },
      ];

      sendMessage({ type: "showWaves", xValues, frameTimes, curves });
    },
  });
};

export default createExports;
