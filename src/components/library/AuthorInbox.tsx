import React, { useState } from 'react';
import { Check, Pin, PinOff, Trash2, X, RefreshCw, MessageSquare } from 'lucide-react';
import { Note, ResponseLetter } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { WaxSeal } from './WaxSeal';
import { useCancellableLoad } from '../../hooks/useCancellableLoad';

interface AuthorInboxProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EnrichedResponse extends ResponseLetter {
  note_title?: string;
}

const DEMO_RESPONSES_KEY = 'unsent_library_demo_responses';
const DEMO_NOTES_KEY = 'unsent_library_demo_notes';

const loadAuthorResponses = async (userId: string): Promise<EnrichedResponse[] | null> => {
  if (!isSupabaseConfigured) {
    const rawNotes = localStorage.getItem(DEMO_NOTES_KEY);
    const parsedNotes: Note[] = rawNotes ? JSON.parse(rawNotes) : [];
    const userNotes = parsedNotes.filter((n) => n.user_id === userId);
    const userNoteIds = new Set(userNotes.map((n) => n.id));
    const noteTitleMap = new Map(
      userNotes.map((n): [string, string] => [n.id, n.title || 'Untitled Letter'])
    );

    const rawResp = localStorage.getItem(DEMO_RESPONSES_KEY);
    const allResp: ResponseLetter[] = rawResp ? JSON.parse(rawResp) : [];
    return allResp
      .filter((r) => userNoteIds.has(r.note_id))
      .map((r) => ({
        ...r,
        note_title: noteTitleMap.get(r.note_id) || 'Untitled Letter',
      }));
  }

  const { data: userNotes } = await supabase
    .from('notes')
    .select('id, title')
    .eq('user_id', userId);

  if (!userNotes || userNotes.length === 0) return [];

  const noteIds = userNotes.map((n: { id: string; title: string | null }) => n.id);
  const noteMap = new Map(
    userNotes.map((n: { id: string; title: string | null }): [string, string] => [
      n.id,
      n.title || 'Untitled Letter',
    ])
  );

  const { data, error } = await supabase
    .from('response_letters')
    .select('*, profiles:author_id(id, pen_name, avatar_color)')
    .in('note_id', noteIds)
    .order('created_at', { ascending: false });

  if (error || !data) return null;
  return data.map((r: EnrichedResponse) => ({
    ...r,
    note_title: noteMap.get(r.note_id) || 'Untitled Letter',
  }));
};

