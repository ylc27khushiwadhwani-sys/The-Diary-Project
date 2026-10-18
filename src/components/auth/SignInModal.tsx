import React, { useState } from 'react';
import { Mail, CheckCircle2, X, Feather } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const { signInWithMagicLink, loginAsGuestDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleGuestEntry = () => {
    loginAsGuestDemo();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-parchment-50 border border-parchment-300 rounded-2xl p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-100 hover:text-ink-900 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center">
            <Feather className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-medium text-ink-900">Enter the Library</h3>
            <p className="text-xs text-ink-100">Your quiet, anonymous sanctuary</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-sage-600 mx-auto" />
            <h4 className="font-serif text-lg text-ink-900 font-medium">Link on its way</h4>
            <p className="text-sm text-ink-500 leading-relaxed">
              We sent a passwordless sign-in link to <span className="font-medium text-ink-900">{email}</span>. Click it to enter your private library.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2 text-sm bg-parchment-200 text-ink-800 rounded-lg hover:bg-parchment-300 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-500 leading-relaxed">
              Sign up with an email to keep your library safe. Nobody sees your identity—you will be known to the world solely by an anonymous pen name.
            </p>

            {errorMessage && (
              <div className="p-3 text-xs bg-rosewood-50 text-rosewood-700 border border-rosewood-100 rounded-lg">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-100 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-parchment-300 rounded-lg text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-sage-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-ink-900 hover:bg-ink-800 text-parchment-50 rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
              >
                {loading ? 'Sending link...' : 'Send Magic Sign-In Link'}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-parchment-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-parchment-50 text-ink-100">or explore instantly</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGuestEntry}
              className="w-full py-2.5 bg-parchment-100 hover:bg-parchment-200 text-ink-800 border border-parchment-300 rounded-lg text-sm font-medium transition"
            >
              Continue as Anonymous Guest
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
