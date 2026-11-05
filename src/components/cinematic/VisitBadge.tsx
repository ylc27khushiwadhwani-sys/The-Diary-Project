import React, { useState } from "react";
import { registerVisit } from "../../lib/visits";

/** Small top-right indicator: how many times you have visited the library. */
export const VisitBadge: React.FC = () => {
  const [visits] = useState(() => registerVisit());
  return (
    <div
      className="visit-badge"
      data-testid="visit-badge"
      title="Number of times you have visited the library"
    >
      <span className="visit-badge-mark" aria-hidden="true" />
      <span className="visit-badge-label">Visits to the library</span>
      <span className="visit-badge-count">{visits}</span>
    </div>
  );
};