export const AuthorInbox: React.FC<AuthorInboxProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [responses, setResponses] = useState<EnrichedResponse[]>([]);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Re-arms loading on reopen (deps change) and gives the refresh button a
  // refetch that participates in the same cancellation guard.
  const { loading, refetch } = useCancellableLoad(
    () => (isOpen && user ? loadAuthorResponses(user.id) : Promise.resolve(null)),
    [isOpen, user],
    setResponses
  );

  const togglePin = async (responseId: string, currentPinStatus: boolean) => {
    const nextStatus = !currentPinStatus;

    if (!isSupabaseConfigured) {
      const raw = localStorage.getItem(DEMO_RESPONSES_KEY);
      const all: ResponseLetter[] = raw ? JSON.parse(raw) : [];
      const updated = all.map((r) =>
        r.id === responseId ? { ...r, is_approved_by_note_owner: nextStatus } : r
      );
      localStorage.setItem(DEMO_RESPONSES_KEY, JSON.stringify(updated));
      setResponses((prev) =>
        prev.map((r) => (r.id === responseId ? { ...r, is_approved_by_note_owner: nextStatus } : r))
      );
      setActionSuccess(nextStatus ? 'Letter pinned to public note' : 'Letter kept in private sanctuary');
      setTimeout(() => setActionSuccess(null), 3000);
      return;
    }

    const { error } = await supabase
      .from('response_letters')
      .update({ is_approved_by_note_owner: nextStatus })
      .eq('id', responseId);

    if (!error) {
      setResponses((prev) =>
        prev.map((r) => (r.id === responseId ? { ...r, is_approved_by_note_owner: nextStatus } : r))
      );
      setActionSuccess(nextStatus ? 'Letter pinned to public note' : 'Letter kept in private sanctuary');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const deleteResponse = async (responseId: string) => {
    if (!confirm('Discard this letter from your correspondence box?')) return;

    if (!isSupabaseConfigured) {
      const raw = localStorage.getItem(DEMO_RESPONSES_KEY);
      const all: ResponseLetter[] = raw ? JSON.parse(raw) : [];
      const updated = all.filter((r) => r.id !== responseId);
      localStorage.setItem(DEMO_RESPONSES_KEY, JSON.stringify(updated));
      setResponses((prev) => prev.filter((r) => r.id !== responseId));
      return;
    }

    const { error } = await supabase.from('response_letters').delete().eq('id', responseId);
    if (!error) {
      setResponses((prev) => prev.filter((r) => r.id !== responseId));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl parchment-sheet border border-amber-900/40 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-left text-wood-950">
        <div className="scroll-roll-top -mx-2 -mt-4 mb-2" />

        {/* Header */}
        <div className="p-6 border-b border-amber-900/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WaxSeal color="gold" size="md" icon="crest" />
            <div>
              <h2 className="font-serif text-xl font-bold text-wood-950">
                Letters in Response
              </h2>
              <p className="font-body text-xs text-wood-800 italic">
                Correspondence sent by readers to your shared unsent notes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              className="p-2 text-wood-700 hover:text-wood-950 rounded-lg hover:bg-amber-900/10 transition cursor-pointer"
              title="Refresh inbox"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-wood-700 hover:text-wood-950 rounded-lg hover:bg-amber-900/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner Alert */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-900/10 border border-emerald-800/30 rounded-xl text-xs font-serif text-emerald-900 flex items-center gap-2 animate-fade-in font-bold">
            <Check className="w-4 h-4 text-emerald-700" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs font-serif text-wood-700 italic">
              Gathering correspondence...
            </div>
          ) : responses.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare className="w-10 h-10 mx-auto text-amber-800/40 mb-3" />
              <p className="font-serif text-base text-wood-950 font-bold">Your letter box is quiet</p>
              <p className="font-body text-sm text-wood-800 max-w-sm mx-auto mt-1 italic">
                When readers in the Grand Library send letters in response to your shared notes, they will arrive here for your eyes first.
              </p>
            </div>
          ) : (
            responses.map((resp) => (
              <div
                key={resp.id}
                className="p-5 bg-amber-50/80 border border-amber-900/30 rounded-xl shadow-xs transition hover:border-amber-800/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-amber-900/15">
                  <div className="flex items-center gap-2">
                    <span className="font-script text-lg text-wood-950 font-bold">
                      {resp.profiles?.pen_name || 'Kind Reader'}
                    </span>
                    <span className="text-xs font-serif text-wood-600">on</span>
                    <span className="text-xs font-serif font-bold text-wood-900">
                      "{resp.note_title}"
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

                <p className="text-base font-body text-wood-950 leading-relaxed whitespace-pre-wrap py-2">
                  {resp.content}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-amber-900/15 mt-2">
                  <span className="text-xs font-serif text-wood-700">
                    {resp.is_approved_by_note_owner ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-800 font-bold">
                        <Pin className="w-3.5 h-3.5 text-emerald-700" />
                        Pinned beneath your public note
                      </span>
                    ) : (
                      <span className="italic text-wood-600">
                        Kept in your private sanctuary
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePin(resp.id, resp.is_approved_by_note_owner)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition cursor-pointer ${
                        resp.is_approved_by_note_owner
                          ? 'bg-amber-900/15 hover:bg-amber-900/25 text-wood-900'
                          : 'bg-wax-crimson hover:bg-wax-crimsonBright text-white shadow-candle'
                      }`}
                    >
                      {resp.is_approved_by_note_owner ? (
                        <>
                          <PinOff className="w-3.5 h-3.5" />
                          <span>Unpin from Public</span>
                        </>
                      ) : (
                        <>
                          <Pin className="w-3.5 h-3.5" />
                          <span>Pin to Public Letter</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteResponse(resp.id)}
                      className="p-1.5 text-wood-500 hover:text-red-700 rounded-lg transition cursor-pointer"
                      title="Discard response"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="scroll-roll-bottom -mx-2 -mb-4 mt-2" />
      </div>
    </div>
  );
};
