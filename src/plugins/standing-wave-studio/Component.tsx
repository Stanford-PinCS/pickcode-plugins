import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { color, font, radius, space, type } from "../../common/tokens";
import {
  PAD,
  VIEW,
  makeScales,
  polylinePoints,
  ticks,
} from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import instructions from "./instructions.md?raw";
import State from "./state";

/**
 * Presentation only. Node detection, the envelope, and the wavelength are all
 * computed in state.ts — this file decides where they land on screen.
 */

const EMPTY_MESSAGE =
  "Run your code to send a wave down the string and watch what the sum does.";
const X_AXIS_TITLE = "Position along the string (m)";
const Y_AXIS_TITLE = "Displacement (m)";
const NODE_RADIUS = 3.4;
const RESULT_WIDTH = 2.8;
const COMPONENT_WIDTH = 1.5;

/** Components cycle through the non-primary series colors; the result owns series[0]. */
function componentColor(index: number): string {
  return color.series[(index % (color.series.length - 1)) + 1];
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function Legend({
  entries,
}: {
  entries: readonly { name: string; stroke: string; bold: boolean }[];
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: space.lg,
        padding: `0 ${space.lg}px`,
      }}
    >
      {entries.map((entry) => (
        <span
          key={entry.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: space.xs,
            fontFamily: font.ui,
            fontSize: 12.5,
            fontWeight: entry.bold ? 600 : 400,
            color: color.ink,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 16,
              height: entry.bold ? 3 : 2,
              borderRadius: 2,
              background: entry.stroke,
            }}
          />
          {entry.name}
        </span>
      ))}
    </div>
  );
}

