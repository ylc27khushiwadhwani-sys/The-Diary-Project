import React, { useEffect, useRef } from 'react';
import { EMBER_EVENT, prefersReducedMotion } from '../../lib/motion';

interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  depth: number;
  phase: number;
  life: number; // <0 => ambient, >=0 => ember age 0..1
  hue: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Full-screen canvas of drifting dust motes and, on demand, a burst of rising
 * embers. Motes glow brighter inside the slanting light shafts. Capped at
 * 60fps, pauses when the tab is hidden, scales down on small screens and is
 * not rendered at all under prefers-reduced-motion.
 */
export const DustCanvas: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let motes: Mote[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const spawn = (ember = false, x?: number): Mote => ({
      x: x ?? rand(0, w),
      y: ember ? h + 10 : rand(0, h),
      r: ember ? rand(1.2, 2.8) : rand(0.5, 1.9),
      vx: ember ? rand(-14, 14) : rand(-4, 6),
      vy: ember ? -rand(40, 110) : -rand(2, 11),
      depth: rand(0.4, 1),
      phase: rand(0, Math.PI * 2),
      life: ember ? 0 : -1,
      hue: ember ? rand(18, 42) : rand(38, 46),
    });

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = w < 640 ? 38 : 85;
      const ambient = motes.filter((m) => m.life < 0);
      const embers = motes.filter((m) => m.life >= 0);
      while (ambient.length < target) ambient.push(spawn());
      ambient.length = Math.min(ambient.length, target);
      motes = [...ambient, ...embers];
    };

    // Light shafts: same angle as the CSS beams so dust glows inside them.
    const inBeam = (x: number, y: number, t: number) => {
      const drift = Math.sin(t / 14000) * 0.06;
      const k = Math.tan(0.42 + drift);
      const bands = [0.2, 0.5, 0.78];
      let best = 0;
      for (const b of bands) {
        const cx = b * w + (y - h * 0.2) * k * -1;
        const d = Math.abs(x - cx) / (w * 0.075);
        best = Math.max(best, Math.max(0, 1 - d));
      }
      return best;
    };

    const onBurst = () => {
      const n = w < 640 ? 22 : 48;
      for (let i = 0; i < n; i++) motes.push(spawn(true, rand(w * 0.1, w * 0.9)));
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (t - last < 16) return;
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.phase += dt * (0.6 + m.depth);
        m.x += (m.vx + Math.sin(m.phase) * 6 * m.depth) * dt * m.depth;
        m.y += m.vy * dt * m.depth;
        let alpha: number;
        if (m.life >= 0) {
          m.life += dt / 5.5;
          if (m.life >= 1 || m.y < -10) {
            motes.splice(i, 1);
            continue;
          }
          alpha = Math.sin(Math.PI * Math.min(m.life, 1)) * 0.9;
          m.vx += Math.sin(m.phase * 2) * 0.4;
        } else {
          if (m.y < -10 || m.x < -10 || m.x > w + 10) {
            Object.assign(m, spawn(false, rand(0, w)), { y: h + 10 });
          }
          const beam = inBeam(m.x, m.y, t);
          alpha = (0.14 + beam * 0.7) * (0.55 + 0.45 * Math.sin(m.phase * 1.7));
        }
        const rad = m.r * (m.life >= 0 ? 5 : 4.5);
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, rad);
        g.addColorStop(0, `hsla(${m.hue}, 90%, 72%, ${Math.max(alpha, 0)})`);
        g.addColorStop(0.4, `hsla(${m.hue}, 85%, 55%, ${Math.max(alpha * 0.35, 0)})`);
        g.addColorStop(1, `hsla(${m.hue}, 80%, 40%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener(EMBER_EVENT, onBurst);
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener(EMBER_EVENT, onBurst);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-testid="dust-canvas"
      className="fixed inset-0 z-[5] pointer-events-none"
    />
  );
};
