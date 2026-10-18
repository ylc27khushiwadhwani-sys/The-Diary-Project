import React, { useState } from 'react';
import { Heart, MessageSquare, Flag, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Note } from '../../types/database';
import { PenNameBadge } from '../auth/PenNameBadge';
import { ThreadedResponses } from './ThreadedResponses';
import promptsData from '../../data/prompts.json';

interface PublicNoteCardProps {
  note: Note;
  onRespond: (note: Note) => void;
  onReport: (note: Note) => void;
}

export const PublicNoteCard: React.FC<PublicNoteCardProps> = ({
  note,
  onRespond,
  onReport,
}) => {
  const [showResponses, setShowResponses] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const prompt = promptsData.find((p) => p.id === note.prompt_id);
  const authorPenName = note.profiles?.pen_name || 'Anonymous Writer';
  const authorAvatarColor = note.profiles?.avatar_color;

  const isLong = note.content.length > 320;
  const displayedContent = isLong && !isExpanded
    ? `${note.content.slice(0, 320)}...`
    : note.content;

  const formattedDate = new Date(note.published_at || note.created_at).toLocaleDateString(
    undefined,
    { month: 'short', day: 'numeric', year: 'numeric' }
  );

  return (
    <article className="bg-white/90 border border-parchment-300 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-parchment-400 transition flex flex-col justify-between text-left">
      <div>
        {/* Top bar: Pen Name & Date & Report */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <PenNameBadge penName={authorPenName} avatarColor={authorAvatarColor} size="sm" />
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-100">{formattedDate}</span>
            <button
              onClick={() => onReport(note)}
              className="p-1 text-ink-100 hover:text-rosewood-600 rounded transition"
              title="Report note"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Prompt Tag */}
        {prompt && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage-800 bg-sage-50 border border-sage-200 px-2.5 py-0.5 rounded-full">
              <BookOpen className="w-3 h-3 text-sage-600" />
              <span>Prompt: {prompt.title}</span>
            </span>
          </div>
        )}

        {/* Note Title */}
        {note.title && (
          <h3 className="font-serif text-lg sm:text-xl font-medium text-ink-900 mb-2 leading-snug">
            {note.title}
          </h3>
        )}

        {/* Note Content */}
        <div className="font-serif text-sm text-ink-800 leading-relaxed whitespace-pre-wrap">
          {displayedContent}
        </div>

        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-sage-700 hover:text-sage-850 font-medium mt-2 inline-flex items-center gap-1 cursor-pointer"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Read full letter <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Footer bar */}
      <div className="pt-4 mt-4 border-t border-parchment-200">
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => setShowResponses(!showResponses)}
            className="inline-flex items-center gap-1.5 text-ink-600 hover:text-ink-900 font-medium transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-sage-600" />
            <span>
              {showResponses ? 'Hide Responses' : 'Read Letters in Response'}
            </span>
          </button>

          {note.allow_responses && (
            <button
              onClick={() => onRespond(note)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-parchment-100 hover:bg-parchment-200 text-ink-800 rounded-xl font-medium transition border border-parchment-300 shadow-2xs text-xs cursor-pointer"
            >
              <Heart className="w-3 h-3 text-rosewood-600" />
              <span>Write a Response</span>
            </button>
          )}
        </div>

        {/* Expandable threaded responses */}
        {showResponses && (
          <div className="mt-3">
            <ThreadedResponses noteId={note.id} />
          </div>
        )}
      </div>
    </article>
  );
};
