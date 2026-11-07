import {supabase} from './supabase';
import type {FlowerDraft,FlowerLink} from '../components/gifts/FlowerStudio';
import type {GiftLookup} from '../components/gifts/FlowerGiftPage';
const friendly=(message:string)=>message.includes('content_blocked')?'This message could not be shared under our safety rules. Please revise it.':message.includes('not_authenticated')?'Sign in or enter as a guest before creating a gift.':message.includes('invalid_passcode')?'Use a passcode between 4 and 64 characters.':'Could not save your gift. Please try again. Your words are still here.';
export async function createFlowerGift(draft:FlowerDraft,passcode:string):Promise<FlowerLink> {
 const {data,error}=await supabase.rpc('create_flower_gift',{p_bouquet:draft.bouquet,p_to_name:draft.to,p_from_name:draft.from,p_message:draft.message,p_font:draft.font,p_passcode:passcode||null});
 if(error)throw new Error(friendly(error.message));
 return {...data,to:draft.to,bouquet:draft.bouquet};
}
export async function listFlowerGifts():Promise<FlowerLink[]> {
 const {data,error}=await supabase.rpc('list_my_flower_gifts');
 if(error)throw new Error('Could not load your shared gifts.');
 return (data||[]).map((g:FlowerLink&{to_name:string})=>({...g,to:g.to_name}));
}
export async function deleteFlowerGift(id:string):Promise<void> {
 const {data,error}=await supabase.rpc('delete_flower_gift',{p_id:id});
 if(error||!data?.deleted)throw new Error('Could not delete this gift.');
}
export async function openFlowerGift(token:string,passcode:string):Promise<GiftLookup> {
 if(!/^[a-f0-9]{64}$/.test(token))return {status:'missing'};
 const {data,error}=await supabase.rpc('open_flower_gift',{p_token:token,p_passcode:passcode||null});
 if(error)throw new Error('Could not open your gift right now.');
 if(data?.status==='ok')return {status:'ready',gift:{bouquet:data.bouquet,to:data.to_name,from:data.from_name,message:data.message,font:data.font}};
 if(data?.status==='passcode_required'||data?.status==='invalid_passcode')return {status:'locked'};
 if(data?.status==='rate_limited')throw new Error(`Too many passcode attempts for this gift. Try again in about ${Math.max(1,Math.ceil(Number(data.retry_after_seconds||3600)/60))} minutes. Even the correct passcode must wait until the lock clears.`);
 return {status:'missing'};
}
export function flowerTokenFromLocation():string|null {
 const hash=window.location.hash.match(/^#flower=([a-f0-9]+)$/);
 return hash?.[1]||new URLSearchParams(window.location.search).get('gift');
}
