import React, { useState } from 'react';
import { Heart, MessageSquare, Flag, BookOpen, ChevronDown, ChevronUp, Type, Feather } from 'lucide-react';
import { Note } from '../../types/database';
import { WaxSeal } from '../library/WaxSeal';
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
  const [handwritingFont, setHandwritingFont] = useState(false);

  const prompt = promptsData.find((p) => p.id === note.prompt_id);
  const authorPenName = note.profiles?.pen_name || 'Anonymous Writer';

  const isLong = note.content.length > 360;
  const displayedContent = isLong && !isExpanded
    ? `${note.content.slice(0, 360)}...`
    : note.content;

  const formattedDate = new Date(note.published_at || note.created_at).toLocaleDateString(
    undefined,
    { month: 'long', day: 'numeric', year: 'numeric' }
  );

  return (
    <article className="parchment-sheet rounded-xl shadow-parchment overflow-hidden transition-all duration-300 hover:shadow-candle text-left flex flex-col justify-between">
      {/* Top Scroll Roll */}
      <div className="scroll-roll-top mx-2 mt-1.5" />

      {/* Main Letter Content Area */}
      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
        <div>
          {/* Top Letterhead Bar */}
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-amber-900/20">
            <div className="flex items-center gap-3">
              <WaxSeal color="crimson" size="md" icon="crest" />
              <div>
                <span className="font-cinzel text-[10px] tracking-widest uppercase text-wood-700 block">
                  The Library of Unsent Things
                </span>
                <span className="font-script text-xl text-wood-950 leading-none">
                  {authorPenName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-cinzel text-xs text-wood-700">
                {formattedDate}
              </span>

              {/* Font Script Toggle */}
              <button
                type="button"
                onClick={() => setHandwritingFont(!handwritingFont)}
                className="p-1.5 text-wood-600 hover:text-wood-950 rounded transition"
                title={handwritingFont ? "Switch to Book Serif" : "Switch to Quill Handwriting"}
              >
                <Type className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onReport(note)}
                className="p-1.5 text-wood-400 hover:text-red-700 rounded transition"
                title="Report note"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Prompt Ribbon Tag if applicable */}
          {prompt && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-cinzel font-medium text-amber-900 bg-amber-800/10 border border-amber-800/25 px-3 py-1 rounded-full">
                <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                <span>Prompt: {prompt.title}</span>
              </span>
            </div>
          )}

          {/* Note Title */}
          {note.title && (
            <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-wood-950 mb-3 tracking-tight leading-snug">
              {note.title}
            </h3>
          )}

          {/* Note Body Text */}
          <div
            className={`text-wood-900 leading-relaxed whitespace-pre-wrap select-text transition-all ${
              handwritingFont
                ? 'font-script text-2xl md:text-3xl font-normal leading-loose'
                : 'font-cormorant text-lg md:text-xl font-medium'
            }`}
          >
            {displayedContent}
          </div>

          {isLong && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-cinzel text-amber-900 hover:text-wood-950 font-semibold mt-3 inline-flex items-center gap-1 cursor-pointer transition"
            >
              {isExpanded ? (
                <>
                  Roll up letter <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Unroll full letter <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Letter Footer: Signoff & Actions */}
        <div className="pt-6 mt-6 border-t border-amber-900/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-wood-700 font-cinzel text-xs">
              <Feather className="w-3.5 h-3.5 text-amber-800" />
              <span className="italic">
                ~ Unspoken letter resting in the archive ~
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResponses(!showResponses)}
                className="inline-flex items-center gap-1.5 font-cinzel text-xs text-wood-800 hover:text-wood-950 font-semibold transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-800" />
                <span>
                  {showResponses ? 'Hide Responses' : 'Read Responses'}
                </span>
              </button>

              {note.allow_responses && (
                <button
                  onClick={() => onRespond(note)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-wood-900 hover:bg-wood-800 text-amber-100 rounded-full font-cinzel text-xs font-semibold transition shadow-candle border border-amber-600/30 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 text-red-400" />
                  <span>Write a Response</span>
                </button>
              )}
            </div>
          </div>

          {/* Expandable Threaded Responses */}
          {showResponses && (
            <div className="mt-5 pt-4 border-t border-dashed border-amber-900/25">
              <ThreadedResponses noteId={note.id} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Scroll Roll */}
      <div className="scroll-roll-bottom mx-2 mb-1.5" />
    </article>
  );
};
