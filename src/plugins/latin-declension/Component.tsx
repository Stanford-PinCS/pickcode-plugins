import { observer } from "mobx-react-lite";
import type { CSSProperties } from "react";
import { color, radius, space, type } from "../../common/tokens";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
} from "../../common/PluginSurface";
import State from "./state";
import instructions from "./instructions.md?raw";

const ROLE_COLOR: Record<string, string> = {
  subject: color.series[0],
  object: color.series[1],
  verb: color.series[2],
};

const ROLE_LABEL: Record<string, string> = {
  subject: "Subject (does it)",
  object: "Object (receives it)",
  verb: "Verb (the action)",
  other: "Other",
};

/** Presentation only: draw each word, with its ending in the role's color. */
const Component = observer(({ state }: { state: State }) => {
  const { words, endings, roles } = state;

  if (words.length === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to see your Latin sentence here." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const cardStyle: CSSProperties = {
    ...type.value,
    fontSize: 28,
    padding: `${space.md}px ${space.lg}px`,
    background: color.surfaceRaised,
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
  };

  const usedRoles = Array.from(new Set(roles));

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: space.lg,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: space.md,
            }}
          >
            {words.map((word, i) => {
              const ending = endings[i] ?? "";
              const stem = ending ? word.slice(0, word.length - ending.length) : word;
              const roleColor = ROLE_COLOR[roles[i]] ?? color.ink;
              // A word with no ending (like a verb) is colored as a whole.
              const stemColor = ending ? color.ink : roleColor;
              return (
                <div key={`${word}-${i}`} style={cardStyle}>
                  <span style={{ color: stemColor }}>{stem}</span>
                  <span
                    style={{
                      color: roleColor,
                      textDecoration: "underline",
                      textUnderlineOffset: 4,
                    }}
                  >
                    {ending}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: space.lg,
            }}
          >
            {usedRoles.map((role) => (
              <span
                key={role}
                style={{ ...type.label, color: ROLE_COLOR[role] ?? color.inkMuted }}
              >
                {ROLE_LABEL[role] ?? ROLE_LABEL.other}
              </span>
            ))}
          </div>
        </div>
      </PluginStage>
    </PluginSurface>
  );
});

export default Component;
