import React from 'react';
import { Note } from '../../types/database';
import { getLetterStyle, LETTER_FONTS } from '../../utils/letterStyle';
export const OpenBookCard: React.FC<{note:Note;onOpen:(note:Note)=>void}> = ({note,onOpen}) => {
  const style=getLetterStyle(note.tags);
  return <button type="button" className="reading-open-book" onClick={()=>onOpen(note)} aria-label={`Read ${note.title || 'Untitled letter'}`}>
    <span className="rob-left"><span className="rob-dedication">{note.title || 'An unsent story'}</span><span className="rob-author">{style.from || note.profiles?.pen_name || 'anonymous'}</span></span>
    <span className="rob-right" style={{fontFamily:LETTER_FONTS[style.font].family}}><span className="rob-excerpt">{note.content}</span><span className="rob-read">Open to read →</span></span>
  </button>;
};
