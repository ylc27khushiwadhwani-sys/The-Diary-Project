import React, { useEffect, useState } from 'react';
import { Mail, Check, Pin, PinOff, Trash2, X, RefreshCw, MessageSquare } from 'lucide-react';
import { ResponseLetter } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { PenNameBadge } from '../auth/PenNameBadge';

interface AuthorInboxProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EnrichedResponse extends ResponseLetter {
  note_title?: string;
}

const DEMO_RESPONSES_KEY = 'unsent_library_demo_responses';
const DEMO_NOTES_KEY = 'unsent_library_demo_notes';

export const AuthorInbox: React.FC<AuthorInboxProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [responses, setResponses] = useState<EnrichedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchAuthorResponses = async () => {
    if (!user) return;
    setLoading(true);

    if (!isSupabaseConfigured) {
      const rawNotes = localStorage.getItem(DEMO_NOTES_KEY);
      const userNotes = rawNotes ? JSON.parse(rawNotes).filter((n: any) => n.user_id === user.id) : [];
      const userNoteIds = new Set(userNotes.map((n: any) => n.id));
      const noteTitleMap = new Map(userNotes.map((n: any) => [n.id, n.title || 'Untitled Letter']));

      const rawResp = localStorage.getItem(DEMO_RESPONSES_KEY);
      const allResp: ResponseLetter[] = rawResp ? JSON.parse(rawResp) : [];
      const incoming = allResp
        .filter((r) => userNoteIds.has(r.note_id))
        .map((r) => ({
          ...r,
          note_title: (noteTitleMap.get(r.note_id) as string) || 'Untitled Letter',
        }));

      setResponses(incoming);
      setLoading(false);
      return;
    }

    // Supabase query: response letters for all notes owned by current user
    const { data: userNotes } = await supabase
      .from('notes')
      .select('id, title')
      .eq('user_id', user.id);

    if (!userNotes || userNotes.length === 0) {
      setResponses([]);
      setLoading(false);
      return;
    }

    const noteIds = userNotes.map((n) => n.id);
    const noteMap = new Map(userNotes.map((n) => [n.id, n.title || 'Untitled Letter']));

    const { data, error } = await supabase
      .from('response_letters')
      .select('*, profiles:author_id(id, pen_name, avatar_color)')
      .in('note_id', noteIds)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const enriched = data.map((r: any) => ({
        ...r,
        note_title: noteMap.get(r.note_id) || 'Untitled Letter',
      }));
      setResponses(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchAuthorResponses();
    }
  }, [isOpen, user]);

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
      setActionSuccess(nextStatus ? 'Letter pinned to public note' : 'Letter kept private');
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
      setActionSuccess(nextStatus ? 'Letter pinned to public note' : 'Letter kept private');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const deleteResponse = async (responseId: string) => {
    if (!confirm('Are you sure you want to dismiss this response?')) return;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-parchment-50 border border-parchment-300 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-left">
        {/* Header */}
        <div className="p-6 border-b border-parchment-200 flex items-center justify-between bg-parchment-100/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sage-100 border border-sage-300 flex items-center justify-center text-sage-700">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium text-ink-900">
                Letters in Response
              </h2>
              <p className="text-xs text-ink-100">
                Replies from kind readers to your shared unsent notes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAuthorResponses}
              className="p-2 text-ink-100 hover:text-ink-900 rounded-lg hover:bg-parchment-200 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-ink-100 hover:text-ink-900 rounded-lg hover:bg-parchment-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner Alert */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-2.5 bg-sage-50 border border-sage-200 rounded-xl text-xs text-sage-700 flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-sage-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-ink-100 font-serif italic">
              Loading letters in response...
            </div>
          ) : responses.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare className="w-8 h-8 mx-auto text-ink-100 mb-2 opacity-50" />
              <p className="font-serif text-sm text-ink-800 font-medium">Your inbox is still quiet</p>
              <p className="text-xs text-ink-100 max-w-sm mx-auto mt-1">
                When readers write back to your publicly shared notes, their responses will appear here for you to read privately or pin publicly.
              </p>
            </div>
          ) : (
            responses.map((resp) => (
              <div
                key={resp.id}
                className="p-5 bg-white border border-parchment-300 rounded-xl shadow-xs transition hover:border-parchment-400"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-parchment-200">
                  <div className="flex items-center gap-2">
                    <PenNameBadge
                      penName={resp.profiles?.pen_name || 'Kind Reader'}
                      avatarColor={resp.profiles?.avatar_color}
                      size="sm"
                    />
                    <span className="text-xs text-ink-100">on</span>
                    <span className="text-xs font-serif italic text-ink-900">
                      "{resp.note_title}"
                    </span>
                  </div>
                  <span className="text-[10px] text-ink-100">
                    {new Date(resp.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <p className="text-sm font-serif text-ink-900 leading-relaxed whitespace-pre-wrap py-2">
                  {resp.content}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-parchment-200 mt-2">
                  <span className="text-[11px] text-ink-500">
                    {resp.is_approved_by_note_owner ? (
                      <span className="inline-flex items-center gap-1 text-sage-700 font-medium">
                        <Pin className="w-3 h-3 text-sage-600" />
                        Pinned to your public letter
                      </span>
                    ) : (
                      <span className="text-ink-100 italic">
                        Private to your inbox only
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePin(resp.id, resp.is_approved_by_note_owner)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        resp.is_approved_by_note_owner
                          ? 'bg-parchment-200 hover:bg-parchment-300 text-ink-800'
                          : 'bg-sage-600 hover:bg-sage-700 text-white shadow-2xs'
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
                      className="p-1.5 text-ink-100 hover:text-rosewood-600 hover:bg-rosewood-50 rounded-lg transition"
                      title="Dismiss response"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
