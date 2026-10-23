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
  const displayColor = propAvatarColor || profile?.avatar_color || '#801313';
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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-wood-900/90 border border-amber-800/40 transition text-amber-200 ${
          canInteract ? 'hover:bg-wood-850 hover:border-amber-600/60 cursor-pointer shadow-candle' : 'cursor-default'
        }`}
      >
        <span
          className={`${avatarSizeClasses} rounded-full text-white font-cinzel font-bold flex items-center justify-center shadow-wax-seal shrink-0 border border-white/20`}
          style={{ backgroundColor: displayColor }}
        >
          {displayPenName.charAt(0).toUpperCase()}
        </span>
        <span className={`font-cinzel font-semibold ${textSizeClasses} tracking-wide truncate max-w-[170px]`}>
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
          <div className="absolute right-0 mt-2 w-72 parchment-sheet border border-amber-900/40 rounded-xl shadow-2xl p-5 z-50 text-left animate-fade-in text-wood-950">
            <div className="flex items-center gap-2.5 pb-3 border-b border-amber-900/20">
              <span
                className="w-8 h-8 rounded-full text-white font-cinzel font-bold text-xs flex items-center justify-center shadow-wax-seal border border-white/20"
                style={{ backgroundColor: profile.avatar_color || '#801313' }}
              >
                {profile.pen_name.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-cinzel uppercase tracking-widest text-wood-700">Author Pen Name</p>
                <p className="font-cinzel font-bold text-sm text-wood-950 truncate">
                  {profile.pen_name}
                </p>
              </div>
            </div>

            <div className="py-3">
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-2">
                  <label className="block text-xs font-cinzel font-semibold text-wood-800">
                    Customize Pen Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newPenName}
                    onChange={(e) => setNewPenName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-amber-50/80 border border-amber-900/30 rounded-lg text-xs font-cinzel text-wood-950 focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-3 py-1 bg-wood-900 text-amber-100 rounded-lg text-xs font-cinzel font-semibold hover:bg-wood-800 transition"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-2 py-1 text-xs font-cinzel text-wood-700 hover:text-wood-950"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="w-full flex items-center gap-2 text-xs font-cinzel text-wood-800 hover:text-wood-950 py-1 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Rename pseudonym</span>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-amber-900/20 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-900 bg-emerald-900/10 p-2 rounded-lg border border-emerald-800/20 font-cormorant italic">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                <span>Your real email is permanently hidden from readers.</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 text-xs font-cinzel font-semibold text-red-800 hover:text-red-950 py-1 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Sanctuary (Sign Out)</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
