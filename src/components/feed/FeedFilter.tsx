import React from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';

interface FeedFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: 'latest' | 'oldest';
  onSortChange: (sort: 'latest' | 'oldest') => void;
}

const CATEGORIES = [
  'All',
  'Closure',
  'Forgiveness',
  'Truth',
  'Self',
  'Nostalgia',
  'Vulnerability',
  'Family',
];

export const FeedFilter: React.FC<FeedFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <div className="space-y-4 mb-8">
      {/* Search and Sort row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-ink-100 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search letters by theme, words, or pen name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/90 border border-parchment-300 rounded-xl text-xs sm:text-sm text-ink-900 placeholder-ink-100/70 focus:outline-none focus:ring-2 focus:ring-sage-600 focus:border-transparent transition shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-ink-500 bg-white/90 border border-parchment-300 rounded-xl px-3 py-2 shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sage-600" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'latest' | 'oldest')}
              aria-label="Sort letters by date"
              className="bg-transparent text-xs text-ink-800 focus:outline-none cursor-pointer"
            >
              <option value="latest">Latest unsent notes</option>
              <option value="oldest">Earliest unsent notes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Scroll / Wrap */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-ink-900 text-parchment-50 shadow-xs'
                  : 'bg-parchment-200/80 text-ink-700 hover:bg-parchment-300'
              }`}
            >
              {cat === 'All' && <Sparkles className="w-3 h-3 inline mr-1 opacity-70" />}
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
