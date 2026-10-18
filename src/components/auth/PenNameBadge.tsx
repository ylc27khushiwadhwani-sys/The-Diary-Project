import React, { useState } from 'react';
import { Edit2, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PenNameBadgeProps {
  penName?: string;
  avatarColor?: string;
  size?: 'sm' | 'md';
  interactive?: boolean;
}

export const PenNameBadge: React.FC<PenNameBadgeProps> = ({
  penName: propPenName,
  avatarColor: propAvatarColor,
  size = 'md',
  interactive,
}) => {
  const { profile, updatePenName, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newPenName, setNewPenName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const displayPenName = propPenName || profile?.pen_name || 'Anonymous Writer';
  const displayColor = propAvatarColor || profile?.avatar_color || '#52796F';
  // Allow menu if explicit interactive or if it's the current user's own badge
  const canInteract = interactive ?? (!propPenName || propPenName === profile?.pen_name);

  const handleStartEdit = () => {
    if (profile) {
      setNewPenName(profile.pen_name);
      setIsEditing(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPenName.trim()) return;
    setSaving(true);
    await updatePenName(newPenName);
    setSaving(false);
    setIsEditing(false);
  };

  const avatarSizeClasses = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs';
  const textSizeClasses = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled={!canInteract}
        onClick={() => canInteract && setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full bg-parchment-200/80 border border-parchment-300 transition text-ink-800 ${
          canInteract ? 'hover:bg-parchment-300 cursor-pointer' : 'cursor-default'
        }`}
      >
        <span
          className={`${avatarSizeClasses} rounded-full text-white font-medium flex items-center justify-center shadow-xs shrink-0`}
          style={{ backgroundColor: displayColor }}
        >
          {displayPenName.charAt(0).toUpperCase()}
        </span>
        <span className={`font-serif font-medium ${textSizeClasses} tracking-wide truncate max-w-[160px]`}>
          {displayPenName}
        </span>
      </button>

      {isOpen && canInteract && profile && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setIsEditing(false);
            }}
          />
          <div className="absolute right-0 mt-2 w-72 bg-parchment-50 border border-parchment-300 rounded-xl shadow-xl p-4 z-50 text-left animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-parchment-200">
              <span
                className="w-8 h-8 rounded-full text-white text-xs font-medium flex items-center justify-center shadow-xs"
                style={{ backgroundColor: profile.avatar_color || '#52796F' }}
              >
                {profile.pen_name.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink-100">Pen Name</p>
                <p className="font-serif font-medium text-sm text-ink-900 truncate">
                  {profile.pen_name}
                </p>
              </div>
            </div>

            <div className="py-3">
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-2">
                  <label className="block text-xs font-medium text-ink-500">
                    Customize Pen Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newPenName}
                    onChange={(e) => setNewPenName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-parchment-300 rounded text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-sage-600"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-3 py-1 bg-ink-900 text-white rounded text-xs hover:bg-ink-800 transition"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-2 py-1 text-xs text-ink-500 hover:text-ink-900"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="w-full flex items-center gap-2 text-xs text-ink-500 hover:text-ink-900 py-1 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Change pen name</span>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-parchment-200 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] text-sage-700 bg-sage-50 p-2 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Your real email is permanently hidden from readers.</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 text-xs text-rosewood-500 hover:text-rosewood-700 py-1 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
