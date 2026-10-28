import React, { useState } from 'react';
import { MessageSquare, Heart } from 'lucide-react';
import { ResponseLetter } from '../../types/database';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { WaxSeal } from '../library/WaxSeal';
import { useCancellableLoad } from '../../hooks/useCancellableLoad';

interface ThreadedResponsesProps {
  noteId: string;
}

const DEMO_RESPONSES_KEY = 'unsent_library_demo_responses';

const loadApprovedResponses = async (noteId: string): Promise<ResponseLetter[] | null> => {
  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem(DEMO_RESPONSES_KEY);
    const all: ResponseLetter[] = raw ? JSON.parse(raw) : [];
    return all.filter(
      (r) => r.note_id === noteId && r.is_approved_by_note_owner && r.moderation_status === 'clean'
    );
  }

  const { data, error } = await supabase
    .from('response_letters')
    .select('*, profiles:author_id(id, pen_name, avatar_color)')
    .eq('note_id', noteId)
    .eq('is_approved_by_note_owner', true)
    .eq('moderation_status', 'clean')
    .order('created_at', { ascending: true });

  if (error || !data) return null;
  return data as ResponseLetter[];
};

export const ThreadedResponses: React.FC<ThreadedResponsesProps> = ({ noteId }) => {
  const [responses, setResponses] = useState<ResponseLetter[]>([]);

  const { loading } = useCancellableLoad(
    () => loadApprovedResponses(noteId),
    [noteId],
    setResponses
  );

  if (loading) {
    return (
      <div className="py-4 text-center text-xs text-wood-700 font-serif italic">
        Gathering letters in response...
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="py-5 px-4 bg-amber-950/5 rounded-xl text-center border border-dashed border-amber-900/20">
        <MessageSquare className="w-5 h-5 mx-auto text-wood-500 mb-1.5 opacity-60" />
        <p className="text-xs text-wood-800 font-serif italic">
          No letters in response have been pinned to this parchment yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-xs font-serif text-wood-800 pb-1.5 border-b border-amber-900/20 font-bold uppercase tracking-wider">
        <Heart className="w-3.5 h-3.5 text-red-700" />
        <span>Letters in Response ({responses.length})</span>
      </div>

      <div className="space-y-3">
        {responses.map((resp) => (
          <div
            key={resp.id}
            className="p-4 bg-amber-50/70 border border-amber-800/30 rounded-lg shadow-xs relative text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <WaxSeal color="gold" size="sm" icon="quill" />
                <span className="font-script text-base text-wood-950 font-bold">
                  {resp.profiles?.pen_name || 'Kind Stranger'}
                </span>
              </div>
              <span className="text-[10px] font-serif text-wood-600">
                {new Date(resp.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <p className="text-sm font-body text-wood-950 leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-amber-700/40">
              {resp.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
