import React from "react";
import {createPortal} from "react-dom";

/**
 * Watercolor garden blooms along the base of a room, in the spirit of the
 * gardenletters.online reference: soft painted petals with light centres and
 * deeper edges, thin curved stems, long blade leaves, dense clusters that
 * sway gently. Golden at night (dark mode), coloured irises and buttercups
 * by day (light mode) - the CSS keys off html.light. Original painted botanical assets are used; no reference artwork is copied.
 */

type BloomType = "iris" | "round" | "cup";

interface FlowerSpec {
  type: BloomType;
  variant: string;
  height: number;
  delay: number;
  duration: number;
}

const Flower: React.FC<FlowerSpec> = ({ variant, height, delay, duration }) => {
  const variantIndex = Math.max(0, Number(variant.replace("gf-v", "")) - 1) % 4;
  return <span className={`gf-flower botanical-flower ${variant}`} style={{ height, width: height * 0.32, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} aria-hidden="true">
    <img className="botanical-day" src={`/art/botanical-iris-v2-${variantIndex}.webp`} alt="" draggable={false} />
    <img className="botanical-night" src={`/art/botanical-iris-v2-${variantIndex}-gold.webp`} alt="" draggable={false} />
  </span>;
};

const Cluster: React.FC<{ flowers: FlowerSpec[] }> = ({ flowers }) => (
  <div className="gf-cluster">
    {flowers.map((f, i) => (
      <Flower key={i} {...f} />
    ))}
  </div>
);

/**
 * A small bouquet that rises behind one thing (an envelope letter, say) -
 * the same hand-drawn watercolor blooms as the garden row, just clustered
 * tight. Variants cycle so a row of sprays never looks stamped out.
 */
export const FlowerSpray: React.FC<{ seed?: number; scale?: number }> = ({
  seed = 0,
  scale = 1,
}) => {
  const sets: FlowerSpec[][] = [
    [
      { type: "iris", variant: "gf-v2", height: 128, delay: -0.6, duration: 5.2 },
      { type: "round", variant: "gf-v4", height: 96, delay: -1.8, duration: 4.7 },
      { type: "iris", variant: "gf-v3", height: 112, delay: -2.7, duration: 5.8 },
    ],
    [
      { type: "cup", variant: "gf-v3", height: 118, delay: -1.2, duration: 5.5 },
      { type: "iris", variant: "gf-v5", height: 138, delay: -0.2, duration: 5.0 },
      { type: "round", variant: "gf-v1", height: 92, delay: -3.1, duration: 6.0 },
    ],
    [
      { type: "iris", variant: "gf-v4", height: 132, delay: -2.2, duration: 4.9 },
      { type: "cup", variant: "gf-v2", height: 104, delay: -0.9, duration: 5.7 },
      { type: "iris", variant: "gf-v2", height: 90, delay: -1.5, duration: 5.3 },
    ],
    [
      { type: "round", variant: "gf-v1", height: 100, delay: -0.4, duration: 5.1 },
      { type: "iris", variant: "gf-v3", height: 126, delay: -2.5, duration: 5.6 },
      { type: "cup", variant: "gf-v4", height: 116, delay: -1.1, duration: 4.8 },
    ],
  ];
  const flowers = sets[Math.abs(seed) % sets.length];
  return (
    <div
      className="flower-spray"
      style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}
      aria-hidden="true"
    >
      <Cluster flowers={flowers} />
    </div>
  );
};

export const GardenFlowers: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`garden-flowers ${className}`} aria-hidden="true">
    <Cluster
      flowers={[
        { type: "iris", variant: "gf-v1", height: 158, delay: 0, duration: 5.4 },
        { type: "round", variant: "gf-v2", height: 112, delay: -1.4, duration: 4.8 },
        { type: "cup", variant: "gf-v3", height: 134, delay: -2.6, duration: 5.9 },
        { type: "round", variant: "gf-v4", height: 92, delay: -0.8, duration: 5.1 },
      ]}
    />
    <Cluster
      flowers={[
        { type: "cup", variant: "gf-v2", height: 122, delay: -2.1, duration: 5.6 },
        { type: "iris", variant: "gf-v5", height: 148, delay: -0.5, duration: 5.0 },
        { type: "round", variant: "gf-v1", height: 104, delay: -3.2, duration: 6.1 },
      ]}
    />
    <Cluster
      flowers={[
        { type: "iris", variant: "gf-v1", height: 120, delay: -2.4, duration: 5.3 },
        { type: "cup", variant: "gf-v5", height: 104, delay: -0.7, duration: 4.6 },
      ]}
    />
    <Cluster
      flowers={[
        { type: "cup", variant: "gf-v3", height: 152, delay: -1.1, duration: 5.2 },
        { type: "iris", variant: "gf-v4", height: 118, delay: -2.9, duration: 4.9 },
        { type: "round", variant: "gf-v5", height: 138, delay: -0.3, duration: 5.8 },
        { type: "iris", variant: "gf-v2", height: 96, delay: -1.9, duration: 5.5 },
      ]}
    />
  </div>
);

/** Fixed, decorative landing garden. Kept out of room views. */
const GARDEN_TYPES = ['rose','daisy','iris','tulip','cosmos','delphinium','poppy','peony'];
export const LandingFlowerBorder: React.FC = () => createPortal(
  <div className="landing-flower-border" aria-hidden="true">
    <div className="landing-garden-stems">{Array.from({length:17}, (_,i)=><span key={i} className="landing-garden-stem" style={{height:[139,121,156,133,128,150,134,146][i%8],animationDelay:`${-i*.65}s`,animationDuration:`${5+i%4}s`}}><img src={`/art/garden-${GARDEN_TYPES[i%8]}.webp`} alt="" draggable={false}/></span>)}</div>
    {[0,1,2].map(i=><span key={i} className={`landing-butterfly landing-butterfly-${i}`}><svg viewBox="0 0 40 32"><path className="butterfly-left" d="M20 16C7-4-3 2 4 16c-7 10 7 18 16 3Z"/><path className="butterfly-right" d="M20 16C33-4 43 2 36 16c7 10-7 18-16 3Z"/><path d="M20 11v14m0-13-4-6m4 6 4-6" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg></span>)}
  </div>, document.body
);
