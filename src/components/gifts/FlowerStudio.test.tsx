import {describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {FlowerStudio} from './FlowerStudio';
import {BOUQUETS} from './BouquetArt';
import {FlowerGiftPage} from './FlowerGiftPage';

describe('flower studio',()=>{
 it('switches every original bouquet and keeps keyboard focus inside the studio',()=>{
  const onClose=vi.fn();render(<FlowerStudio onClose={onClose} create={vi.fn()} revoke={vi.fn()} history={[]}/>);
  for(const bouquet of BOUQUETS){const button=screen.getByRole('button',{name:`${bouquet.name} bouquet`});fireEvent.click(button);expect(button).toHaveAttribute('aria-pressed','true');}
  fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});expect(onClose).toHaveBeenCalledOnce();
 });
 it('requires explicit confirmation before removing a gift',async()=>{
  const revoke=vi.fn().mockResolvedValue(undefined);render(<FlowerStudio onClose={vi.fn()} create={vi.fn()} revoke={revoke} history={[{id:'qa-gift',token:'qa-token',to:'Local reader',bouquet:'rose',created_at:'2026-11-07'}]}/>);
  fireEvent.click(screen.getByRole('button',{name:'Delete gift'}));expect(revoke).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Keep gift'}));expect(revoke).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Delete gift'}));fireEvent.click(screen.getByRole('button',{name:'Delete gift permanently'}));await waitFor(()=>expect(revoke).toHaveBeenCalledWith('qa-gift'));
 });
 it('discards a recipient lookup that resolves after the token changes',async()=>{
  let finish:(value:{status:'missing'})=>void=()=>{};
  const read=vi.fn().mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve})).mockResolvedValue({status:'locked'});
  const view=render(<FlowerGiftPage token="old" read={read} onExit={vi.fn()}/>);
  view.rerender(<FlowerGiftPage key="new" token="new" read={read} onExit={vi.fn()}/>);
  await screen.findByLabelText('Gift passcode');finish({status:'missing'});await waitFor(()=>expect(screen.queryByText('This gift is no longer here.')).not.toBeInTheDocument());
 });
});
