import React, { useState } from 'react';
import { Globe, X, MessageSquare, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { screenNoteContent } from '../../services/moderation';

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
    } catch (err) {
      setIsScreening(false);
      setErrorWarning('A temporary error occurred while checking safety. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-parchment-50 border border-parchment-300 rounded-2xl p-6 shadow-2xl text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-100 hover:text-ink-900 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-ink-900">
              Share to the Public Library
            </h3>
            <p className="text-xs text-ink-100">Release this note to be witnessed</p>
          </div>
        </div>

        <p className="text-xs text-ink-500 leading-relaxed mb-4">
          This letter will be placed on the open library feed under your pen name (
          <span className="font-medium text-ink-900">{profile?.pen_name}</span>). Nobody will ever see your email or real identity.
        </p>

        {errorWarning && (
          <div className="p-3 mb-4 text-xs bg-rosewood-50 text-rosewood-700 border border-rosewood-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorWarning}</p>
          </div>
        )}

        <div className="p-3.5 bg-white border border-parchment-200 rounded-xl space-y-3 mb-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowResponses}
              onChange={(e) => setAllowResponses(e.target.checked)}
              className="mt-0.5 rounded border-parchment-300 text-sage-600 focus:ring-sage-500"
            />
            <div className="text-xs">
              <span className="font-medium text-ink-900 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sage-700" />
                Allow gentle response letters
              </span>
              <p className="text-ink-100 text-[11px] mt-0.5 leading-relaxed">
                Other anonymous writers can send heartfelt responses. They arrive in your private inbox first and will only be public if you approve them.
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-sage-700 mb-5">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Screened for self-harm & privacy safety prior to release.</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleConfirmShare}
            disabled={isScreening}
            className="flex-1 py-2.5 bg-ink-900 hover:bg-ink-800 text-white rounded-xl text-xs font-medium transition shadow-xs disabled:opacity-50"
          >
            {isScreening ? 'Screening note safety...' : 'Confirm & Publish Anonymously'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-parchment-200 text-ink-800 rounded-xl text-xs hover:bg-parchment-300 transition"
          >
            Keep Private
          </button>
        </div>
      </div>
    </div>
  );
};
