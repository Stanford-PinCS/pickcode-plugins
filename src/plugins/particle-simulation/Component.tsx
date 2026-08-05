import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { color } from "../../common/tokens";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import State, { type Particle } from "./state";
import instructions from "./instructions.md?raw";

const SIM_BG = "#0b1020";

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

      ctx.fillStyle = SIM_BG;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, width - 2, height - 2);

      const targetSpeed = Math.sqrt(avgTemperature) * 0.5;

      for (const particle of particleStatesRef.current) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        const currentSpeed = Math.hypot(particle.vx, particle.vy) || 1e-6;

        const smoothedSpeed =
          currentSpeed + (targetSpeed - currentSpeed) * 0.001;

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
        ctx.arc(particle.x, particle.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = particle.color || color.accent;
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

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 8,
            overflow: "hidden",
            background: SIM_BG,
            border: `1px solid ${color.border}`,
          }}
        >
          <canvas
            ref={canvasRef}
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
            color: color.accent,
          },
          { label: "Coldest", value: minTemp.toFixed(1) },
          { label: "Hottest", value: maxTemp.toFixed(1) },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
