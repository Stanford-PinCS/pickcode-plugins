import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { color, radius } from "../../common/tokens";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import State, { type Particle } from "./state";
import instructions from "./instructions.md?raw";

const PARTICLE_RADIUS = 6;
// Each frame, every particle's speed moves this fraction of the way toward
// the speed that matches the average temperature, so a mix slowly evens out.
const MIXING_RATE = 0.001;
// With prefers-reduced-motion the box is drawn once, and each particle gets
// a short line showing which way and how fast it is moving.
const STILL_TRAIL_FRAMES = 4;

// Hot group pink (series[0]), cold group teal (series[1]). Older lessons
// pass their own color, which still wins.
const particleColor = (particle: Particle) =>
  particle.color ||
  (particle.group !== undefined
    ? color.series[particle.group % color.series.length]
    : color.accent);

type ParticleState = Particle & {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const Component = observer(({ state }: { state: State }) => {
  const particles = state.particles;
  const particleCount = particles.length;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleStatesRef = useRef<ParticleState[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    const still =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const initParticles = (width: number, height: number) => {
      particleStatesRef.current = particles.map((particle) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.sqrt(particle.temperature) * 0.5;

        return {
          ...particle,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        };
      });
    };

    const avgTemperature =
      particles.reduce((sum, particle) => sum + particle.temperature, 0) /
      particles.length;

    const draw = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      const needsInit =
        canvas.width !== width ||
        canvas.height !== height ||
        particleStatesRef.current.length !== particles.length;

      if (needsInit) {
        canvas.width = width;
        canvas.height = height;
        initParticles(width, height);
      }

      ctx.clearRect(0, 0, width, height);

      const targetSpeed = Math.sqrt(avgTemperature) * 0.5;

      if (still) {
        ctx.lineWidth = 2;
        for (const particle of particleStatesRef.current) {
          const fill = particleColor(particle);
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(
            particle.x - particle.vx * STILL_TRAIL_FRAMES,
            particle.y - particle.vy * STILL_TRAIL_FRAMES
          );
          ctx.strokeStyle = fill;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, PARTICLE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = fill;
          ctx.fill();
        }
        return;
      }

      for (const particle of particleStatesRef.current) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        const currentSpeed = Math.hypot(particle.vx, particle.vy) || 1e-6;

        const smoothedSpeed =
          currentSpeed + (targetSpeed - currentSpeed) * MIXING_RATE;

        const angle = Math.atan2(particle.vy, particle.vx);

        particle.vx = Math.cos(angle) * smoothedSpeed;
        particle.vy = Math.sin(angle) * smoothedSpeed;

        if (particle.x <= 4 || particle.x >= width - 4) {
          particle.vx *= -1;
        }

        if (particle.y <= 4 || particle.y >= height - 4) {
          particle.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, PARTICLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = particleColor(particle);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, [particles]);

  if (particleCount === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to fill the box with particles and watch them move." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const temperatures = particles.map((particle) => particle.temperature);

  const avgTemp =
    temperatures.reduce((sum, temperature) => sum + temperature, 0) /
    particleCount;

  const minTemp = Math.min(...temperatures);
  const maxTemp = Math.max(...temperatures);
  // Teal and pink only mean something once the box holds two temperatures.
  const mixed = maxTemp > minTemp;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: radius.md,
            overflow: "hidden",
            background: color.surfaceRaised,
            border: `1px solid ${color.border}`,
          }}
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`${particleCount} particles bouncing in a box, temperatures from ${minTemp.toFixed(1)} to ${maxTemp.toFixed(1)}, average ${avgTemp.toFixed(1)}`}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Particles", value: String(particleCount) },
          {
            label: "Avg Temp",
            value: avgTemp.toFixed(1),
            color: color.reference,
          },
          {
            label: "Coldest",
            value: minTemp.toFixed(1),
            color: mixed ? color.series[1] : color.ink,
          },
          {
            label: "Hottest",
            value: maxTemp.toFixed(1),
            color: mixed ? color.series[0] : color.ink,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
