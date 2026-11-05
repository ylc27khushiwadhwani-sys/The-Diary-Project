import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { verifyPasscode } from '../../utils/crypto';
import { WaxSeal } from './WaxSeal';

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
      setError('Incorrect passcode. The wax seal remains unbroken.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm parchment-sheet border border-amber-900/40 rounded-2xl p-7 shadow-2xl text-center text-wood-950">
        <div className="scroll-roll-top -mx-4 -mt-5 mb-4" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-wood-600 hover:text-wood-950 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <WaxSeal color="crimson" size="lg" icon="lock" className="transform hover:scale-105" />
        </div>

        <h3 className="font-serif text-lg font-bold text-wood-950 mb-1">
          Sealed for Your Eyes Only
        </h3>
        <p className="font-body text-xs text-wood-800 mb-5 leading-relaxed italic">
          Enter your secret passcode to melt the wax seal and unroll this unsent letter.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            maxLength={8}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-40 mx-auto px-4 py-2 bg-amber-50/90 border border-amber-900/40 rounded-xl text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-600 transition text-wood-950 shadow-inner"
          />

          {error && <p className="text-xs font-serif text-red-800 font-semibold">{error}</p>}

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={verifying || pin.length < 4}
              className="flex-1 py-2.5 bg-wax-crimson hover:bg-wax-crimsonBright text-white rounded-xl text-xs font-serif font-bold transition shadow-candle border border-red-500/30 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{verifying ? 'Breaking Seal...' : 'Break Seal'}</span>
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

        <div className="scroll-roll-bottom -mx-4 -mb-5 mt-4" />
      </div>
    </div>
  );
};
