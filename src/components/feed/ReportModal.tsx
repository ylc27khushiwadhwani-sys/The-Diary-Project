import React, { useState } from 'react';
import { Flag, X, CheckCircle2 } from 'lucide-react';
import { submitNoteReport } from '../../services/reporting';
import { useAuth } from '../../contexts/AuthContext';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-parchment-50 border border-parchment-300 rounded-2xl p-6 shadow-2xl text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-100 hover:text-ink-900 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3 text-rosewood-700">
          <Flag className="w-5 h-5" />
          <h3 className="font-serif text-base font-medium text-ink-900">
            Report Unsent Note
          </h3>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-sage-600 mx-auto" />
            <h4 className="font-serif font-medium text-sm text-ink-900">Thank you for reporting</h4>
            <p className="text-xs text-ink-500">
              Notes reaching safety report thresholds are automatically hidden from the public library.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-ink-500 leading-relaxed">
              Help keep the library safe and compassionate. Why should this letter be reviewed?
            </p>

            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    selectedReason === reason
                      ? 'bg-white border-ink-900 font-medium text-ink-900'
                      : 'bg-white/60 border-parchment-200 text-ink-500 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="mt-0.5 text-ink-900 focus:ring-ink-900"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-rosewood-700 hover:bg-rosewood-800 text-white rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 bg-parchment-200 text-ink-800 rounded-lg text-xs hover:bg-parchment-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
