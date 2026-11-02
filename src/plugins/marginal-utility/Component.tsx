import { observer } from "mobx-react-lite";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { color, font, radius, space, type } from "../../common/tokens";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { useRunAnimation } from "../../common/useRunAnimation";
import instructions from "./instructions.md?raw";
import State from "./state";

// The market the `optimize` export simulates. Kept in step with
// languages/BasicJS/implementation.ts.
const BUDGET = 7;
const FRUIT = {
  apple: { name: "Apple", price: 2, startMU: 30, drop: 10, fill: color.series[0] },
  banana: { name: "Banana", price: 1, startMU: 20, drop: 5, fill: color.series[2] },
} as const;
type Fruit = keyof typeof FRUIT;

// One purchase lands every STEP_MS, so each pick can be followed.
const STEP_MS = 900;

interface Pick {
  fruit: Fruit;
  /** Marginal utility of this unit when it was bought. */
  mu: number;
  /** Whether it had the higher (or tied) MU-per-price ratio at the time. */
  best: boolean;
}

/** Replays the purchases, recording each pick's utility and whether it was the better buy. */
function replay(choices: readonly string[]): Pick[] {
  const bought = { apple: 0, banana: 0 };
  const ratio = (f: Fruit) =>
    (FRUIT[f].startMU - FRUIT[f].drop * bought[f]) / FRUIT[f].price;
  const picks: Pick[] = [];
  for (const c of choices) {
    if (c !== "apple" && c !== "banana") continue;
    const other: Fruit = c === "apple" ? "banana" : "apple";
    const mu = FRUIT[c].startMU - FRUIT[c].drop * bought[c];
    picks.push({ fruit: c, mu, best: ratio(c) >= ratio(other) });
    bought[c]++;
  }
  return picks;
}

/** Scales `content` down so it always fits inside `stage` without scrolling. */
function useFitScale(
  stageRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  /** Whether the content is mounted; the fit re-attaches when it appears. */
  active: boolean
): number {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const content = contentRef.current;
    if (!stage || !content) return;
    const fit = () => {
      // offsetWidth/Height are layout sizes, unaffected by the transform.
      const w = content.offsetWidth;
      const h = content.offsetHeight;
      if (!w || !h || !stage.clientWidth || !stage.clientHeight) return;
      setScale(
        Math.min(1, (stage.clientWidth / w) * 0.98, (stage.clientHeight / h) * 0.98)
      );
    };
    fit();
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    ro.observe(stage);
    ro.observe(content);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [stageRef, contentRef, active]);
  return scale;
}

