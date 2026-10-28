import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, Feather } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { screenNoteContent } from '../../services/moderation';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { HelplineModal } from '../safety/HelplineModal';
import { WaxSeal } from '../library/WaxSeal';

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
        is_approved_by_note_owner: false,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-lg parchment-sheet rounded-2xl p-6 sm:p-8 shadow-2xl text-left border border-amber-900/30">
          <div className="scroll-roll-top -mx-4 -mt-6 mb-4" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-wood-600 hover:text-wood-950 transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-amber-900/20">
            <WaxSeal color="gold" size="md" icon="quill" />
            <div>
              <span className="text-[10px] uppercase font-serif font-bold tracking-widest text-wood-700 block">
                Letter in Response
              </span>
              <h3 className="font-serif text-lg font-bold text-wood-950">
                To {targetPenName}
              </h3>
              <p className="font-body text-xs text-wood-800 italic truncate max-w-[280px]">
                Regarding: "{targetNoteTitle || 'Untitled Letter'}"
              </p>
            </div>
          </div>

          <p className="font-body text-xs text-wood-800 leading-relaxed mb-4 italic">
            Your words will arrive privately in the author's sanctuary under your pen name (
            <span className="font-serif font-bold text-wood-950 not-italic">{profile?.pen_name}</span>). The author may keep it close to their heart or pin it publicly beneath their letter.
          </p>

          {errorWarning && (
            <div className="p-3 mb-4 text-xs bg-red-900/10 text-red-900 border border-red-800/20 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-700" />
              <p className="leading-relaxed">{errorWarning}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              required
              rows={5}
              placeholder="Write with gentle kindness and truth..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 bg-amber-50/70 border border-amber-800/30 rounded-xl text-base font-body text-wood-950 leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-600 resize-none"
            />

            <div className="flex items-center justify-between text-[11px] font-serif text-wood-700 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Screened by AI moderation</span>
              </span>
              <span>{content.length} characters</span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-wax-crimson hover:bg-wax-crimsonBright text-white rounded-xl text-xs font-serif font-bold transition shadow-candle border border-red-500/30 disabled:opacity-40 cursor-pointer"
              >
                <Feather className="w-3.5 h-3.5 text-amber-300" />
                <span>{submitting ? 'Sealing & Dispatching...' : 'Seal & Send Response'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-amber-900/10 text-wood-800 hover:bg-amber-900/20 rounded-xl text-xs font-serif font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="scroll-roll-bottom -mx-4 -mb-6 mt-4" />
        </div>
      </div>

      <HelplineModal
        isOpen={isHelplineOpen}
        onClose={() => setIsHelplineOpen(false)}
      />
    </>
  );
};
