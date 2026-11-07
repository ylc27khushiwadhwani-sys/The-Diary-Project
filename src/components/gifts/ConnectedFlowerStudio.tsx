import React,{useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {FlowerStudio,FlowerDraft,FlowerLink} from './FlowerStudio';
import {createFlowerGift,listFlowerGifts,deleteFlowerGift} from '../../lib/flowerGifts';
import {useAuth} from '../../contexts/AuthContext';
export const ConnectedFlowerStudio:React.FC<{onClose:()=>void}> = ({onClose})=>{
 const {user}=useAuth();const [history,setHistory]=useState<FlowerLink[]>([]);const [error,setError]=useState('');
 useEffect(()=>{let active=true;listFlowerGifts().then(v=>{if(active)setHistory(v)}).catch(()=>{if(active)setError('Your previous gifts could not load. Close and reopen to try again.')});return()=>{active=false}},[user?.id]);
 useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=previous}},[]);
 const create=async(draft:FlowerDraft,passcode:string)=>{const made=await createFlowerGift(draft,passcode);setHistory(h=>[made,...h]);return made};
 const revoke=async(id:string)=>{await deleteFlowerGift(id);setHistory(h=>h.filter(g=>g.id!==id))};
 return createPortal(<FlowerStudio onClose={onClose} create={create} history={history} revoke={revoke} historyError={error} isGuest={!!user?.is_anonymous}/>,document.body);
};
