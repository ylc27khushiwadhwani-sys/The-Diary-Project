import React from "react";
import { SHELF_SECTIONS } from "../bookshelf/InteractiveBookshelf";

/** Only the shelf labels are controls. Painted books are decorative. */
export const GrandLibraryRoom: React.FC<{onChoose:(sectionId:string)=>void}> = ({onChoose}) => (
  <section className="grand-library-room" aria-labelledby="grand-room-title">
    <img className="grand-room-art" src="/art/grand-library-room.webp" alt="" aria-hidden="true" />
    <header className="grand-room-heading">
      <p>THE PAPER VAULT</p>
      <h1 id="grand-room-title">The Grand Library</h1>
      <span>Choose a name on the shelf. A world of letters waits inside.</span>
    </header>
    <nav className="grand-room-labels" aria-label="Explore the library's prompt shelves">
      {Array.from({length:6},(_,group)=><div className={`grand-room-plaque grand-room-plaque-${group}`} key={group}>
        {SHELF_SECTIONS.slice(group*2,group*2+2).map(section=><button key={section.id} type="button" onClick={()=>onChoose(section.id)}><span>{section.label}</span><span aria-hidden="true">↗</span></button>)}
      </div>)}
    </nav>
    <p className="grand-room-note">The books in this room are decoration. The shelf labels open public letters.</p>
  </section>
);
