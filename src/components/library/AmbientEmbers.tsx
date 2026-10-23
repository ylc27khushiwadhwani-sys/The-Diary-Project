import React, { useMemo } from 'react';

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: string;
  delay: string;
  opacity: number;
}

export const AmbientEmbers: React.FC = () => {
  // Generate a fixed set of glowing embers positioned across the screen
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${(i * 5.5 + Math.sin(i) * 12 + 10) % 94}%`,
      top: `${(i * 7 + Math.cos(i) * 20 + 20) % 90}%`,
      size: (i % 3) + 2,
      duration: `${7 + (i % 6)}s`,
      delay: `${(i % 5) * 1.4}s`,
      opacity: 0.25 + (i % 4) * 0.15,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <span
          key={p.id}
          className="ember-particle"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: p.duration,
            animationDelay: p.delay,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
};
