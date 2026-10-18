import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import promptsData from '../../data/prompts.json';
import { Prompt } from '../../types/database';

interface PromptSelectorProps {
  onSelectPrompt: (prompt: Prompt) => void;
}

export const PromptSelector: React.FC<PromptSelectorProps> = ({ onSelectPrompt }) => {
  const prompts: Prompt[] = promptsData;

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-sage-600" />
        <h3 className="font-serif text-sm font-medium text-ink-900 tracking-wide">
          Need a spark? Writing Prompts
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prompts.slice(0, 4).map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectPrompt(p)}
            className="group cursor-pointer p-3.5 bg-white/70 hover:bg-white border border-parchment-200 hover:border-sage-600/40 rounded-xl transition duration-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider text-sage-700 font-medium bg-sage-100/60 px-2 py-0.5 rounded-full inline-block mb-1.5">
                {p.category}
              </span>
              <h4 className="font-serif text-sm font-medium text-ink-900 group-hover:text-sage-700 transition">
                {p.title}
              </h4>
              <p className="text-xs text-ink-100 mt-1 line-clamp-2 leading-relaxed">
                {p.description}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-sage-600 font-medium mt-2 opacity-80 group-hover:opacity-100 transition">
              <span>Write from this</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