function FruitIcon({ fruit, size = 22 }: { fruit: Fruit; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {fruit === "apple" ? (
        <>
          <circle cx={12} cy={14} r={8} fill={FRUIT.apple.fill} />
          <path
            d="M12 7 Q12.5 4 15 2.5"
            stroke={color.ink}
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <path
          d="M4 5 Q5 19 20 19 L20.5 17 Q10 15 7 4.5 Z"
          fill={FRUIT.banana.fill}
          stroke={FRUIT.banana.fill}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function FruitCard({
  fruit,
  bought,
  highlight,
}: {
  fruit: Fruit;
  bought: number;
  /** The pick just made on this fruit: was it the better buy? */
  highlight: boolean | null;
}) {
  const f = FRUIT[fruit];
  const mu = f.startMU - f.drop * bought;
  const rows = [
    { label: "Price", value: `$${f.price}` },
    { label: "Marginal Utility", value: String(mu) },
    { label: "MU / Price", value: (mu / f.price).toFixed(1) },
    { label: "Bought", value: String(bought) },
  ];

  let border = `1px solid ${color.border}`;
  let background: string = color.surfaceRaised;
  if (highlight === true) {
    border = `2px solid ${color.positive}`;
    background = color.positiveSoft;
  } else if (highlight === false) {
    border = `2px dashed ${color.negative}`;
    background = color.negativeSoft;
  }

  return (
    <div
      style={{
        width: 200,
        boxSizing: "border-box",
        padding: space.md,
        borderRadius: radius.md,
        border,
        background,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: space.sm,
          marginBottom: space.sm,
          fontFamily: font.ui,
          fontSize: 16,
          fontWeight: 600,
          color: color.ink,
        }}
      >
        <FruitIcon fruit={fruit} />
        {f.name}
      </div>
      {rows.map((row, i) => (
        <div
          key={row.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: `${space.xs}px 0`,
            borderTop: i > 0 ? `1px solid ${color.border}` : "none",
          }}
        >
          <span style={{ ...type.body, fontSize: 13, color: color.inkMuted }}>
            {row.label}
          </span>
          <span
            style={{
              fontFamily: font.data,
              fontSize: 13,
              fontWeight: 600,
              color: color.ink,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const choices = state.choices ?? [];
  const error = state.error ?? null;
  const picks = replay(choices);
  const total = picks.length;
  const fitScale = useFitScale(stageRef, contentRef, total > 0);
  const elapsed = useRunAnimation(total > 0 ? state : null, total * STEP_MS);

  if (total === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState
            message={error ?? "Run your code to start filling your basket."}
          />
        </PluginStage>
      </PluginSurface>
    );
  }

  // Pick k lands at k · STEP_MS; the latest one stays outlined until the next.
  const done = elapsed >= total * STEP_MS;
  const shown = done ? total : Math.min(total, Math.floor(elapsed / STEP_MS) + 1);
  const visible = picks.slice(0, shown);
  const latest = done ? null : visible[visible.length - 1];

  // The cards show the market *before* the latest pick, so its outline sits
  // on the numbers that pick was judged by.
  const before = latest ? visible.slice(0, -1) : visible;
  const count = (list: Pick[], f: Fruit) => list.filter((p) => p.fruit === f).length;

  const spent = visible.reduce((sum, p) => sum + FRUIT[p.fruit].price, 0);
  const utility = visible.reduce((sum, p) => sum + p.mu, 0);
  const bestCount = visible.filter((p) => p.best).length;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          ref={stageRef}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            ref={contentRef}
            role="img"
            aria-label={`Basket of ${visible.length} fruit: ${count(visible, "apple")} apples and ${count(visible, "banana")} bananas, $${spent} of $${BUDGET} spent, total utility ${utility}`}
            style={{
              width: 440,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: space.md,
              transform: `scale(${fitScale})`,
              transformOrigin: "center center",
            }}
          >
            <div style={{ display: "flex", gap: space.lg }}>
              {(["apple", "banana"] as const).map((f) => (
                <FruitCard
                  key={f}
                  fruit={f}
                  bought={count(before, f)}
                  highlight={latest?.fruit === f ? latest.best : null}
                />
              ))}
            </div>

            <div
              style={{
                width: "100%",
                boxSizing: "border-box",
                minHeight: 64,
                padding: space.md,
                display: "flex",
                flexWrap: "wrap",
                gap: space.sm,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: radius.md,
                border: `1px dashed ${color.border}`,
                background: color.surfaceRaised,
              }}
            >
              {visible.map((p, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    padding: space.xs,
                    borderRadius: radius.sm,
                    border: p.best
                      ? `2px solid ${color.positive}`
                      : `2px dashed ${color.negative}`,
                    background: p.best ? color.positiveSoft : color.negativeSoft,
                  }}
                >
                  <FruitIcon fruit={p.fruit} size={28} />
                </span>
              ))}
            </div>

            {error && (
              <div style={{ ...type.body, fontSize: 13, color: color.negative }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Spent", value: `$${spent} / $${BUDGET}` },
          { label: "Total Utility", value: String(utility), color: color.series[0] },
          {
            label: "Best Picks",
            value: visible.length ? `${bestCount} / ${visible.length}` : EMPTY,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
