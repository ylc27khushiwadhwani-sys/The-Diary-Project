import React, { useEffect, useState } from "react";
import { BookOpen, Feather, Library, LogOut, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { PenNameBadge } from "./components/auth/PenNameBadge";
import { SignInModal } from "./components/auth/SignInModal";
import { HelplineModal } from "./components/safety/HelplineModal";
import { LandingPage } from "./pages/LandingPage";
import { ReadingRoomPage } from "./pages/ReadingRoomPage";
import { PublicFeedPage } from "./pages/PublicFeedPage";
import { LibraryPage } from "./pages/LibraryPage";
import { DoorsPage } from "./pages/DoorsPage";
import { PostboxPage, countUnseen } from "./pages/PostboxPage";
import { loadAuthorResponses } from "./components/library/AuthorInbox";
import { DustCanvas } from "./components/cinematic/DustCanvas";
import { EntrySequence } from "./components/cinematic/EntrySequence";
import { InkText } from "./components/cinematic/InkText";
import { VisitBadge } from "./components/cinematic/VisitBadge";
import { burstEmbers } from "./lib/motion";
import { currentHallHour } from "./lib/timeOfDay";

type Tab = "reading" | "library" | "postbox" | "study";

export const App: React.FC = () => {
  const { user, profile, loading, signOut, loginAsGuestDemo } = useAuth();
  const [activeTab, setActiveTabState] = useState<Tab>("reading");
  const setActiveTab = (tab: Tab) => {
    if (tab !== activeTab) burstEmbers();
    setDoorChosen(true);
    setActiveTabState(tab);
  };
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setIsSignInModalOpen(true);
  };
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);

  // After entering, the two doors come first; the rooms wait behind them.
  const [doorChosen, setDoorChosen] = useState(false);
  const [postboxUnseen, setPostboxUnseen] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    loadAuthorResponses(user.id).then((rows) => {
      if (!cancelled && rows) setPostboxUnseen(countUnseen(user.id, rows));
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // The hall is lit for the visitor's local hour; re-checked every ten minutes
  useEffect(() => {
    const apply = () =>
      document.documentElement.setAttribute("data-tod", currentHallHour());
    apply();
    const id = window.setInterval(apply, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  // The flow: landing first; once inside (signed in or guest), the rooms.
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col text-[#f3ece0] selection:bg-wax-crimson selection:text-white relative bg-[#0d0906]">
        <EntrySequence />
        <DustCanvas />
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Feather className="w-6 h-6 text-gold/60 animate-pulse" />
          </div>
        ) : (
          <main className="flex-1 relative z-10">
            <LandingPage onAuth={openAuth} onGuest={loginAsGuestDemo} />
          </main>
        )}
        <LandingFooter onOpenHelplines={() => setIsHelplineOpen(true)} />
        <SignInModal
          key={authMode}
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
          initialMode={authMode}
        />
        <HelplineModal
          isOpen={isHelplineOpen}
          onClose={() => setIsHelplineOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-[#f3ece0] selection:bg-wax-crimson selection:text-white relative bg-[#0d0906]">
      <EntrySequence />
      {/* Drifting dust that glows in the light shafts, plus ember bursts */}
      <DustCanvas />

      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-hairline bg-[#0d0906]/85 backdrop-blur-md">
        <VisitBadge />
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-2 sm:px-5 py-3.5">
          {/* Brand */}
          <div
            onClick={() => setActiveTab("reading")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div>
              <span className="font-serif text-lg sm:text-2xl italic tracking-wide whitespace-nowrap text-[#f3ece0] block leading-tight group-hover:text-gold transition">
                <InkText
                  text="The Paper Vault"
                  startDelay={0.2}
                  perLetter={0.06}
                />
              </span>
              <span className="label-caps text-[9px] hidden sm:block text-gold/70">
                Anonymous Literary Sanctuary
              </span>
            </div>
          </div>

          {/* Navigation Rooms */}
          <nav className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={() => setActiveTab("reading")}
              className={`flex items-center gap-2 px-2 sm:px-3.5 py-1.5 rounded-full text-xs font-serif whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "reading"
                  ? "bg-card text-gold border border-gold/40 shadow-candle"
                  : "text-[#9e9488] hover:text-[#f3ece0] hover:bg-card/60"
              }`}
            >
              <BookOpen className="hidden sm:block w-3.5 h-3.5 text-gold" />
              <span>
                <span className="sm:hidden">Reading</span>
                <span className="hidden sm:inline">The Reading Room</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("library")}
              className={`flex items-center gap-2 px-2 sm:px-3.5 py-1.5 rounded-full text-xs font-serif whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "library"
                  ? "bg-card text-gold border border-gold/40 shadow-candle"
                  : "text-[#9e9488] hover:text-[#f3ece0] hover:bg-card/60"
              }`}
            >
              <Library className="hidden sm:block w-3.5 h-3.5 text-gold" />
              <span>
                <span className="sm:hidden">Library</span>
                <span className="hidden sm:inline">The Grand Library</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("postbox")}
              className={`relative flex items-center gap-2 px-2 sm:px-3.5 py-1.5 rounded-full text-xs font-serif whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "postbox"
                  ? "bg-card text-gold border border-gold/40 shadow-candle"
                  : "text-[#9e9488] hover:text-[#f3ece0] hover:bg-card/60"
              }`}
            >
              <Mail className="hidden sm:block w-3.5 h-3.5 text-gold" />
              <span>
                <span className="sm:hidden">Postbox</span>
                <span className="hidden sm:inline">The Postbox</span>
              </span>
              {postboxUnseen > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-wax-crimson px-1 text-[9px] font-bold text-amber-50"
                  aria-label={`${postboxUnseen} sealed replies waiting`}
                >
                  {postboxUnseen}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("study")}
              className={`flex items-center gap-2 px-2 sm:px-3.5 py-1.5 rounded-full text-xs font-serif whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "study"
                  ? "bg-card text-gold border border-gold/40 shadow-candle"
                  : "text-[#9e9488] hover:text-[#f3ece0] hover:bg-card/60"
              }`}
            >
              <Feather className="hidden sm:block w-3.5 h-3.5 text-gold" />
              <span>
                <span className="sm:hidden">Study</span>
                <span className="hidden sm:inline">Your Study</span>
              </span>
            </button>
          </nav>

          {/* User Profile */}
          <div className="flex items-center gap-2">
            {profile && (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 [&_.truncate]:max-w-[44px] sm:[&_.truncate]:max-w-none">
                <PenNameBadge
                  penName={profile.pen_name}
                  avatarColor={profile.avatar_color}
                  size="sm"
                />
                <button
                  onClick={signOut}
                  className="p-1.5 text-[#9e9488] hover:text-red-400 hover:bg-card rounded-lg transition cursor-pointer"
                  title="Sign out of sanctuary"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main key={doorChosen ? activeTab : "doors"} className="flex-1 relative z-10 room-enter">
        {!doorChosen && profile ? (
          <DoorsPage
            penName={profile.pen_name}
            avatarColor={profile.avatar_color}
            onOpen={(room) => {
              setDoorChosen(true);
              setActiveTab(room);
            }}
          />
        ) : activeTab === "reading" ? (
          <ReadingRoomPage
            onEnterLibrary={() => setActiveTab("library")}
            onOpenStudy={() => setActiveTab("study")}
          />
        ) : activeTab === "library" ? (
          <PublicFeedPage />
        ) : activeTab === "postbox" ? (
          <PostboxPage onUnseenChange={setPostboxUnseen} />
        ) : (
          <LibraryPage />
        )}
      </main>

      <LandingFooter onOpenHelplines={() => setIsHelplineOpen(true)} />

      {/* Global Modals */}
      <SignInModal
        key={authMode}
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        initialMode={authMode}
      />

      <HelplineModal
        isOpen={isHelplineOpen}
        onClose={() => setIsHelplineOpen(false)}
      />
    </div>
  );
};

const LandingFooter: React.FC<{ onOpenHelplines: () => void }> = ({
  onOpenHelplines,
}) => (
  <footer className="border-t border-hairline px-6 py-12 text-center text-sm text-[#9e9488] relative z-10 bg-[#0d0906]/80 backdrop-blur-sm">
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-center gap-2 text-xs font-serif text-[#9e9488]">
        <ShieldCheck className="w-4 h-4 text-gold/70" />
        <span>Encrypted at rest & in transit • Pseudonymous by default</span>
      </div>

      <p className="text-xs leading-relaxed">
        Our library isn't a substitute for professional support. If you're
        struggling, please reach out to a{" "}
        <button
          onClick={onOpenHelplines}
          className="text-gold underline underline-offset-4 hover:text-gold-light transition cursor-pointer"
        >
          free & confidential helpline in your country
        </button>
        .
      </p>

      <p className="text-xs text-[#9e9488]/70">
        We only use your email to preserve your private library across devices.
        We never share it.
      </p>

      <p className="font-serif italic text-gold/80 text-base">
        Made with care for all who carry things in the quiet.
      </p>
    </div>
  </footer>
);

export default App;
