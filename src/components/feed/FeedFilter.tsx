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
          <Search className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search letters by theme, phrases, or pen name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-wood-950/80 border border-amber-900/40 rounded-xl text-xs sm:text-sm text-amber-100 placeholder:text-amber-300/40 font-cinzel focus:outline-none focus:ring-1 focus:ring-amber-500 transition shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="flex items-center gap-2 text-xs text-amber-200 bg-wood-950/80 border border-amber-900/40 rounded-xl px-3 py-2 shadow-inner">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'latest' | 'oldest')}
              aria-label="Sort letters by date"
              className="bg-transparent text-xs font-cinzel text-amber-200 focus:outline-none cursor-pointer"
            >
              <option value="latest" className="bg-wood-900 text-amber-100">Latest archived</option>
              <option value="oldest" className="bg-wood-900 text-amber-100">Earliest archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Scroll / Wrap */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-cinzel font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-amber-600 text-wood-950 shadow-candle border border-amber-400'
                  : 'bg-wood-900/70 text-amber-200/80 hover:bg-wood-800 hover:text-amber-100 border border-amber-900/40'
              }`}
            >
              {cat === 'All' && <Sparkles className="w-3 h-3 inline mr-1 text-amber-900" />}
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
