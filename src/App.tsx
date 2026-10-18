import React, { useState } from 'react';
import { BookOpen, Feather, LogIn, LogOut, LifeBuoy, ShieldCheck } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { PenNameBadge } from './components/auth/PenNameBadge';
import { SignInModal } from './components/auth/SignInModal';
import { HelplineModal } from './components/safety/HelplineModal';
import { PublicFeedPage } from './pages/PublicFeedPage';
import { LibraryPage } from './pages/LibraryPage';

export const App: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'public' | 'sanctuary'>('public');
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);

  return (
    <div className="min-h-screen bg-parchment-100 flex flex-col selection:bg-sage-100 text-ink-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-parchment-50/95 backdrop-blur-md border-b border-parchment-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <div
            onClick={() => setActiveTab('public')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-ink-900 flex items-center justify-center text-parchment-50 shadow-xs group-hover:scale-105 transition-transform">
              <Feather className="w-4 h-4 text-parchment-200" />
            </div>
            <div>
              <span className="font-serif text-base sm:text-lg font-medium text-ink-900 tracking-tight block leading-none">
                The Library of Unsent Things
              </span>
              <span className="text-[10px] text-ink-100 tracking-wider uppercase font-sans font-medium">
                Anonymous Sanctuary
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('public')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
                activeTab === 'public'
                  ? 'bg-ink-900 text-parchment-50 shadow-xs'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-parchment-200/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Public Library</span>
            </button>

            <button
              onClick={() => setActiveTab('sanctuary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
                activeTab === 'sanctuary'
                  ? 'bg-ink-900 text-parchment-50 shadow-xs'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-parchment-200/60'
              }`}
            >
              <Feather className="w-4 h-4" />
              <span>My Sanctuary</span>
            </button>
          </nav>

          {/* User Profile or Sign In */}
          <div className="flex items-center gap-2">
            {user && profile ? (
              <div className="flex items-center gap-2">
                <PenNameBadge
                  penName={profile.pen_name}
                  avatarColor={profile.avatar_color}
                  size="sm"
                />
                <button
                  onClick={signOut}
                  className="p-1.5 text-ink-100 hover:text-rosewood-600 hover:bg-parchment-200 rounded-lg transition"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSignInModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-parchment-200 hover:bg-parchment-300 text-ink-900 border border-parchment-300 rounded-xl text-xs font-medium transition cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1">
        {activeTab === 'public' ? (
          <PublicFeedPage />
        ) : (
          <LibraryPage />
        )}
      </main>

      {/* Sanctuary Footer */}
      <footer className="mt-16 border-t border-parchment-200 bg-parchment-50/70 py-8 text-center text-xs text-ink-100">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-sage-600" />
            <span>Encrypted at rest & in transit. Pseudonymous by default.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHelplineOpen(true)}
              className="inline-flex items-center gap-1 text-rosewood-700 hover:text-rosewood-800 font-medium transition cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-rosewood-600" />
              <span>Need Support? Free Crisis Helplines</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />

      <HelplineModal
        isOpen={isHelplineOpen}
        onClose={() => setIsHelplineOpen(false)}
      />
    </div>
  );
};
export default App;
