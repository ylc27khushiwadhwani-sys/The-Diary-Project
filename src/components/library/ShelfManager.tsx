import React, { useState } from 'react';
import { Bookmark, Plus, X, Folder, BookOpen, Heart, Cloud, Moon, Archive, Sparkles } from 'lucide-react';
import { Shelf } from '../../types/database';

interface ShelfManagerProps {
  shelves: Shelf[];
  selectedShelfId: string | null;
  onSelectShelf: (shelfId: string | null) => void;
  onCreateShelf: (name: string, icon: string) => Promise<void>;
  onDeleteShelf: (shelfId: string) => Promise<void>;
}

const AVAILABLE_ICONS = [
  { name: 'bookmark', Icon: Bookmark },
  { name: 'folder', Icon: Folder },
  { name: 'book-open', Icon: BookOpen },
  { name: 'heart', Icon: Heart },
  { name: 'cloud', Icon: Cloud },
  { name: 'moon', Icon: Moon },
  { name: 'archive', Icon: Archive },
];

export const ShelfManager: React.FC<ShelfManagerProps> = ({
  shelves,
  selectedShelfId,
  onSelectShelf,
  onCreateShelf,
  onDeleteShelf,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('bookmark');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelfName.trim()) return;
    setLoading(true);
    await onCreateShelf(newShelfName.trim(), selectedIcon);
    setNewShelfName('');
    setIsCreating(false);
    setLoading(false);
  };

  const getIconComponent = (iconName: string) => {
    const item = AVAILABLE_ICONS.find((i) => i.name === iconName);
    const Icon = item ? item.Icon : Bookmark;
    return <Icon className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-amber-900/40">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <h3 className="font-cinzel text-xs font-bold uppercase tracking-wider text-amber-200">
            Library Shelves
          </h3>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="text-xs font-cinzel text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Carve Shelf</span>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="p-3.5 bg-wood-950/90 border border-amber-800/40 rounded-xl space-y-2.5 animate-fade-in shadow-2xl text-left">
          <input
            type="text"
            required
            autoFocus
            placeholder="Shelf name (e.g. Unsaid Apologies)"
            value={newShelfName}
            onChange={(e) => setNewShelfName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-cinzel bg-wood-900 text-amber-100 border border-amber-700/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <div className="flex items-center gap-1.5 pt-1">
            {AVAILABLE_ICONS.map(({ name, Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedIcon(name)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  selectedIcon === name
                    ? 'bg-amber-600 text-wood-950 shadow-xs'
                    : 'text-amber-300/70 hover:bg-wood-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-1.5">
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-wood-950 text-xs font-cinzel font-bold rounded-lg transition cursor-pointer"
            >
              {loading ? 'Carving...' : 'Add Shelf'}
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2.5 py-1 text-xs font-cinzel text-amber-300/60 hover:text-amber-200 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Shelves List */}
      <div className="space-y-1.5">
        {/* All Letters / Full Sanctuary Option */}
        <button
          onClick={() => onSelectShelf(null)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-cinzel font-semibold transition cursor-pointer ${
            selectedShelfId === null
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-candle'
              : 'text-amber-200/70 hover:bg-wood-800/60 hover:text-amber-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>All Unsent Letters</span>
          </div>
        </button>

        {shelves.map((shelf) => {
          const isSelected = selectedShelfId === shelf.id;
          return (
            <div
              key={shelf.id}
              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-cinzel font-semibold transition cursor-pointer ${
                isSelected
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-candle'
                  : 'text-amber-200/70 hover:bg-wood-800/60 hover:text-amber-100'
              }`}
              onClick={() => onSelectShelf(shelf.id)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-amber-400 shrink-0">
                  {getIconComponent(shelf.icon)}
                </span>
                <span className="truncate">{shelf.name}</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Remove shelf "${shelf.name}"? Notes on it will become unsorted.`)) {
                    onDeleteShelf(shelf.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-amber-400/60 hover:text-red-400 transition"
                title="Remove Shelf"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
