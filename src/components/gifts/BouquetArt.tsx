import React from 'react';
export const BOUQUETS = [
  {id:'rose',name:'Rose'}, {id:'sunshine',name:'Sunshine'}, {id:'meadow',name:'Meadow'}, {id:'tulip',name:'Tulip'},
  {id:'peony',name:'Peony'}, {id:'hydrangea',name:'Hydrangea'}, {id:'lily',name:'Lily'}, {id:'lotus',name:'Lotus'},
] as const;
export type BouquetId = typeof BOUQUETS[number]['id'];
export const BouquetArt: React.FC<{id:string;className?:string}> = ({id,className=''}) => {
 const index=Math.max(0,BOUQUETS.findIndex(b=>b.id===id));
 return <img className={`bouquet-art ${className}`} src={`/art/bouquet-${BOUQUETS[index].id}.webp`} alt={`${BOUQUETS[index].name} watercolor bouquet`} />;
};