function Controls({
  playing,
  onTogglePlay,
  frame,
  frameCount,
  onScrub,
  time,
}: {
  playing: boolean;
  onTogglePlay: () => void;
  frame: number;
  frameCount: number;
  onScrub: (value: number) => void;
  time: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: space.md,
        padding: `${space.sm}px ${space.lg}px 0`,
      }}
    >
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={playing ? "Pause the animation" : "Play the animation"}
        style={{
          border: "none",
          borderRadius: radius.md,
          padding: "5px 14px",
          minWidth: 68,
          background: color.accent,
          color: color.surfaceRaised,
          fontFamily: font.ui,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {playing ? "Pause" : "Play"}
      </button>

      <input
        type="range"
        min={0}
        max={Math.max(frameCount - 1, 0)}
        value={frame}
        onChange={(e) => onScrub(Number(e.target.value))}
        aria-label="Move through time"
        style={{ flex: 1, accentColor: color.accent }}
      />

      <span
        style={{
          ...type.value,
          fontSize: 14,
          minWidth: 58,
          textAlign: "right",
        }}
      >
        {time.toFixed(2)}s
      </span>
    </div>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const [reduceMotion] = useState(prefersReducedMotion);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(!reduceMotion);

  const curves = state.curves;
  const xValues = state.xValues;
  const frameTimes = state.frameTimes;
  const frameCount = state.frameCount;

  // A new run replaces every curve, so restart from the first frame.
  useEffect(() => {
    setFrame(0);
    setPlaying(!reduceMotion);
  }, [curves, reduceMotion]);

  const frameInterval =
    frameTimes.length > 1 ? (frameTimes[1] - frameTimes[0]) * 1000 : 50;

  useEffect(() => {
    if (!playing || frameCount < 2) return;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;

    const step = (now: number) => {
      elapsed += now - last;
      last = now;
      if (elapsed >= frameInterval) {
        const advance = Math.floor(elapsed / frameInterval);
        elapsed -= advance * frameInterval;
        setFrame((current) => (current + advance) % frameCount);
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, frameCount, frameInterval]);

  if (curves.length === 0 || xValues.length === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message={EMPTY_MESSAGE} />
        </PluginStage>
      </PluginSurface>
    );
  }

  const safeFrame = Math.min(frame, frameCount - 1);
  const time = frameTimes[safeFrame] ?? 0;
  const xMax = xValues[xValues.length - 1];
  const yMax = Math.max(state.peakOverall * 1.15, 1e-6);
  const s = makeScales(xMax, 2 * yMax);
  /** Displacement 0 sits at the middle of the plot, not the bottom. */
  const syDisp = (y: number) => s.sy(y + yMax);
  const xOf = (i: number) => xValues[i];

  const result = state.result;
  const components = state.components;
  const envelope = state.envelope;
  const nodeCount = state.nodeIndices.length;
  const wavelength = state.wavelength;

  const legend = [
    ...components.map((c, i) => ({
      name: c.name,
      stroke: componentColor(i),
      bold: false,
    })),
    ...(result
      ? [{ name: result.name, stroke: color.series[0], bold: true }]
      : []),
  ];

  const description = result
    ? `${result.name} on a ${xMax} metre string at ${time.toFixed(
        2
      )} seconds, with ${nodeCount} points that never move.`
    : `${components.length} waves on a ${xMax} metre string at ${time.toFixed(
        2
      )} seconds.`;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={description}
        >
          <rect
            x={PAD.left}
            y={PAD.top}
            width={s.plotWidth}
            height={s.plotHeight}
            fill={color.surfaceRaised}
            stroke={color.border}
            rx={4}
          />

          {ticks(2 * yMax, 4).map((v) => (
            <line
              key={`grid-${v}`}
              x1={PAD.left}
              y1={s.sy(v)}
              x2={PAD.left + s.plotWidth}
              y2={s.sy(v)}
              stroke={color.grid}
            />
          ))}

          {/* The envelope: how far each point ever gets from rest. */}
          {result && envelope.length === xValues.length && (
            <>
              <polyline
                points={polylinePoints(
                  envelope.map((v) => v + yMax),
                  s,
                  xOf
                )}
                fill="none"
                stroke={color.reference}
                strokeWidth={1.4}
                strokeDasharray="7 5"
              />
              <polyline
                points={polylinePoints(
                  envelope.map((v) => yMax - v),
                  s,
                  xOf
                )}
                fill="none"
                stroke={color.reference}
                strokeWidth={1.4}
                strokeDasharray="7 5"
              />
            </>
          )}

          {/* Rest position of the string. */}
          <line
            x1={PAD.left}
            y1={syDisp(0)}
            x2={PAD.left + s.plotWidth}
            y2={syDisp(0)}
            stroke={color.axis}
          />

          {components.map((curve, i) => (
            <polyline
              key={`component-${curve.name}`}
              points={polylinePoints(
                (curve.frames[safeFrame] ?? []).map((v) => v + yMax),
                s,
                xOf
              )}
              fill="none"
              stroke={componentColor(i)}
              strokeWidth={COMPONENT_WIDTH}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {result && (
            <polyline
              points={polylinePoints(
                (result.frames[safeFrame] ?? []).map((v) => v + yMax),
                s,
                xOf
              )}
              fill="none"
              stroke={color.series[0]}
              strokeWidth={RESULT_WIDTH}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {state.nodePositions.map((x) => (
            <circle
              key={`node-${x}`}
              cx={s.sx(x)}
              cy={syDisp(0)}
              r={NODE_RADIUS}
              fill={color.reference}
            />
          ))}

          <line
            x1={PAD.left}
            y1={PAD.top}
            x2={PAD.left}
            y2={PAD.top + s.plotHeight}
            stroke={color.axis}
          />

          {ticks(xMax).map((v) => (
            <text
              key={`xt-${v}`}
              x={s.sx(v)}
              y={PAD.top + s.plotHeight + 20}
              textAnchor="middle"
              style={type.tick}
            >
              {v}
            </text>
          ))}
          {ticks(2 * yMax, 4).map((v) => (
            <text
              key={`yt-${v}`}
              x={PAD.left - 8}
              y={s.sy(v) + 4}
              textAnchor="end"
              style={type.tick}
            >
              {(v - yMax).toFixed(1)}
            </text>
          ))}

          <text
            x={PAD.left + s.plotWidth / 2}
            y={VIEW.height - 8}
            textAnchor="middle"
            style={type.axisTitle}
          >
            {X_AXIS_TITLE}
          </text>
          <text
            x={14}
            y={PAD.top + s.plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 14, ${PAD.top + s.plotHeight / 2})`}
            style={type.axisTitle}
          >
            {Y_AXIS_TITLE}
          </text>
        </svg>
      </PluginStage>

      <Legend entries={legend} />

      <Controls
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
        frame={safeFrame}
        frameCount={frameCount}
        onScrub={(value) => {
          setPlaying(false);
          setFrame(value);
        }}
        time={time}
      />

      <StatRow
        stats={[
          {
            label: "Nodes",
            value: result ? String(nodeCount) : EMPTY,
            color: color.reference,
          },
          {
            label: "Wavelength",
            value: wavelength === null ? EMPTY : `${wavelength.toFixed(2)} m`,
            color: color.reference,
          },
          {
            label: "Biggest Swing",
            value: result ? `${state.peakDisplacement.toFixed(2)} m` : EMPTY,
            color: color.series[0],
          },
          { label: "Waves Drawn", value: String(curves.length) },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
