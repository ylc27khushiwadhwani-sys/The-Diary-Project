import React, { useState } from 'react';
import { X, MessageSquare, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { screenNoteContent } from '../../services/moderation';
import { WaxSeal } from './WaxSeal';

interface ShareModalProps {
  isOpen: boolean;
  noteTitle: string;
  noteContent: string;
  onSuccess: (allowResponses: boolean) => void;
  onSelfHarmFlagged: () => void;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  noteTitle,
  noteContent,
  onSuccess,
  onSelfHarmFlagged,
  onClose,
}) => {
  const { profile } = useAuth();
  const [allowResponses, setAllowResponses] = useState(true);
  const [isScreening, setIsScreening] = useState(false);
  const [errorWarning, setErrorWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmShare = async () => {
    setIsScreening(true);
    setErrorWarning(null);

    try {
      const result = await screenNoteContent(noteContent, noteTitle);
      setIsScreening(false);

      if (!result.allowed) {
        if (result.categories.self_harm) {
          onClose();
          onSelfHarmFlagged();
          return;
        }

        if (result.categories.pii) {
          setErrorWarning(
            'This note appears to contain personal contact details (such as a phone number or email address). To protect your privacy and others, personal identifiable details cannot be shared publicly.'
          );
          return;
        }

        setErrorWarning(
          'This note could not be shared publicly because it contains abusive or harassing content.'
        );
        return;
      }

      onSuccess(allowResponses);
      onClose();
    } catch {
      setIsScreening(false);
      setErrorWarning('A temporary error occurred while checking safety. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md parchment-sheet border border-amber-900/40 rounded-2xl p-7 shadow-2xl text-left text-wood-950">
        <div className="scroll-roll-top -mx-4 -mt-5 mb-4" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-wood-600 hover:text-wood-950 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-amber-900/20">
          <WaxSeal color="gold" size="md" icon="crest" />
          <div>
            <h3 className="font-cinzel text-lg font-bold text-wood-950">
              Release to the Grand Library
            </h3>
            <p className="font-cormorant text-xs text-wood-800 italic">Place your parchment in the public reading hall</p>
          </div>
        </div>

        <p className="font-cormorant text-xs text-wood-800 leading-relaxed mb-4 italic">
          This letter will be placed on the grand reading tables under your pseudonymous pen name (
          <span className="font-cinzel font-bold text-wood-950 not-italic">{profile?.pen_name}</span>). No reader will ever learn your email or real identity.
        </p>

        {errorWarning && (
          <div className="p-3 mb-4 text-xs bg-red-900/10 text-red-900 border border-red-800/20 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-700" />
            <p className="leading-relaxed">{errorWarning}</p>
          </div>
        )}

        <div className="p-4 bg-amber-50/80 border border-amber-900/30 rounded-xl space-y-3 mb-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowResponses}
              onChange={(e) => setAllowResponses(e.target.checked)}
              className="mt-0.5 rounded border-amber-800 text-wax-crimson focus:ring-amber-500"
            />
            <div className="text-xs">
              <span className="font-cinzel font-bold text-wood-950 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-800" />
                Allow reader response letters
              </span>
              <p className="font-cormorant text-wood-800 text-xs mt-1 leading-relaxed italic">
                Kind strangers can send handwritten replies. They arrive in your private letterbox first and only become public if you choose to pin them.
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-2 text-xs font-cinzel text-emerald-900 mb-5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>Screened for crisis & privacy safety prior to release.</span>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={handleConfirmShare}
            disabled={isScreening}
            className="flex-1 py-2.5 bg-wax-crimson hover:bg-wax-crimsonBright text-white rounded-xl text-xs font-cinzel font-bold transition shadow-candle border border-red-500/30 disabled:opacity-50 cursor-pointer"
          >
            {isScreening ? 'Screening letter...' : 'Seal & Release to Grand Library'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-amber-900/10 text-wood-800 hover:bg-amber-900/20 rounded-xl text-xs font-cinzel font-semibold transition cursor-pointer"
          >
            Keep in Private Study
          </button>
        </div>

        <div className="scroll-roll-bottom -mx-4 -mb-5 mt-4" />
      </div>
    </div>
  );
};
