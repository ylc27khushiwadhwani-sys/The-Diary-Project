import React, { useState } from 'react';
import { Lock, Unlock, KeyRound } from 'lucide-react';
import { createStoredPasscodeHash } from '../../utils/crypto';

interface LockNoteToggleProps {
  isLocked: boolean;
  onLockChange: (locked: boolean, passcodeHash: string | null) => void;
}

export const LockNoteToggle: React.FC<LockNoteToggleProps> = ({ isLocked, onLockChange }) => {
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleToggleClick = () => {
    if (isLocked) {
      onLockChange(false, null);
    } else {
      setShowPinInput(true);
      setPin('');
      setError('');
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('Passcode must be at least 4 digits');
      return;
    }
    const hash = await createStoredPasscodeHash(pin);
    onLockChange(true, hash);
    setShowPinInput(false);
    setPin('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggleClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold transition cursor-pointer ${
          isLocked
            ? 'bg-wax-crimson text-white border border-red-500/40 shadow-candle'
            : 'bg-wood-950/80 text-amber-200/80 hover:text-amber-100 border border-amber-800/40'
        }`}
        title={isLocked ? "Letter is sealed with a secret passcode" : "Seal this letter with a secret passcode"}
      >
        {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-300" /> : <Unlock className="w-3.5 h-3.5 text-amber-500" />}
        <span>{isLocked ? 'Sealed Eyes-Only' : 'Seal with Passcode'}</span>
      </button>

      {showPinInput && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPinInput(false)} />
          <div className="absolute right-0 mt-2 w-64 p-4 parchment-sheet border border-amber-900/40 rounded-xl shadow-2xl z-50 text-left animate-fade-in text-wood-950">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-amber-800" />
              <h4 className="text-xs font-cinzel font-bold text-wood-950">Set Secret Passcode</h4>
            </div>
            <p className="text-[11px] font-cormorant text-wood-800 mb-3 italic">
              Create a secret numeric PIN. You'll need this each time you break the seal.
            </p>

            <form onSubmit={handleSetPin} className="space-y-2">
              <input
                type="password"
                maxLength={8}
                autoFocus
                placeholder="4-8 digits"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-2.5 py-1.5 bg-amber-50 border border-amber-900/30 rounded-lg text-center tracking-widest text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-600 text-wood-950 shadow-inner"
              />
              {error && <p className="text-[11px] font-cinzel text-red-800 font-semibold">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-wax-crimson hover:bg-wax-crimsonBright text-white text-xs font-cinzel font-bold rounded-lg transition cursor-pointer shadow-xs"
                >
                  Seal Letter
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinInput(false)}
                  className="px-2.5 py-1.5 text-xs font-cinzel text-wood-700 hover:text-wood-950 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
