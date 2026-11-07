import React, {useState} from 'react';
import {X,Copy,Trash2,Share2} from 'lucide-react';
import {BOUQUETS,BouquetArt,BouquetId} from './BouquetArt';
import {LETTER_FONTS} from '../../utils/letterStyle';

export interface FlowerDraft {bouquet:BouquetId;to:string;from:string;message:string;font:number}
export interface FlowerLink {id:string;token:string;to:string;bouquet:string;created_at:string}
export interface FlowerStudioProps {
 onClose:()=>void; create:(draft:FlowerDraft,passcode:string)=>Promise<FlowerLink>;
 history:FlowerLink[]; historyError?:string; isGuest?:boolean; revoke:(id:string)=>Promise<void>;
}
export const FlowerStudio:React.FC<FlowerStudioProps> = ({onClose,create,history,revoke,historyError,isGuest}) => {
 const [draft,setDraft]=useState<FlowerDraft>({bouquet:'rose',to:'',from:'',message:'',font:0});
 const [passcode,setPasscode]=useState(''); const [peek,setPeek]=useState(false);
 const [created,setCreated]=useState<FlowerLink|null>(null); const [busy,setBusy]=useState(false);
 const [error,setError]=useState(''); const [copied,setCopied]=useState(false);
 const update=(patch:Partial<FlowerDraft>)=>{setDraft(d=>({...d,...patch}));setCreated(null)};
 const link=(token:string)=>`${window.location.origin}/#flower=${encodeURIComponent(token)}`;
 const copy=async(token:string)=>{try{await navigator.clipboard.writeText(link(token));setCopied(true)}catch{setError('Copy did not work. Select and copy the link below.')}};
 const make=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{setCreated(await create(draft,passcode));setCopied(false)}catch(e){setError(e instanceof Error?e.message:'Could not create your link. Your words are still here.')}finally{setBusy(false)}};
 const remove=async(id:string)=>{setBusy(true);setError('');try{await revoke(id);if(created?.id===id)setCreated(null)}catch{setError('Could not delete this gift. Please try again.')}finally{setBusy(false)}};
 return <div className="flower-studio-overlay" role="dialog" aria-modal="true" aria-label="Flowers and letters studio">
 <div className="flower-studio-shell"><header className="flower-studio-header"><div><span className="label-caps">THE PAPER VAULT</span><h1>Flowers & letters</h1></div><button type="button" onClick={onClose} aria-label="Close flower studio"><X size={22}/></button></header>
 <section className="flower-studio-intro"><span className="label-caps">A SMALL GESTURE, IN YOUR OWN WORDS</span><h2>Some things bloom on paper.</h2><p>Choose their flowers. Leave a little of yourself in the words.</p></section>
 <div className="flower-studio-grid"><form onSubmit={make} className="flower-studio-form">
 <fieldset><legend>Choose your bouquet</legend><div className="bouquet-options">{BOUQUETS.map(b=><button type="button" key={b.id} aria-label={`${b.name} bouquet`} aria-pressed={draft.bouquet===b.id} onClick={()=>update({bouquet:b.id})}><BouquetArt id={b.id}/><span>{b.name}</span></button>)}</div></fieldset>
 <div className="flower-names"><label>From<input value={draft.from} maxLength={80} placeholder="A name they know" onChange={e=>update({from:e.target.value})}/></label><label>To<input value={draft.to} maxLength={80} placeholder="Someone on your mind" onChange={e=>update({to:e.target.value})}/></label></div>
 <label>Your message<textarea required value={draft.message} maxLength={10000} rows={5} placeholder="One honest detail can make their day." onChange={e=>update({message:e.target.value})} style={{fontFamily:LETTER_FONTS[draft.font].family}}/></label><p className="flower-count">{draft.message.length.toLocaleString()} / 10,000</p>
 <label>Handwriting<select aria-label="Gift handwriting" value={draft.font} onChange={e=>update({font:Number(e.target.value)})}>{LETTER_FONTS.map((f,i)=><option value={i} key={f.name}>{f.name}</option>)}</select></label>
 <label>Optional passcode<input type="password" value={passcode} minLength={4} maxLength={64} autoComplete="new-password" placeholder="Leave empty for anyone with the link" onChange={e=>{setPasscode(e.target.value);setCreated(null)}}/></label>
 {isGuest&&<p className="flower-privacy">Guest gifts belong to this browser session. Keep access to this session to manage or delete them. For access across devices, use a permanent library card.</p>}
 <p className="flower-privacy">Not on the public shelves. Anyone with this link can open it{passcode?' using your passcode':''}. It stays available until you delete it. A link can be forwarded. A passcode is an access gate, not encryption. Ten failed attempts temporarily lock the gift for up to an hour, including for the intended reader.</p>
 {error&&<p role="alert" className="flower-error">{error}</p>}
 <button className="flower-create" disabled={busy||!draft.message.trim()} type="submit">{busy?'Keeping your words...':'Create a gift link'} <span>↗</span></button>
 {created&&<div className="flower-link-result"><p>Your gift is ready. Choose where to share it.</p><input aria-label="Created gift link" readOnly value={link(created.token)}/><div><button type="button" onClick={()=>copy(created.token)}><Copy size={15}/>{copied?'Copied':'Copy link'}</button>{typeof navigator.share==='function'&&<button type="button" onClick={()=>navigator.share({url:link(created.token)}).catch(()=>{})}><Share2 size={15}/>Share</button>}<a href={link(created.token)} target="_blank" rel="noreferrer">Open your gift ↗</a></div></div>}
 </form><section className="flower-live-preview" aria-label="Live gift preview"><span className="label-caps">THEIR LITTLE SURPRISE</span><button className={`flower-opening ${peek?'is-open':''}`} type="button" onClick={()=>setPeek(!peek)} aria-label={peek?'Close opening preview':'Preview gift opening'}><BouquetArt id={draft.bouquet}/><span>{peek?'Close preview':'Try the opening ↗'}</span></button><article className="flower-note-preview" style={{fontFamily:LETTER_FONTS[draft.font].family}}><p>To {draft.to||'...'}</p><div>{draft.message||'Your words belong here.'}</div><footer>From {draft.from||'anonymous'}</footer></article><p className="flower-preview-caption">A bouquet, a letter, and a moment just for them.</p></section></div>
 {historyError&&<p role="alert" className="flower-error">{historyError}</p>}
 {history.length>0&&<section className="flower-history"><h2>Your shared gifts</h2><p>Delete a gift to stop its link from opening. Copies already saved by a recipient cannot be recalled.</p>{history.map(g=><div key={g.id}><BouquetArt id={g.bouquet}/><span>For {g.to||'someone special'}</span><button type="button" onClick={()=>copy(g.token)} aria-label="Copy gift link"><Copy size={17}/></button><button type="button" disabled={busy} onClick={()=>{if(window.confirm('Delete this gift? Its link will stop opening for everyone.'))remove(g.id)}} aria-label="Delete gift"><Trash2 size={17}/></button></div>)}</section>}
 </div></div>;
};
