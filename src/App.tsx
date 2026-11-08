import {FlowerGiftPage} from "./components/gifts/FlowerGiftPage";
import {flowerTokenFromLocation,openFlowerGift} from "./lib/flowerGifts";
import { isAuthReturn } from "./utils/authReturn";
import React, { useEffect, useState } from "react";
import { BookOpen, Feather, Flower2, Library, LogOut, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { PenNameBadge } from "./components/auth/PenNameBadge";
import { SignInModal } from "./components/auth/SignInModal";
import { HelplineModal } from "./components/safety/HelplineModal";
import { LandingPage } from "./pages/LandingPage";
import { ReadingRoomPage } from "./pages/ReadingRoomPage";
import { PublicFeedPage } from "./pages/PublicFeedPage";
import { LibraryPage } from "./pages/LibraryPage";
import { GiftOpeningPage } from "./pages/GiftOpeningPage";
import { GuidelinesPage } from "./pages/GuidelinesPage";
import { giftFromLocation, GiftPayload } from "./lib/giftLink";
import { PostboxPage, countUnseen } from "./pages/PostboxPage";
import { ConnectedFlowerStudio } from "./components/gifts/ConnectedFlowerStudio";
import { loadAuthorResponses } from "./components/library/AuthorInbox";
import { DustCanvas } from "./components/cinematic/DustCanvas";
import { EntrySequence } from "./components/cinematic/EntrySequence";
import { InkText } from "./components/cinematic/InkText";
import { VisitBadge } from "./components/cinematic/VisitBadge";
import { burstEmbers } from "./lib/motion";
import { currentHallHour } from "./lib/timeOfDay";

type Tab = "reading" | "library" | "postbox" | "study" | "flowers";

export const App: React.FC = () => {
  const { user, profile, loading, signOut, loginAsGuestDemo } = useAuth();
  const [gift, setGift] = useState<GiftPayload | null>(() =>
    giftFromLocation(),
  );
  const [flowerToken,setFlowerToken]=useState<string|null>(()=>flowerTokenFromLocation());
  useEffect(() => {
    const onHash = () => {setGift(giftFromLocation());setFlowerToken(flowerTokenFromLocation());};
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const clearGift = () => {
    window.location.hash = "";
    setGift(null);
  };
  const [activeTab, setActiveTabState] = useState<Tab>("reading");
  const setActiveTab = (tab: Tab) => {
    if (tab !== activeTab) burstEmbers();
    setActiveTabState(tab);
  };
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setIsSignInModalOpen(true);
  };
  // A visitor holding a verified library card never needs the signup or
  // signin popups from the landing; they get one clear way back inside.
  const isCardHolder = !!(
    user &&
    !user.is_anonymous &&
    user.email !== "writer@unsent.local" &&
    user.email !== "anonymous@unsentlibrary.local"
  );
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  // After entering, the two doors come first; the rooms wait behind them.
  // The landing is the first page on every visit, signed in or not; the
  // brand leads back to it. "Step inside" enters the rooms.
  const [showLanding, setShowLanding] = useState(() => !isAuthReturn(window.location));
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('auth') === 'complete' && user && !user.is_anonymous) {
      url.searchParams.delete('auth');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  }, [user]);

  // Lets the sky (moon) sit lower inside the rooms on phones, clear of the
  // visit badge, while the landing keeps it high.
  useEffect(() => {
    document.body.dataset.view = showLanding || !user ? "landing" : "rooms";
    document.body.dataset.room = activeTab;
  }, [showLanding, user, activeTab]);
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

  if (flowerToken) return <FlowerGiftPage key={flowerToken} token={flowerToken} read={openFlowerGift} onExit={()=>{window.history.replaceState(null,"",window.location.pathname);setFlowerToken(null);setShowLanding(true)}}/>;

  // A dedicated letter opens for whoever holds the link, signed in or not.
  if (gift) {
    return (
      <div className="min-h-screen text-cream relative bg-background">
        <GiftOpeningPage gift={gift} onEnterVault={clearGift} />
      </div>
    );
  }

  // The flow: landing first; once inside (signed in or guest), the rooms.
  // Clicking the brand brings the landing back without signing anyone out.
  if (!user || showLanding) {
    return (
      <div className="min-h-screen flex flex-col text-cream selection:bg-wax-crimson selection:text-white relative bg-background">
        <EntrySequence />
        <DustCanvas />
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Feather className="w-6 h-6 text-gold/60 animate-pulse" />
          </div>
        ) : (
          <main className="flex-1 relative z-10">
            <LandingPage
              onAuth={openAuth}
              onGuest={async () => { if (!user) await loginAsGuestDemo(); setShowLanding(false); }}
              isSignedIn={isCardHolder}
              onEnter={() => setShowLanding(false)}
            />
          </main>
        )}
        <LandingFooter
          onOpenHelplines={() => setIsHelplineOpen(true)}
          onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        />
        <SignInModal
          key={authMode}
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
          initialMode={authMode}
          onAuthenticated={() => { setActiveTabState("reading"); setShowLanding(false); }}
        />
        <HelplineModal
          isOpen={isHelplineOpen}
          onClose={() => setIsHelplineOpen(false)}
        />
        {isGuidelinesOpen && (
          <GuidelinesOverlay onClose={() => setIsGuidelinesOpen(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-cream selection:bg-wax-crimson selection:text-white relative bg-background">
      <EntrySequence />
      {/* Drifting dust that glows in the light shafts, plus ember bursts */}
      {activeTab !== "library" && activeTab !== "study" && <DustCanvas />}

      <SignInModal key="finish-guest-password" isOpen={!!user?.email_confirmed_at && !!user?.user_metadata?.needs_password} initialMode="password" onClose={() => {}} onAuthenticated={() => setActiveTabState("reading")} />
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-hairline bg-background/85 backdrop-blur-md">
        <VisitBadge />
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-2 sm:px-5 py-3.5">
          {/* Brand */}
          <div
            onClick={() => setShowLanding(true)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div>
              <span className="font-serif text-lg sm:text-2xl italic tracking-wide whitespace-nowrap text-cream block leading-tight group-hover:text-gold transition">
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
                  : "text-muted hover:text-cream hover:bg-card/60"
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
                  : "text-muted hover:text-cream hover:bg-card/60"
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
                  : "text-muted hover:text-cream hover:bg-card/60"
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
                  : "text-muted hover:text-cream hover:bg-card/60"
              }`}
            >
              <Feather className="hidden sm:block w-3.5 h-3.5 text-gold" />
              <span>
                <span className="sm:hidden">Study</span>
                <span className="hidden sm:inline">Your Study</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("flowers")}
              aria-label="Gift a letter"
              className={`flex items-center gap-2 px-2 sm:px-3.5 py-1.5 rounded-full text-xs font-serif whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "flowers"
                  ? "bg-card text-gold border border-gold/40 shadow-candle"
                  : "text-muted hover:text-cream hover:bg-card/60"
              }`}
            >
              <Flower2 className="hidden sm:block w-3.5 h-3.5 text-gold" />
              <span>
                <span className="sm:hidden">Gift</span>
                <span className="hidden sm:inline">Gift a letter</span>
              </span>
            </button>
          </nav>

          {/* Daylight lamp + user profile */}
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
                  className="p-1.5 text-muted hover:text-red-400 hover:bg-card rounded-lg transition cursor-pointer"
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
      {/* No door lobby: stepping inside lands straight in the rooms. */}
      <main key={activeTab} className="flex-1 relative z-10 room-enter">
        {activeTab === "reading" ? (
          <ReadingRoomPage
            onEnterLibrary={() => setActiveTab("library")}
            onOpenStudy={() => setActiveTab("study")}
          />
        ) : activeTab === "library" ? (
          <PublicFeedPage />
        ) : activeTab === "postbox" ? (
          <PostboxPage onUnseenChange={setPostboxUnseen} />
        ) : activeTab === "flowers" ? (
          <ReadingRoomPage
            onEnterLibrary={() => setActiveTab("library")}
            onOpenStudy={() => setActiveTab("study")}
          />
        ) : (
          <LibraryPage />
        )}
      </main>

      {/* Flowers & letters gets its own room, opening over whatever is under it */}
      {activeTab === "flowers" && (
        <ConnectedFlowerStudio onClose={() => setActiveTab("study")} />
      )}

      <LandingFooter
          onOpenHelplines={() => setIsHelplineOpen(true)}
          onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        />

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
      {isGuidelinesOpen && (
        <GuidelinesOverlay onClose={() => setIsGuidelinesOpen(false)} />
      )}
    </div>
  );
};

/* Full-screen overlay for the Community Guidelines & Safety page. */
const GuidelinesOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="guidelines-overlay fixed inset-0 z-[300] overflow-y-auto bg-background">
    <div className="sticky top-0 z-[310] flex justify-end px-4 py-3 bg-background/90 backdrop-blur-sm">
      <button
        onClick={onClose}
        aria-label="Close guidelines"
        className="px-4 py-2 rounded-full bg-wood-800/90 border border-amber-700/40 text-amber-100 font-serif text-xs hover:bg-wood-700 transition cursor-pointer"
      >
        Close
      </button>
    </div>
    <GuidelinesPage />
  </div>
);

const LandingFooter: React.FC<{
  onOpenHelplines: () => void;
  onOpenGuidelines: () => void;
}> = ({ onOpenHelplines, onOpenGuidelines }) => (
  <footer className="vault-site-footer border-t border-hairline px-6 py-12 text-center text-sm text-muted relative z-10 bg-background/80 backdrop-blur-sm">
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-center gap-2 text-xs font-serif text-muted">
        <ShieldCheck className="w-4 h-4 text-gold/70" />
        <span>Write under a pen name • Choose private or public</span>
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

      <div className="flex items-center justify-center gap-2 text-xs font-serif">
        <button
          onClick={onOpenGuidelines}
          className="text-gold underline underline-offset-4 hover:text-gold-light transition cursor-pointer"
        >
          Community Guidelines &amp; Safety
        </button>
        <span className="text-muted/60">
          - writing, sharing, and reporting
        </span>
      </div>

      <p className="text-xs text-muted/70">
        Use a verified email to sign in to your library across devices.
        Your email is not shown on your public letters.
      </p>

      <p className="font-serif italic text-gold/80 text-base">
        Made with care for all who carry things in the quiet.
      </p>
    </div>
  </footer>
);

export default App;
