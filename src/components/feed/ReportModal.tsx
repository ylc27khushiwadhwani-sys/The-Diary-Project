import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { submitNoteReport } from '../../services/reporting';
import { useAuth } from '../../contexts/AuthContext';
import { WaxSeal } from '../library/WaxSeal';

interface ReportModalProps {
  isOpen: boolean;
  noteId: string;
  onClose: () => void;
  onReportSubmitted: () => void;
}

const REPORT_REASONS = [
  'Self-harm or crisis concern',
  'Reveals private personal details (phone, email, real names)',
  'Harassment, hate speech, or abuse',
  'Spam or commercial advertising',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  noteId,
  onClose,
  onReportSubmitted,
}) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await submitNoteReport(noteId, selectedReason, user?.id);
    setLoading(false);
    setSubmitted(true);
    setTimeout(() => {
      onReportSubmitted();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm parchment-sheet border border-amber-900/40 rounded-2xl p-6 shadow-2xl text-left text-wood-950">
        <div className="scroll-roll-top -mx-3 -mt-4 mb-3" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-wood-600 hover:text-wood-950 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-amber-900/20">
          <WaxSeal color="crimson" size="sm" icon="lock" />
          <div>
            <h3 className="font-cinzel text-base font-bold text-wood-950">
              Flag Letter for Review
            </h3>
            <p className="font-cormorant text-xs text-wood-800 italic">Preserving community safety in the archive</p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
            <h4 className="font-cinzel text-base font-bold text-wood-950">Report Logged</h4>
            <p className="font-cormorant text-xs text-wood-800 italic">
              Thank you for keeping our sanctuary safe. Notes receiving 3 flags are automatically retired from the public reading room.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="font-cormorant text-xs text-wood-900 leading-relaxed italic">
              Please specify the concern. Flagged notes are reviewed by automated moderation:
            </p>

            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-amber-50/70 border border-amber-900/20 hover:border-amber-900/40 transition cursor-pointer text-xs font-cinzel text-wood-900"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="text-wax-crimson focus:ring-amber-500 border-amber-800"
                  />
                  <span className="leading-tight">{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-wax-crimson hover:bg-wax-crimsonBright text-white text-xs font-cinzel font-bold rounded-xl transition shadow-candle disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Submitting Flag...' : 'Submit Report'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-amber-900/10 text-wood-800 hover:bg-amber-900/20 text-xs font-cinzel font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="scroll-roll-bottom -mx-3 -mb-4 mt-4" />
      </div>
    </div>
  );
};
