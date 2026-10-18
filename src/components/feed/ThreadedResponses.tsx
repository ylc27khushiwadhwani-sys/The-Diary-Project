import React, { useEffect, useState } from 'react';
import { MessageSquare, Quote, Heart } from 'lucide-react';
import { ResponseLetter } from '../../types/database';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { PenNameBadge } from '../auth/PenNameBadge';

interface ThreadedResponsesProps {
  noteId: string;
}

const DEMO_RESPONSES_KEY = 'unsent_library_demo_responses';

export const ThreadedResponses: React.FC<ThreadedResponsesProps> = ({ noteId }) => {
  const [responses, setResponses] = useState<ResponseLetter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovedResponses = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      const raw = localStorage.getItem(DEMO_RESPONSES_KEY);
      const all: ResponseLetter[] = raw ? JSON.parse(raw) : [];
      const noteResponses = all.filter(
        (r) => r.note_id === noteId && r.is_approved_by_note_owner && r.moderation_status === 'clean'
      );
      setResponses(noteResponses);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('response_letters')
      .select('*, profiles:author_id(id, pen_name, avatar_color)')
      .eq('note_id', noteId)
      .eq('is_approved_by_note_owner', true)
      .eq('moderation_status', 'clean')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setResponses(data as ResponseLetter[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApprovedResponses();
  }, [noteId]);

  if (loading) {
    return (
      <div className="py-4 text-center text-xs text-ink-100 font-serif italic">
        Gathering letters in response...
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="py-6 px-4 bg-parchment-100/50 rounded-xl text-center border border-dashed border-parchment-300">
        <MessageSquare className="w-5 h-5 mx-auto text-ink-100 mb-1.5 opacity-60" />
        <p className="text-xs text-ink-500 font-serif italic">
          No letters in response have been pinned to this letter yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center gap-2 text-xs font-serif text-ink-500 pb-1 border-b border-parchment-200">
        <Heart className="w-3.5 h-3.5 text-rosewood-600" />
        <span>Letters in Response ({responses.length})</span>
      </div>

      <div className="space-y-3">
        {responses.map((resp) => (
          <div
            key={resp.id}
            className="p-4 bg-white/80 border border-parchment-300 rounded-xl shadow-2xs relative text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Quote className="w-3.5 h-3.5 text-sage-600 shrink-0" />
                <PenNameBadge
                  penName={resp.profiles?.pen_name || 'Kind Stranger'}
                  avatarColor={resp.profiles?.avatar_color}
                  size="sm"
                />
              </div>
              <span className="text-[10px] text-ink-100">
                {new Date(resp.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <p className="text-xs font-serif text-ink-800 leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-sage-200">
              {resp.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
