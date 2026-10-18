import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { verifyPasscode } from '../../utils/crypto';

interface PasscodeModalProps {
  isOpen: boolean;
  passcodeHash: string | null;
  onSuccess: () => void;
  onClose: () => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({
  isOpen,
  passcodeHash,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeHash) {
      onSuccess();
      return;
    }
    setVerifying(true);
    setError('');

    const isValid = await verifyPasscode(pin, passcodeHash);
    setVerifying(false);

    if (isValid) {
      setPin('');
      onSuccess();
    } else {
      setError('Incorrect passcode. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-parchment-50 border border-parchment-300 rounded-2xl p-6 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-100 hover:text-ink-900 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-rosewood-100 text-rosewood-700 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="font-serif text-lg font-medium text-ink-900 mb-1">
          Locked for Your Eyes Only
        </h3>
        <p className="text-xs text-ink-100 mb-5 leading-relaxed">
          Enter your secret passcode to view and edit this unsent letter.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            maxLength={8}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-40 mx-auto px-4 py-2 bg-white border border-parchment-300 rounded-xl text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-rosewood-500 focus:border-transparent transition"
          />

          {error && <p className="text-xs text-rosewood-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={verifying || pin.length < 4}
              className="flex-1 py-2 bg-ink-900 hover:bg-ink-800 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
            >
              {verifying ? 'Checking...' : 'Unlock Note'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-parchment-200 text-ink-800 rounded-lg text-xs hover:bg-parchment-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
