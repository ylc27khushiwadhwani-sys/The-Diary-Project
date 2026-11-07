import {renderHook,waitFor,act} from '@testing-library/react';
import {describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({range:vi.fn()}));
vi.mock('../lib/supabase',()=>({isSupabaseConfigured:true,supabase:{from:()=>({select(){return this},eq(){return this},order(){return this},range:mocks.range})}}));
import {usePublicNotes} from './usePublicNotes';
describe('public shelf paging',()=>{
  it('advances by raw database rows even when whispers are filtered',async()=>{
    const first=Array.from({length:120},(_,i)=>({id:`id-${i}`,is_public:true,moderation_status:'clean',tags:i===0?['whisper']:[]}));
    mocks.range.mockResolvedValueOnce({data:first,error:null}).mockResolvedValueOnce({data:[{id:'last-public',tags:[],is_public:true,moderation_status:'clean'}],error:null});
    const {result}=renderHook(()=>usePublicNotes());
    await waitFor(()=>expect(result.current.loading).toBe(false));
    expect(result.current.notes).toHaveLength(119);
    expect(result.current.hasMore).toBe(true);
    act(()=>result.current.loadMore());
    await waitFor(()=>expect(result.current.notes).toHaveLength(120));
    expect(mocks.range).toHaveBeenNthCalledWith(2,120,239);
    expect(result.current.hasMore).toBe(false);
  });
});
