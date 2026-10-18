import React, { useState } from 'react';
import { Send, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { screenNoteContent } from '../../services/moderation';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { HelplineModal } from '../safety/HelplineModal';

interface ResponseComposerProps {
  isOpen: boolean;
  targetNoteId: string;
  targetNoteTitle: string;
  targetPenName: string;
  onClose: () => void;
  onResponseSent: () => void;
}

const DEMO_RESPONSES_KEY = 'unsent_library_demo_responses';

export const ResponseComposer: React.FC<ResponseComposerProps> = ({
  isOpen,
  targetNoteId,
  targetNoteTitle,
  targetPenName,
  onClose,
  onResponseSent,
}) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorWarning, setErrorWarning] = useState<string | null>(null);
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !profile) return;
    setSubmitting(true);
    setErrorWarning(null);

    // 1. Screen response content through AI moderation
    const screenResult = await screenNoteContent(content);
    if (!screenResult.allowed) {
      setSubmitting(false);
      if (screenResult.categories.self_harm) {
        setIsHelplineOpen(true);
        return;
      }
      setErrorWarning('Your response contains personal identifiable information or language not permitted.');
      return;
    }

    // 2. Insert into database
    if (!isSupabaseConfigured) {
      const raw = localStorage.getItem(DEMO_RESPONSES_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const newResponse = {
        id: 'resp-' + Date.now(),
        note_id: targetNoteId,
        author_id: user.id,
        content: content.trim(),
        is_approved_by_note_owner: false, // private to author first
        moderation_status: 'clean',
        created_at: new Date().toISOString(),
        profiles: profile,
      };
      existing.push(newResponse);
      localStorage.setItem(DEMO_RESPONSES_KEY, JSON.stringify(existing));
      setSubmitting(false);
      setContent('');
      onResponseSent();
      onClose();
      return;
    }

    const { error } = await supabase.from('response_letters').insert([
      {
        note_id: targetNoteId,
        author_id: user.id,
        content: content.trim(),
        is_approved_by_note_owner: false,
        moderation_status: 'clean',
      },
    ]);

    setSubmitting(false);
    if (error) {
      setErrorWarning(error.message);
    } else {
      setContent('');
      onResponseSent();
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-lg bg-parchment-50 border border-parchment-300 rounded-2xl p-6 shadow-2xl text-left">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-ink-100 hover:text-ink-900 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-4">
            <span className="text-[10px] uppercase tracking-wider text-sage-700 bg-sage-100/60 px-2 py-0.5 rounded-full font-medium inline-block mb-1">
              Letter in Response
            </span>
            <h3 className="font-serif text-lg font-medium text-ink-900">
              Writing to {targetPenName}
            </h3>
            <p className="text-xs text-ink-100 italic truncate mt-0.5">
              Regarding: "{targetNoteTitle || 'Untitled Letter'}"
            </p>
          </div>

          <p className="text-xs text-ink-500 leading-relaxed mb-4">
            Your response will be sent to the author's private view under your pen name (
            <span className="font-medium text-ink-900">{profile?.pen_name}</span>). The author can choose to cherish it privately or pin it to their public letter.
          </p>

          {errorWarning && (
            <div className="p-3 mb-4 text-xs bg-rosewood-50 text-rosewood-700 border border-rosewood-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorWarning}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              required
              rows={6}
              placeholder="Write with kindness and understanding..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 bg-white border border-parchment-300 rounded-xl text-sm font-serif text-ink-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-sage-600 focus:border-transparent resize-none"
            />

            <div className="flex items-center justify-between text-[11px] text-ink-100 pt-1">
              <span className="flex items-center gap-1 text-sage-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Screened by AI moderation</span>
              </span>
              <span>{content.length} characters</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-ink-900 hover:bg-ink-800 text-white rounded-xl text-xs font-medium transition shadow-xs disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Screening & Sending...' : 'Send Response Letter'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-parchment-200 text-ink-800 rounded-xl text-xs hover:bg-parchment-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <HelplineModal
        isOpen={isHelplineOpen}
        onClose={() => setIsHelplineOpen(false)}
      />
    </>
  );
};
