import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../lib/motion";

interface Dot {
  x: number;
  y: number;
  t: number;
}
interface Ring {
  x: number;
  y: number;
  t: number;
}
const LIFE = 900;
const RING_LIFE = 750;

/** Quill pointer with a fading ink trail (mouse), and a soft ink ripple on tap (touch). */
export const QuillCursor = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (fine) document.documentElement.classList.add("quill-cursor");
    if (prefersReducedMotion()) {
      return () => document.documentElement.classList.remove("quill-cursor");
    }
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let dots: Dot[] = [];
    let rings: Ring[] = [];
    let raf = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    const draw = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots = dots.filter((d) => now - d.t < LIFE);
      rings = rings.filter((r) => now - r.t < RING_LIFE);
      for (let i = 1; i < dots.length; i++) {
        const a = dots[i - 1];
        const b = dots[i];
        const age = (now - b.t) / LIFE;
        ctx.strokeStyle = `rgba(226, 177, 122, ${0.55 * (1 - age)})`;
        ctx.lineWidth = 2.4 * (1 - age) + 0.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const r of rings) {
        const k = (now - r.t) / RING_LIFE;
        ctx.strokeStyle = `rgba(226, 177, 122, ${0.5 * (1 - k)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 6 + 38 * k, 0, Math.PI * 2);
        ctx.stroke();
      }
      raf = dots.length || rings.length ? requestAnimationFrame(draw) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const last = dots[dots.length - 1];
      if (last && performance.now() - last.t > 120) dots = []; // break the line after a pause
      dots.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      kick();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      rings.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      kick();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("quill-cursor");
    };
  }, []);
  return <canvas ref={ref} className="quill-trail" aria-hidden="true" />;
};
