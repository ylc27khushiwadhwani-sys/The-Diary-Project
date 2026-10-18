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
      setError('PIN must be at least 4 digits');
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
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
          isLocked
            ? 'bg-rosewood-100/80 text-rosewood-700 border border-rosewood-200'
            : 'bg-parchment-200 text-ink-500 hover:text-ink-900 border border-parchment-300'
        }`}
        title={isLocked ? "Note is locked for your eyes only" : "Lock this note with a passcode"}
      >
        {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        <span>{isLocked ? 'Locked Note' : 'Lock Note'}</span>
      </button>

      {showPinInput && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPinInput(false)} />
          <div className="absolute right-0 mt-2 w-64 p-4 bg-parchment-50 border border-parchment-300 rounded-xl shadow-xl z-50 text-left animate-fade-in">
            <div className="flex items-center gap-2 mb-2 text-ink-900">
              <KeyRound className="w-4 h-4 text-sage-600" />
              <h4 className="text-xs font-serif font-medium">Set Eyes-Only Passcode</h4>
            </div>
            <p className="text-[11px] text-ink-100 mb-3">
              Create a secret PIN. You'll need this each time you view this note.
            </p>

            <form onSubmit={handleSetPin} className="space-y-2">
              <input
                type="password"
                maxLength={8}
                autoFocus
                placeholder="Enter 4-8 digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-2.5 py-1.5 bg-white border border-parchment-300 rounded text-center tracking-widest text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sage-600"
              />
              {error && <p className="text-[11px] text-rosewood-600">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-1 bg-ink-900 text-white text-xs rounded hover:bg-ink-800 transition"
                >
                  Confirm & Lock
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinInput(false)}
                  className="px-2 py-1 text-xs text-ink-100 hover:text-ink-900"
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
