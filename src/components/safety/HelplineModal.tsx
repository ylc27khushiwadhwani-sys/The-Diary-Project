import React, { useState } from 'react';
import { Phone, Globe, MessageSquare, X, Shield } from 'lucide-react';
import helplinesData from '../../data/helplines.json';
import { HelplineResource } from '../../types/database';
import { WaxSeal } from '../library/WaxSeal';

interface HelplineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelplineModal: React.FC<HelplineModalProps> = ({ isOpen, onClose }) => {
  const helplines: HelplineResource[] = helplinesData;
  const [selectedCountry, setSelectedCountry] = useState<string>('India');

  if (!isOpen) return null;

  const countries = Array.from(new Set(helplines.map((h) => h.country)));
  const filtered = helplines.filter((h) => h.country === selectedCountry || h.country === 'International / Global');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg parchment-sheet border border-amber-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl text-left overflow-hidden text-wood-950">
        <div className="scroll-roll-top -mx-4 -mt-6 mb-4" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-wood-600 hover:text-wood-950 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-4 pb-3 border-b border-amber-900/20">
          <WaxSeal color="crimson" size="md" icon="flame" />
          <div>
            <h3 className="font-cinzel text-lg font-bold text-wood-950">
              You are heard, and you are not alone
            </h3>
            <p className="font-cormorant text-xs text-wood-800 italic">Your letter rests safe in your private sanctuary</p>
          </div>
        </div>

        <div className="bg-amber-50/80 border border-amber-900/20 rounded-xl p-4 mb-4 text-xs text-wood-900 leading-relaxed space-y-1.5 font-cormorant text-sm">
          <p className="italic">
            Writing down raw, painful thoughts takes immense courage. Because your letter touches on deep distress or self-harm, we have placed it <strong className="font-cinzel font-bold text-wood-950 not-italic">safely upon your private shelf</strong> rather than releasing it to the open reading hall.
          </p>
          <p className="text-emerald-900 font-cinzel text-xs font-semibold flex items-center gap-1.5 pt-1.5 border-t border-amber-900/10">
            <Shield className="w-3.5 h-3.5 text-emerald-700" />
            <span>Nothing was erased. Your words remain yours alone.</span>
          </p>
        </div>

        <div className="mb-3">
          <label className="block text-[10px] font-cinzel uppercase tracking-widest text-wood-700 font-bold mb-1.5">
            Free & Confidential Crisis Support
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {countries.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCountry(c)}
                className={`px-3 py-1 rounded-full text-xs font-cinzel transition cursor-pointer ${
                  selectedCountry === c
                    ? 'bg-wood-900 text-amber-100 font-bold shadow-xs'
                    : 'bg-amber-900/10 text-wood-800 hover:bg-amber-900/20'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-amber-50/90 border border-amber-900/20 rounded-xl space-y-1 text-xs"
            >
              <div className="flex items-center justify-between font-cinzel font-bold text-wood-950">
                <span>{item.name}</span>
                <span className="text-[10px] text-amber-800 font-normal italic font-cormorant">{item.hours}</span>
              </div>
              <div className="flex items-center gap-3 text-wood-800 font-mono text-[11px] pt-0.5">
                <a
                  href={`tel:${item.phone}`}
                  className="flex items-center gap-1 text-wax-crimson font-bold hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  <span>{item.phone}</span>
                </a>
                {item.sms && (
                  <span className="flex items-center gap-1 text-wood-700">
                    <MessageSquare className="w-3 h-3 text-amber-700" />
                    <span>SMS: {item.sms}</span>
                  </span>
                )}
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-amber-800 hover:text-wood-950 ml-auto"
                >
                  <Globe className="w-3 h-3" />
                  <span>Website</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-amber-900/20 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-wood-900 hover:bg-wood-800 text-amber-100 rounded-full text-xs font-cinzel font-bold transition cursor-pointer"
          >
            I Understand
          </button>
        </div>

        <div className="scroll-roll-bottom -mx-4 -mb-6 mt-3" />
      </div>
    </div>
  );
};
