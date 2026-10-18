import React, { useState, useEffect } from 'react';
import { BookOpen, Feather } from 'lucide-react';
import { Note } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PublicNoteCard } from '../components/feed/PublicNoteCard';
import { FeedFilter } from '../components/feed/FeedFilter';
import { ResponseComposer } from '../components/feed/ResponseComposer';
import { ReportModal } from '../components/feed/ReportModal';
import { SignInModal } from '../components/auth/SignInModal';
import promptsData from '../data/prompts.json';

const DEMO_NOTES_KEY = 'unsent_library_demo_notes';

const INITIAL_PUBLIC_NOTES: Note[] = [
  {
    id: 'public-seed-1',
    user_id: 'seed-user-1',
    shelf_id: null,
    title: 'The subway window in October',
    content:
      'I still catch myself looking for your reflection in subway windows whenever the train decelerates between 14th and 8th. I don\'t miss the person who left without turning back, but I miss the person who once believed I was courageous enough to start over in this city. You never knew that your confidence in me was the only thing standing between me and giving up.',
    prompt_id: 'prompt-5',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    profiles: {
      id: 'seed-user-1',
      pen_name: 'Silent Quill',
      avatar_color: '#4a5d4e',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'public-seed-2',
    user_id: 'seed-user-2',
    shelf_id: null,
    title: 'The blue porcelain mugs',
    content:
      'You always drank your tea lukewarm because you spent every morning making sure everyone else\'s cup was poured and sweet before you sat down. I bought a set of blue porcelain mugs yesterday and cried in the kitchen aisle because I never once said "sit down, Mom, let me pour yours." I hope wherever you are now, tea stays warm for you as long as you want.',
    prompt_id: 'prompt-7',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    profiles: {
      id: 'seed-user-2',
      pen_name: 'Velvet Sparrow',
      avatar_color: '#8c4a3b',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'public-seed-3',
    user_id: 'seed-user-3',
    shelf_id: null,
    title: 'Laughing at the dinner table',
    content:
      'I wanted to tell you how deeply it bruised when you made a joke out of the things that made my eyes light up. Instead I forced a smile and laughed with the rest of the table so nobody would think I was "too sensitive." I am finally unlearning the habit of shrinking myself to fit inside rooms that were never built for depth.',
    prompt_id: 'prompt-3',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    profiles: {
      id: 'seed-user-3',
      pen_name: 'Amber Nomad',
      avatar_color: '#b48a47',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'public-seed-4',
    user_id: 'seed-user-4',
    shelf_id: null,
    title: 'To the stranger on the bench in the rain',
    content:
      'You handed me your extra umbrella on a Tuesday afternoon when the rain was coming down sideways and said, "Hold on, the storm always breaks eventually." You walked away into the deluge before I could say a word. You had no idea what I was carrying that afternoon. You kept someone alive with seven words.',
    prompt_id: 'prompt-8',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
    profiles: {
      id: 'seed-user-4',
      pen_name: 'Copper Whisper',
      avatar_color: '#34495e',
      created_at: new Date().toISOString(),
    },
  },
];

export const PublicFeedPage: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');

  // Modals
  const [respondingNote, setRespondingNote] = useState<Note | null>(null);
  const [reportingNote, setReportingNote] = useState<Note | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const fetchPublicNotes = async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      const raw = localStorage.getItem(DEMO_NOTES_KEY);
      let localNotes: Note[] = raw ? JSON.parse(raw) : [];

      // If user hasn't created or stored any notes yet, seed demo public notes
      if (localNotes.length === 0) {
        localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(INITIAL_PUBLIC_NOTES));
        localNotes = INITIAL_PUBLIC_NOTES;
      }

      // Filter only public and clean notes
      const publicOnly = localNotes.filter(
        (n) => n.is_public && n.moderation_status === 'clean'
      );
      setNotes(publicOnly);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*, profiles:user_id(id, pen_name, avatar_color)')
      .eq('is_public', true)
      .eq('moderation_status', 'clean')
      .order('published_at', { ascending: false });

    if (!error && data) {
      setNotes(data as Note[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPublicNotes();
  }, []);

  // Filter notes based on category, search, and sort
  const filteredNotes = notes.filter((n) => {
    // Search query match in title, content, or pen name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (n.title || '').toLowerCase().includes(q);
      const contentMatch = n.content.toLowerCase().includes(q);
      const penNameMatch = (n.profiles?.pen_name || '').toLowerCase().includes(q);
      if (!titleMatch && !contentMatch && !penNameMatch) return false;
    }

    // Category match via prompt
    if (selectedCategory !== 'All') {
      const prompt = promptsData.find((p) => p.id === n.prompt_id);
      if (!prompt || prompt.category !== selectedCategory) {
        return false;
      }
    }

    return true;
  });

  // Sort notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    const dateA = new Date(a.published_at || a.created_at).getTime();
    const dateB = new Date(b.published_at || b.created_at).getTime();
    return sortBy === 'latest' ? dateB - dateA : dateA - dateB;
  });

  const handleStartResponse = (note: Note) => {
    if (!user) {
      setIsSignInModalOpen(true);
      return;
    }
    setRespondingNote(note);
  };

  const handleNoteReported = () => {
    // If threshold reached or reported, re-fetch public notes
    fetchPublicNotes();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Editorial Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-parchment-200/70 border border-parchment-300 rounded-full text-xs text-sage-800 font-medium mb-3">
          <Feather className="w-3.5 h-3.5 text-sage-600" />
          <span>The Anonymous Sanctuary</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-ink-900 tracking-tight mb-3">
          The Library of Unsent Things
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 font-serif leading-relaxed italic">
          "The letters you carried across seasons but never mailed. Anonymously shared,
          kept for all who carry things in the quiet."
        </p>
      </div>

      {/* Filter and Search Bar */}
      <FeedFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Letters List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-ink-100 font-serif italic">
          Unfolding the letters from the shelves...
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="py-16 px-6 bg-white/70 border border-parchment-300 rounded-2xl text-center max-w-md mx-auto">
          <BookOpen className="w-8 h-8 mx-auto text-ink-100 mb-2 opacity-50" />
          <h3 className="font-serif text-base text-ink-900 font-medium">No letters found</h3>
          <p className="text-xs text-ink-100 mt-1 leading-relaxed">
            No unsent letters match your search criteria. Try choosing another category or clearing your search.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedNotes.map((note) => (
            <PublicNoteCard
              key={note.id}
              note={note}
              onRespond={handleStartResponse}
              onReport={(n) => setReportingNote(n)}
            />
          ))}
        </div>
      )}

      {/* Response Composer Modal */}
      {respondingNote && (
        <ResponseComposer
          isOpen={!!respondingNote}
          targetNoteId={respondingNote.id}
          targetNoteTitle={respondingNote.title || 'Untitled Letter'}
          targetPenName={respondingNote.profiles?.pen_name || 'Anonymous Writer'}
          onClose={() => setRespondingNote(null)}
          onResponseSent={() => {
            setRespondingNote(null);
            fetchPublicNotes();
          }}
        />
      )}

      {/* Report Modal */}
      {reportingNote && (
        <ReportModal
          isOpen={!!reportingNote}
          noteId={reportingNote.id}
          onClose={() => setReportingNote(null)}
          onReportSubmitted={() => {
            handleNoteReported();
            setReportingNote(null);
          }}
        />
      )}

      {/* Sign In Modal if guest tries to respond */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </div>
  );
};
