import React, { useEffect, useState } from "react";
import { registerVisit } from "../../lib/visits";
import { currentHallHour, HALL_LABELS, HallHour } from "../../lib/timeOfDay";

/** Landing-page line: how many times you have visited, plus the hall's lighting for the hour. */
export const RoomMemory: React.FC = () => {
  const [visits] = useState(() => registerVisit());
  const [hour, setHour] = useState<HallHour>(() => currentHallHour());
  useEffect(() => {
    const id = window.setInterval(
      () => setHour(currentHallHour()),
      10 * 60 * 1000,
    );
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="room-memory" data-testid="room-memory">
      <p className="memory-line">
        {visits <= 1
          ? "Welcome. This is your first visit to the library."
          : `Welcome back. This is visit number ${visits} to the library.`}
      </p>
      <p className="memory-hour">{HALL_LABELS[hour]}</p>
    </div>
  );
};
