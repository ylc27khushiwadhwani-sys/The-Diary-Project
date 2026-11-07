import React,{useEffect,useState} from 'react';
import {BouquetArt} from './BouquetArt';
import {FlowerDraft} from './FlowerStudio';
import {LETTER_FONTS} from '../../utils/letterStyle';
import {LandingStars} from '../landing/LandingStars';

export interface GiftLookup {status:'ready'|'locked'|'missing';gift?:FlowerDraft}

// Petals that drift off the bouquet the moment it opens. Deterministic so
// every opening of the same gift looks the same.
const PETALS = Array.from({length:10},(_,i)=>({
  dx: -70 + (i * 37) % 140,
  dy: -46 - (i * 23) % 60,
  rotate: -120 + (i * 57) % 240,
  delay: 0.12 + (i % 5) * 0.09,
  size: 7 + (i % 3) * 3,
}));

export const FlowerGiftPage:React.FC<{token:string;read:(token:string,passcode:string)=>Promise<GiftLookup>;onExit:()=>void}> = ({token,read,onExit}) => {
 const [result,setResult]=useState<GiftLookup|null>(null);const [code,setCode]=useState('');const [opened,setOpened]=useState(false);const [error,setError]=useState('');const [busy,setBusy]=useState(true);
 const load=async(passcode:string)=>{setBusy(true);setError('');try{const value=await read(token,passcode);setResult(value);if(value.status==='locked'&&passcode)setError('That passcode did not open this gift.')}catch(e){setError(e instanceof Error?e.message:'Could not open this gift right now. Please try again.')}finally{setBusy(false)}};
 useEffect(()=>{let active=true;read(token,'').then(value=>{if(active)setResult(value)}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Could not open this gift right now. Please try again.')}).finally(()=>{if(active)setBusy(false)});return()=>{active=false}},[token,read]);
 return <main className="flower-recipient">
 <LandingStars/>
 <div className="fg-glow" aria-hidden="true"/>
 <div className="flower-recipient-shell"><span className="label-caps">THE PAPER VAULT</span>
 {busy?<p role="status" className="fg-status">Opening a little surprise...</p>:result?.status==='missing'?<section className="fg-card"><h1>This gift is no longer here.</h1><p>Its link may have been deleted, or it may not be a valid gift link.</p></section>:result?.status==='locked'?<form className="fg-card" onSubmit={e=>{e.preventDefault();load(code)}}><h1>A little something, kept for you.</h1><p>This gift needs a passcode from its author.</p><label>Gift passcode<input type="password" required autoComplete="off" value={code} onChange={e=>setCode(e.target.value)}/></label><button className="flower-create" type="submit">Open with passcode ↗</button></form>:result?.gift?<section>
 <h1 className="fg-title">{opened?`For ${result.gift.to||'you'}`:'Someone thought of you.'}</h1>
 <p className="fg-sub">{opened?'':'Flowers and a letter, made only for you.'}</p>
 <div className="fg-stage">
  <button type="button" className={`flower-opening fg-parcel ${opened?'is-open':''}`} onClick={()=>setOpened(true)} aria-label="Open your flowers and letter">
   <BouquetArt id={result.gift.bouquet}/>
   {!opened&&<span className="fg-seal" aria-hidden="true"><span className="fg-seal-mark">✦</span></span>}
   {!opened&&<span className="fg-open-hint">Open your flowers & letter ↗</span>}
   {opened&&<span className="fg-petals" aria-hidden="true">{PETALS.map((p,i)=><i key={i} style={{['--dx' as string]:`${p.dx}px`,['--dy' as string]:`${p.dy}px`,['--rot' as string]:`${p.rotate}deg`,['--del' as string]:`${p.delay}s`,width:p.size,height:p.size*1.35}}/>)}</span>}
  </button>
 </div>
 {opened&&<article className="flower-note-preview flower-reveal fg-letter" style={{fontFamily:LETTER_FONTS[result.gift.font]?.family||LETTER_FONTS[0].family}}>
  <span className="fg-letter-seal" aria-hidden="true">✦</span>
  <p>To {result.gift.to||'you'}</p><div>{result.gift.message}</div><footer>From {result.gift.from||'anonymous'}</footer></article>}
 </section>:null}
 {error&&<p role="alert" className="flower-error">{error}</p>}{!busy&&!result&&<button type="button" onClick={()=>load(code)}>Try again</button>}
 <button className="flower-recipient-exit" type="button" onClick={onExit}>Enter The Paper Vault ↗</button></div></main>;
};
