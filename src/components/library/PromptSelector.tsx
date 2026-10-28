import React from 'react';
import { Sparkles, ArrowRight, Feather } from 'lucide-react';
import promptsData from '../../data/prompts.json';
import { Prompt } from '../../types/database';

interface PromptSelectorProps {
  onSelectPrompt: (prompt: Prompt) => void;
}

export const PromptSelector: React.FC<PromptSelectorProps> = ({ onSelectPrompt }) => {
  const prompts: Prompt[] = promptsData;

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 mb-1.5">
        <Sparkles className="w-4 h-4 text-gold" />
        <span className="label-caps text-[10px]">Whispers from the Archive • Writing Prompts</span>
      </div>
      <p className="font-body text-xs text-[#9e9488] italic mb-3">
        Not sure where to begin? Choose a whisper - it opens a blank letter with a title waiting for you.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prompts.slice(0, 4).map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectPrompt(p)}
            className="group cursor-pointer p-4 parchment-sheet rounded-xl border border-amber-800/30 hover:shadow-candle transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-serif uppercase tracking-wider text-amber-900 font-bold bg-amber-900/10 px-2 py-0.5 rounded-full inline-block mb-1.5 border border-amber-900/20">
                {p.category}
              </span>
              <h4 className="font-serif text-sm font-bold text-wood-950 group-hover:text-amber-900 transition leading-snug">
                {p.title}
              </h4>
              <p className="font-body text-xs text-wood-900/80 mt-1 line-clamp-2 leading-relaxed italic">
                "{p.description}"
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-serif text-amber-900 font-semibold mt-3 pt-2 border-t border-amber-900/15 group-hover:text-wood-950 transition">
              <Feather className="w-3 h-3 text-amber-800" />
              <span>Dip quill & write</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition text-amber-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
