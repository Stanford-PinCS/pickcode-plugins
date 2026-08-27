import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { color } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import { getSnapshotAtTime } from "./springLabCore";
import { SpringLabState } from "./state";

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 400;
const SIMULATION_DURATION = 10;

const CHART = {
  left: 54,
  top: 28,
  width: 388,
  height: 314,
};

const APPARATUS = {
  left: 472,
  right: 680,
  top: 34,
  bottom: 340,
};

type WaveRecord = {
  mass: number;
  period: number;
  amplitude: number;
  equilibriumExtension: number;
  stroke: string;
};

type WaveStore = typeof globalThis & {
  __shmWaveHistory?: WaveRecord[];
};

const waveStore = globalThis as WaveStore;
const waveHistory = (waveStore.__shmWaveHistory ??= []);
const waveColors = [color.series[0], color.series[1], color.reference];

type Props = {
  state: SpringLabState;
};

function formatMass(mass: number) {
  return mass < 1 ? `${(mass * 1000).toFixed(0)} g` : `${mass.toFixed(2)} kg`;
}

const Component = observer(({ state }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrame = useRef(0);
  const previousTimestamp = useRef<number | null>(null);
  const stateRef = useRef(state);
  const [displaySize, setDisplaySize] = useState({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  });

  stateRef.current = state;

  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const bounds = container.getBoundingClientRect();
      const scale = Math.min(
        bounds.width / CANVAS_WIDTH,
        bounds.height / CANVAS_HEIGHT
      );
      if (!Number.isFinite(scale) || scale <= 0) return;

      const next = {
        width: Math.max(1, Math.floor(CANVAS_WIDTH * scale)),
        height: Math.max(1, Math.floor(CANVAS_HEIGHT * scale)),
      };

      setDisplaySize((current) =>
        current.width === next.width && current.height === next.height
          ? current
          : next
      );
    };

    updateSize();
    const resizeObserver =
      "ResizeObserver" in window ? new ResizeObserver(updateSize) : null;
    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener("resize", updateSize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [state.model]);

  useEffect(() => {
    if (state.phase !== "playing" || !state.model || !state.derived) return;

    const mass = state.model.inputs.activeMass;
    if (waveHistory.some((wave) => Math.abs(wave.mass - mass) < 1e-9)) {
      return;
    }

    const snapshot = getSnapshotAtTime(state.model.inputs, state.derived, 0);
    waveHistory.push({
      mass,
      period: snapshot.hudPeriod,
      amplitude: state.derived.amplitude,
      equilibriumExtension: snapshot.equilibriumY - snapshot.naturalEndY,
      stroke: waveColors[waveHistory.length % waveColors.length],
    });
  }, [state.phase, state.model, state.derived]);

  useEffect(() => {
    const tick = (timestamp: number) => {
      const currentState = stateRef.current;
      const previous = previousTimestamp.current;
      previousTimestamp.current = timestamp;

      if (previous !== null) {
        currentState.advanceTime(Math.min((timestamp - previous) / 1000, 0.05));
      }

      if (
        currentState.phase === "playing" &&
        currentState.simTime >= SIMULATION_DURATION
      ) {
        currentState.finish();
      }

      drawScene();
      animationFrame.current = requestAnimationFrame(tick);
    };

    animationFrame.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationFrame.current);
      previousTimestamp.current = null;
    };
  }, []);

  function drawScene() {
    const canvas = canvasRef.current;
    const currentState = stateRef.current;
    if (!canvas || !currentState.model || !currentState.derived) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const snapshot = getSnapshotAtTime(
      currentState.model.inputs,
      currentState.derived,
      currentState.simTime
    );

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.fillStyle = color.surfaceRaised;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawChart(context, currentState);
    drawApparatus(context, snapshot);
  }

  function drawChart(
    context: CanvasRenderingContext2D,
    currentState: SpringLabState
  ) {
    const { left, top, width, height } = CHART;
    const bottom = top + height;
    const right = left + width;
    const activeSnapshot =
      currentState.model && currentState.derived
        ? getSnapshotAtTime(
            currentState.model.inputs,
            currentState.derived,
            currentState.simTime
          )
        : null;

    const maximumExtension = Math.max(
      0.1,
      ...waveHistory.map((wave) => wave.equilibriumExtension + wave.amplitude),
      activeSnapshot
        ? activeSnapshot.equilibriumY -
            activeSnapshot.naturalEndY +
            currentState.derived!.amplitude
        : 0
    );
    const yMaximum = maximumExtension * 1.12;
    const toX = (time: number) => left + (time / SIMULATION_DURATION) * width;
    const toY = (extension: number) => bottom - (extension / yMaximum) * height;

    context.save();
    context.strokeStyle = color.grid;
    context.lineWidth = 1;
    context.globalAlpha = 0.8;
    for (let index = 0; index <= 5; index += 1) {
      const x = left + (index / 5) * width;
      const y = top + (index / 5) * height;
      context.beginPath();
      context.moveTo(x, top);
      context.lineTo(x, bottom);
      context.stroke();
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(right, y);
      context.stroke();
    }
    context.restore();

    context.strokeStyle = color.axis;
    context.lineWidth = 1;
    context.strokeRect(left, top, width, height);

    context.fillStyle = color.axis;
    context.font = "11px ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "center";
    for (let index = 0; index <= 5; index += 1) {
      const seconds = (index / 5) * SIMULATION_DURATION;
      context.fillText(`${seconds.toFixed(0)}s`, toX(seconds), bottom + 17);
    }

    context.textAlign = "right";
    for (let index = 0; index <= 4; index += 1) {
      const extension = (index / 4) * yMaximum;
      context.fillText(extension.toFixed(2), left - 7, toY(extension) + 4);
    }

    context.textAlign = "center";
    context.font = "600 12px ui-sans-serif, system-ui, sans-serif";
    context.fillText("Time", left + width / 2, CANVAS_HEIGHT - 12);
    context.save();
    context.translate(14, top + height / 2);
    context.rotate(-Math.PI / 2);
    context.fillText("Spring extension (m)", 0, 0);
    context.restore();

    context.save();
    context.beginPath();
    context.rect(left, top, width, height);
    context.clip();

    waveHistory.forEach((wave, index) => {
      const isActive =
        index === waveHistory.length - 1 && currentState.phase === "playing";
      const timeLimit = isActive
        ? Math.min(currentState.simTime, SIMULATION_DURATION)
        : SIMULATION_DURATION;
      const pixelLimit = Math.floor((timeLimit / SIMULATION_DURATION) * width);
      const angularFrequency = (2 * Math.PI) / wave.period;

      context.beginPath();
      for (let pixel = 0; pixel <= pixelLimit; pixel += 1) {
        const time = (pixel / width) * SIMULATION_DURATION;
        const extension =
          wave.equilibriumExtension +
          wave.amplitude * Math.cos(angularFrequency * time);
        const x = left + pixel;
        const y = toY(extension);
        if (pixel === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }

      context.strokeStyle = wave.stroke;
      context.lineWidth = isActive ? 2.5 : 1.75;
      context.globalAlpha = isActive ? 1 : 0.65;
      context.stroke();
    });
    context.restore();

    context.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "left";
    waveHistory.forEach((wave, index) => {
      context.fillStyle = wave.stroke;
      context.fillRect(left + 10, top + 10 + index * 17, 8, 8);
      context.fillText(formatMass(wave.mass), left + 24, top + 18 + index * 17);
    });
  }

  function drawApparatus(
    context: CanvasRenderingContext2D,
    snapshot: ReturnType<typeof getSnapshotAtTime>
  ) {
    const centerX = (APPARATUS.left + APPARATUS.right) / 2;
    const worldBottom = Math.max(
      snapshot.equilibriumY + Math.abs(snapshot.oscDisplacement) + 0.08,
      0.62
    );
    const scale =
      (APPARATUS.bottom - APPARATUS.top) / (worldBottom - snapshot.springTopY);
    const toY = (position: number) =>
      APPARATUS.top + (position - snapshot.springTopY) * scale;
    const supportY = toY(snapshot.springTopY);
    const massY = Math.min(toY(snapshot.massY), APPARATUS.bottom - 20);
    const equilibriumY = Math.min(toY(snapshot.equilibriumY), APPARATUS.bottom);
    const naturalEndY = toY(snapshot.naturalEndY);

    context.strokeStyle = color.reference;
    context.globalAlpha = 0.7;
    context.setLineDash([6, 5]);
    context.beginPath();
    context.moveTo(APPARATUS.left + 10, equilibriumY);
    context.lineTo(APPARATUS.right - 10, equilibriumY);
    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 1;

    context.fillStyle = color.axis;
    context.fillRect(centerX - 70, supportY, 140, 7);
    for (let x = centerX - 64; x <= centerX + 64; x += 12) {
      context.beginPath();
      context.moveTo(x, supportY);
      context.lineTo(x - 5, supportY - 7);
      context.strokeStyle = color.axis;
      context.stroke();
    }

    drawSpring(context, centerX, supportY + 7, massY - 20);

    context.fillStyle = color.series[0];
    context.fillRect(centerX - 25, massY - 20, 50, 40);
    context.strokeStyle = color.axis;
    context.strokeRect(centerX - 25, massY - 20, 50, 40);

    context.fillStyle = color.axis;
    context.font = "11px ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("equilibrium", centerX, equilibriumY - 6);
    context.fillText("natural length", centerX, naturalEndY - 6);
  }

  function drawSpring(
    context: CanvasRenderingContext2D,
    x: number,
    top: number,
    bottom: number
  ) {
    const segments = 18;
    const segmentHeight = (bottom - top) / segments;
    context.beginPath();
    context.moveTo(x, top);
    for (let index = 1; index <= segments; index += 1) {
      const y = top + index * segmentHeight;
      const offset = index % 2 === 0 ? 13 : -13;
      context.lineTo(x + offset, y - segmentHeight / 2);
      context.lineTo(x, y);
    }
    context.strokeStyle = color.series[1];
    context.lineWidth = 2.25;
    context.stroke();
  }

  if (!state.model || !state.derived) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to configure a spring and compare static and dynamic measurements." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const snapshot = getSnapshotAtTime(
    state.model.inputs,
    state.derived,
    state.simTime
  );
  const method = state.model.inputs.method;
  const extension = snapshot.equilibriumY - snapshot.naturalEndY;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              display: "block",
              width: displaySize.width,
              height: displaySize.height,
              maxWidth: "100%",
              maxHeight: "100%",
              border: `1px solid ${color.border}`,
              borderRadius: 4,
            }}
            role="img"
            aria-label={`Spring-mass system using the ${method} method with ${formatMass(
              state.model.inputs.activeMass
            )}`}
          />
        </div>
      </PluginStage>

      <StatRow
        stats={[
          {
            label: "Method",
            value: method === "static" ? "Static" : "Dynamic",
          },
          {
            label: "Mass",
            value: formatMass(state.model.inputs.activeMass),
            color: color.series[0],
          },
          {
            label: method === "static" ? "Extension" : "Period",
            value:
              method === "static"
                ? `${extension.toFixed(4)} m`
                : `${snapshot.hudPeriod.toFixed(3)} s`,
            color: color.reference,
          },
          { label: "Measurements", value: String(state.derived.rowCount) },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
