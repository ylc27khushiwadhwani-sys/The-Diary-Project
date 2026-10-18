import React, { useState } from 'react';
import { Bookmark, Plus, X, Folder, BookOpen, Heart, Cloud, Moon, Archive } from 'lucide-react';
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-100">
          Your Shelves
        </h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="text-xs text-sage-700 hover:text-sage-800 flex items-center gap-1 font-medium transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Shelf</span>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="p-3 bg-white/90 border border-parchment-300 rounded-xl space-y-2 animate-fade-in shadow-xs">
          <input
            type="text"
            required
            autoFocus
            placeholder="Shelf name (e.g. For Someone Lost)"
            value={newShelfName}
            onChange={(e) => setNewShelfName(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-parchment-50 border border-parchment-200 rounded focus:outline-none focus:ring-1 focus:ring-sage-600"
          />
          <div className="flex items-center gap-1.5">
            {AVAILABLE_ICONS.map(({ name, Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedIcon(name)}
                className={`p-1.5 rounded transition ${
                  selectedIcon === name
                    ? 'bg-sage-600 text-white'
                    : 'text-ink-100 hover:bg-parchment-200'
                }`}
              >
                <Icon className="w-3 h-3" />
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 bg-ink-900 text-white text-xs rounded hover:bg-ink-800 transition"
            >
              {loading ? 'Adding...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2 py-1 text-xs text-ink-100 hover:text-ink-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-1">
        <button
          onClick={() => onSelectShelf(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
            selectedShelfId === null
              ? 'bg-parchment-300/80 text-ink-900 font-semibold'
              : 'text-ink-500 hover:bg-parchment-200/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-sage-700" />
            <span>All Unsent Notes</span>
          </div>
        </button>

        {shelves.map((shelf) => (
          <div
            key={shelf.id}
            className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
              selectedShelfId === shelf.id
                ? 'bg-parchment-300/80 text-ink-900 font-semibold'
                : 'text-ink-500 hover:bg-parchment-200/60'
            }`}
          >
            <button
              onClick={() => onSelectShelf(shelf.id)}
              className="flex-1 flex items-center gap-2 text-left truncate"
            >
              <span className="text-sage-700">{getIconComponent(shelf.icon)}</span>
              <span className="truncate">{shelf.name}</span>
            </button>
            <button
              onClick={() => onDeleteShelf(shelf.id)}
              className="opacity-0 group-hover:opacity-100 text-ink-100 hover:text-rosewood-500 p-0.5 transition"
              title="Delete Shelf"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
