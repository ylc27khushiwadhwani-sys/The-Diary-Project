import React, { useState } from 'react';
import { HeartHandshake, Phone, Globe, MessageSquare, X, Shield } from 'lucide-react';
import helplinesData from '../../data/helplines.json';
import { HelplineResource } from '../../types/database';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-parchment-50 border border-parchment-300 rounded-2xl p-6 shadow-2xl text-left overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-100 hover:text-ink-900 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-rosewood-100 text-rosewood-700 flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-ink-900">
              You are heard, and you are not alone
            </h3>
            <p className="text-xs text-ink-100">Your note is safely kept in your private library</p>
          </div>
        </div>

        <div className="bg-white/80 border border-parchment-200 rounded-xl p-3.5 mb-4 text-xs text-ink-500 leading-relaxed space-y-1.5">
          <p>
            Writing down raw, painful thoughts takes immense courage. Because your letter touches on deep distress or self-harm, we have kept it <strong className="text-ink-900 font-medium">safely in your private shelf</strong> rather than publishing it to the open public library.
          </p>
          <p className="text-sage-700 font-medium flex items-center gap-1 pt-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Nothing was erased. Your words remain yours alone.</span>
          </p>
        </div>

        <div className="mb-3">
          <label className="block text-[11px] uppercase tracking-wider text-ink-100 font-medium mb-1.5">
            Confidential & Free Support Lines
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {countries.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCountry(c)}
                className={`px-2.5 py-1 rounded-full text-xs transition ${
                  selectedCountry === c
                    ? 'bg-ink-900 text-white font-medium'
                    : 'bg-parchment-200 text-ink-500 hover:bg-parchment-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 mb-5">
          {filtered.map((item, idx) => (
            <div key={idx} className="p-3 bg-white border border-parchment-200 rounded-xl shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-serif font-medium text-xs text-ink-900">{item.name}</span>
                <span className="text-[10px] text-sage-700 bg-sage-50 px-1.5 py-0.5 rounded">{item.hours}</span>
              </div>
              <p className="text-[11px] text-ink-100 leading-tight">{item.notes}</p>
              <div className="flex items-center gap-3 pt-1.5 text-xs font-medium">
                {item.phone && (
                  <a
                    href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                    className="flex items-center gap-1 text-sage-700 hover:text-sage-800"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{item.phone}</span>
                  </a>
                )}
                {item.sms && (
                  <span className="flex items-center gap-1 text-rosewood-600">
                    <MessageSquare className="w-3 h-3" />
                    <span>{item.sms}</span>
                  </span>
                )}
                {item.website && (
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-ink-500 hover:text-ink-900 ml-auto"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-ink-900 hover:bg-ink-800 text-white text-xs font-medium rounded-xl transition shadow-xs"
        >
          Return to My Sanctuary
        </button>
      </div>
    </div>
  );
};
