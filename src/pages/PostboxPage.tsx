import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MailOpen, RefreshCw } from "lucide-react";
import { ResponseLetter } from "../types/database";
import { useAuth } from "../contexts/AuthContext";
import {
  loadAuthorResponses,
  getSeenResponseIds,
  markSeen,
} from "../components/library/AuthorInbox";
import { useCancellableLoad } from "../hooks/useCancellableLoad";
import { Librarian } from "../components/library/Librarian";
import { WaxSeal } from "../components/library/WaxSeal";

type EnrichedResponse = ResponseLetter & { note_title?: string };

interface PostboxPageProps {
  onUnseenChange: (count: number) => void;
}

export const countUnseen = (
  userId: string,
  responses: EnrichedResponse[],
): number => {
  const seen = getSeenResponseIds(userId);
  return responses.filter((r) => !seen.has(r.id)).length;
};

/** Sample-letter replies never arrive, and the demo path stores them locally. */
export const loadPostbox = loadAuthorResponses;

/**
 * The Postbox: replies to your letters arrive as sealed envelopes. Breaking
 * the seal is the moment. Nothing here is public - these are for you only.
 */
export const PostboxPage: React.FC<PostboxPageProps> = ({
  onUnseenChange,
}) => {
  const { user } = useAuth();
  const [responses, setResponses] = useState<EnrichedResponse[]>([]);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const { loading, refetch } = useCancellableLoad(
    () => (user ? loadAuthorResponses(user.id) : Promise.resolve(null)),
    [user],
    (rows) => {
      const list = rows ?? [];
      setResponses(list);
      if (user) onUnseenChange(countUnseen(user.id, list));
    },
  );

  const openEnvelope = (id: string) => {
    if (!user) return;
    setOpenIds((prev) => new Set(prev).add(id));
    const seen = getSeenResponseIds(user.id).add(id);
    markSeen(user.id, seen);
    onUnseenChange(countUnseen(user.id, responses));
  };

  const greeting = useMemo(() => {
    if (responses.length === 0)
      return "Nothing in the postbox yet. When a stranger answers one of your letters, it arrives here - sealed.";
    const unseen = user ? countUnseen(user.id, responses) : 0;
    return unseen > 0
      ? `${unseen} sealed ${unseen === 1 ? "envelope" : "envelopes"} waiting. I didn't read a word - that's not my job.`
      : "Every envelope here has been opened. The postbox remembers them all.";
  }, [responses, user]);

  return (
    <div className="relative min-h-screen text-amber-100">
      <div className="candle-glow absolute inset-0 pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <Librarian line={greeting} className="justify-center mb-8" />

        <div className="flex items-center justify-between mb-6">
          <span className="label-caps">The Postbox</span>
          <button
            type="button"
            onClick={refetch}
            className="inline-flex items-center gap-1.5 font-body text-xs text-[#9e9488] hover:text-gold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check for new letters
          </button>
        </div>

        {loading ? (
          <p className="text-center py-16 font-body text-sm italic text-[#9e9488]">
            Checking the postbox...
          </p>
        ) : responses.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-hairline bg-card/60">
            <MailOpen className="w-6 h-6 text-gold/50 mx-auto mb-3" />
            <p className="font-serif italic text-lg text-[#cbbfa8]">
              An empty postbox is just a promise not yet kept.
            </p>
            <p className="mt-2 font-body text-xs text-[#9e9488]">
              Release a letter to the public shelf and leave the door open for
              replies.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {responses.map((r, i) => {
              const isOpen = openIds.has(r.id);
              const unseen = user ? !getSeenResponseIds(user.id).has(r.id) : false;
              return (
                <motion.li
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  {isOpen ? (
                    <div className="postbox-letter">
                      <p className="font-body text-[11px] uppercase tracking-[0.18em] text-gold/80 mb-2">
                        Answering "{r.note_title}"
                      </p>
                      <p className="font-serif text-lg leading-relaxed text-[#f3ece0] whitespace-pre-line">
                        {r.content}
                      </p>
                      <p className="mt-3 font-body text-xs italic text-[#9e9488]">
                        - {r.profiles?.pen_name || "A stranger"}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openEnvelope(r.id)}
                      className="postbox-envelope"
                      aria-label={`Break the seal on a reply to ${r.note_title}`}
                    >
                      <WaxSeal
                        color={unseen ? "crimson" : "gold"}
                        size="md"
                        icon="quill"
                      />
                      <span className="text-left">
                        <span className="block font-serif text-base text-[#f3ece0]">
                          A sealed reply to "{r.note_title}"
                        </span>
                        <span className="block font-body text-xs italic text-[#9e9488]">
                          from {r.profiles?.pen_name || "a stranger"} - break
                          the seal to read
                        </span>
                      </span>
                    </button>
                  )}
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
