import React from "react";

interface LibrarianProps {
  line: string;
  sub?: string;
  align?: "left" | "center";
  className?: string;
}

/**
 * The Librarian: the library's small resident presence. A medallion portrait
 * (an owl in spectacles, keeper of the shelves) plus one first-person line.
 */
export const Librarian: React.FC<LibrarianProps> = ({
  line,
  sub,
  align = "left",
  className = "",
}) => (
  <div
    className={`flex items-start gap-3 ${
      align === "center" ? "justify-center text-left" : ""
    } ${className}`}
    data-testid="librarian"
  >
    <div className="librarian-medallion" aria-hidden="true">
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        {/* Owl keeper of the shelves */}
        <ellipse cx="24" cy="26" rx="13" ry="15" fill="#3a2a1a" />
        <ellipse cx="24" cy="30" rx="8" ry="9" fill="#5a4128" />
        <circle cx="18.5" cy="21" r="4.6" fill="#f3ece0" />
        <circle cx="29.5" cy="21" r="4.6" fill="#f3ece0" />
        <circle cx="18.5" cy="21" r="2" fill="#171008" />
        <circle cx="29.5" cy="21" r="2" fill="#171008" />
        {/* spectacles */}
        <circle cx="18.5" cy="21" r="5.6" stroke="#d4a373" strokeWidth="1.1" />
        <circle cx="29.5" cy="21" r="5.6" stroke="#d4a373" strokeWidth="1.1" />
        <path d="M24 21h0.5" stroke="#d4a373" strokeWidth="1.1" />
        {/* beak + brow tufts */}
        <path d="M24 23.5l-2 3h4l-2-3z" fill="#d4a373" />
        <path d="M13 12l4 3M35 12l-4 3" stroke="#3a2a1a" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </div>
    <div className="min-w-0">
      <span className="label-caps block text-[9px] mb-0.5">The Librarian</span>
      <p className="font-serif italic text-sm sm:text-base text-[#e8dab2] leading-relaxed">
        "{line}"
      </p>
      {sub && (
        <p className="font-body text-xs text-[#9e9488] mt-1 italic">{sub}</p>
      )}
    </div>
  </div>
);
