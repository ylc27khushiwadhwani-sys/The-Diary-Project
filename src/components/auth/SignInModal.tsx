import React, { useState } from 'react';
import { Mail, CheckCircle2, X, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { WaxSeal } from '../library/WaxSeal';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const { signInWithMagicLink, loginAsGuestDemo, updatePenName } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
    const nameOptions = [
    "The Boy Who Cried Wolf",
    "The One Who Lived",
    "Silent Quill",
    "Midnight Wanderer",
    "Velvet Sparrow",
    "Luminous Dreamer",
    "Mysterious Stranger",
    "Hidden Ink",
    "Wandering Bard",
    "Shadow Scribe",
  ];
  const [chosenName, setChosenName] = useState('');
  const handleNameSelect = (name: string) => {
    setChosenName(name);
    // In a real app this would persist to user profile; for demo we store in localStorage
    localStorage.setItem('demo_pen_name', name);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMessage('');

    const { error } = await signInWithMagicLink(email);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSent(true);
    }
  };

  const handleGuestEntry = async () => {
    if (chosenName) {
      await updatePenName(chosenName);
    }
    loginAsGuestDemo();
    onClose();
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
          <WaxSeal color="crimson" size="md" icon="crest" />
          <div>
            <h3 className="font-serif text-xl font-bold text-wood-950">Enter the Sanctuary</h3>
            <p className="font-body text-xs text-wood-800 italic">Your anonymous, locked library chamber</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
            <h4 className="font-serif text-lg text-wood-950 font-bold">Courier Dispatched</h4>
            <p className="font-body text-sm text-wood-900 leading-relaxed italic">
              We dispatched a passwordless sign-in key to <span className="font-serif font-bold text-wood-950 not-italic">{email}</span>. Click it to unlock your private shelves.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2 text-xs font-serif font-bold bg-wood-900 text-amber-100 rounded-full hover:bg-wood-800 transition-colors cursor-pointer"
            >
              Return to Hall
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-body text-sm text-wood-900 leading-relaxed italic">
              Sign in with an email to preserve your sanctuary across devices. Nobody ever sees your real address—you are identified only by a generated anonymous pen name.
            </p>

            {errorMessage && (
              <div className="p-3 text-xs bg-red-900/10 text-red-900 border border-red-800/20 rounded-lg font-serif">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-serif font-bold text-wood-800 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-amber-800 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reader@example.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-amber-50/80 border border-amber-900/30 rounded-xl text-sm font-serif text-wood-950 focus:outline-none focus:ring-1 focus:ring-amber-600 transition"
                  />
                </div>
                {/* Name selection for guest */}
                <div className="flex flex-wrap gap-2 justify-center mb-2">
                  {nameOptions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleNameSelect(name)}
                      className={`px-3 py-1 rounded ${chosenName === name ? 'bg-amber-600 text-white' : 'bg-wood-800 text-amber-200'} text-xs font-serif`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-wax-crimson hover:bg-wax-crimsonBright text-white rounded-xl text-xs font-serif font-bold transition shadow-candle border border-red-500/30 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Dispatching Key...' : 'Send Magic Link via Email'}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-amber-900/20" />
              <span className="flex-shrink mx-3 text-xs font-serif text-wood-600">or explore freely</span>
              <div className="flex-grow border-t border-amber-900/20" />
            </div>

            <button
              onClick={handleGuestEntry}
              className="w-full py-2.5 bg-wood-900 hover:bg-wood-850 text-amber-200 border border-amber-700/50 rounded-xl text-xs font-serif font-semibold transition cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Continue as Anonymous Guest</span>
            </button>
          </div>
        )}

        <div className="scroll-roll-bottom -mx-4 -mb-5 mt-4" />
      </div>
    </div>
  );
};
