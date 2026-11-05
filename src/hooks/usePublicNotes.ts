import { useState } from "react";
import { Note } from "../types/database";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { INITIAL_PUBLIC_NOTES, PUBLIC_FEED_DEMO_KEY } from "../data/seedNotes";
import { publicNotesOrSamples } from "../services/publicFeed";
import { useCancellableLoad } from "./useCancellableLoad";

const DEMO_NOTES_KEY = PUBLIC_FEED_DEMO_KEY;

/** Supabase pages for the public shelf so the library scales past any seed. */
const PAGE_SIZE = 120;

const loadDemoNotes = (): Note[] => {
  const raw = localStorage.getItem(DEMO_NOTES_KEY);
  let localNotes: Note[] = raw ? JSON.parse(raw) : [];
  if (localNotes.length === 0) {
    localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(INITIAL_PUBLIC_NOTES));
    localNotes = INITIAL_PUBLIC_NOTES;
  }
  return localNotes.filter(
    (n) => n.is_public && n.moderation_status === "clean",
  );
};

const fetchPage = async (from: number): Promise<Note[] | null> => {
  const { data, error } = await supabase
    .from("notes")
    .select("*, profiles:user_id(id, pen_name, avatar_color)")
    .eq("is_public", true)
    .eq("moderation_status", "clean")
    .order("published_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error || !data) return null;
  return data as Note[];
};

export interface PublicNotesState {
  notes: Note[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  refetch: () => void;
  loadMore: () => void;
  setNotes: (notes: Note[]) => void;
}

/**
 * Shared public-shelf loader for the Reading Room and the Grand Library.
 * Demo mode reads browser-local seeds (unchanged legacy behavior). Against
 * Supabase it pages 120 letters at a time; `loadMore` unshelves the next page.
 */
export const usePublicNotes = (): PublicNotesState => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const { loading, refetch } = useCancellableLoad(
    async (): Promise<Note[] | null> => {
      if (!isSupabaseConfigured) {
        setHasMore(false);
        return loadDemoNotes();
      }
      const first = await fetchPage(0);
      if (first === null) return null;
      setHasMore(first.length === PAGE_SIZE);
      return publicNotesOrSamples(first);
    },
    [],
    setNotes,
  );

  const loadMore = () => {
    if (!isSupabaseConfigured || loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchPage(notes.length).then((page) => {
      setLoadingMore(false);
      if (!page) return;
      setHasMore(page.length === PAGE_SIZE);
      if (page.length > 0) {
        const seen = new Set(notes.map((n) => n.id));
        setNotes([...notes, ...page.filter((n) => !seen.has(n.id))]);
      }
    });
  };

  return { notes, loading, loadingMore, hasMore, refetch, loadMore, setNotes };
};
