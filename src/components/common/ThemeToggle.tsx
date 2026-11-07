import React from "react";
import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * The daylight lamp switch. Sits at the top right of the header and moves
 * the whole library between candlelit (dark) and sunlit garden (light).
 * Deliberately generous in size so it's easy to spot and tap.
 */
export const ThemeToggle: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const target = isLight ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${target} mode`}
      title={`Switch to ${target} mode`}
      aria-pressed={isLight}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/40 bg-card/70 px-3 py-2 font-serif text-xs text-gold shadow-candle transition hover:bg-card hover:text-gold-light cursor-pointer ${className}`}
    >
      {isLight ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <SunMedium className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="hidden sm:inline capitalize">{target} mode</span>
    </button>
  );
};
