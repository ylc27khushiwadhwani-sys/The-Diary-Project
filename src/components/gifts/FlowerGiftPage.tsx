import React,{useEffect,useState} from 'react';
import {BouquetArt} from './BouquetArt';
import {FlowerDraft} from './FlowerStudio';
import {LETTER_FONTS} from '../../utils/letterStyle';
export interface GiftLookup {status:'ready'|'locked'|'missing';gift?:FlowerDraft}
export const FlowerGiftPage:React.FC<{token:string;read:(token:string,passcode:string)=>Promise<GiftLookup>;onExit:()=>void}> = ({token,read,onExit}) => {
 const [result,setResult]=useState<GiftLookup|null>(null);const [code,setCode]=useState('');const [opened,setOpened]=useState(false);const [error,setError]=useState('');const [busy,setBusy]=useState(true);
 const load=async(passcode:string)=>{setBusy(true);setError('');try{const value=await read(token,passcode);setResult(value);if(value.status==='locked'&&passcode)setError('That passcode did not open this gift.')}catch(e){setError(e instanceof Error?e.message:'Could not open this gift right now. Please try again.')}finally{setBusy(false)}};
 useEffect(()=>{load('')},[token]);
 return <main className="flower-recipient"><div className="flower-recipient-shell"><span className="label-caps">THE PAPER VAULT</span>
 {busy?<p role="status">Opening a little surprise...</p>:result?.status==='missing'?<section><h1>This gift is no longer here.</h1><p>Its link may have been deleted, or it may not be a valid gift link.</p></section>:result?.status==='locked'?<form onSubmit={e=>{e.preventDefault();load(code)}}><h1>A little something, kept for you.</h1><p>This gift needs a passcode from its author.</p><label>Gift passcode<input type="password" required autoComplete="off" value={code} onChange={e=>setCode(e.target.value)}/></label><button className="flower-create" type="submit">Open with passcode ↗</button></form>:result?.gift?<section>
 <h1>{opened?`For ${result.gift.to||'you'}`:'Someone thought of you.'}</h1><button type="button" className={`flower-opening ${opened?'is-open':''}`} onClick={()=>setOpened(true)} aria-label="Open your flowers and letter"><BouquetArt id={result.gift.bouquet}/>{!opened&&<span>Open your flowers & letter ↗</span>}</button>
 {opened&&<article className="flower-note-preview flower-reveal" style={{fontFamily:LETTER_FONTS[result.gift.font]?.family||LETTER_FONTS[0].family}}><p>To {result.gift.to||'you'}</p><div>{result.gift.message}</div><footer>From {result.gift.from||'anonymous'}</footer></article>}
 </section>:null}
 {error&&<p role="alert" className="flower-error">{error}</p>}{!busy&&!result&&<button type="button" onClick={()=>load(code)}>Try again</button>}
 <button className="flower-recipient-exit" type="button" onClick={onExit}>Enter The Paper Vault ↗</button></div></main>;
};
