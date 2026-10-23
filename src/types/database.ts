export type ModerationStatus = 'clean' | 'held_private' | 'flagged_hidden';

export interface Profile {
  id: string;
  pen_name: string;
  avatar_color: string;
  created_at: string;
}

export interface Shelf {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  shelf_id: string | null;
  title: string | null;
  content: string;
  prompt_id: string | null;
  is_locked: boolean;
  passcode_hash: string | null;
  is_public: boolean;
  allow_responses: boolean;
  moderation_status: ModerationStatus;
  report_count: number;
  published_at: string | null;
  created_at: string;
  tags?: string[] | null;
  profiles?: Profile;
  shelves?: Shelf;
}

export interface ResponseLetter {
  id: string;
  note_id: string;
  author_id: string;
  content: string;
  is_approved_by_note_owner: boolean;
  moderation_status: ModerationStatus;
  created_at: string;
  profiles?: Profile;
}

export interface NoteReport {
  id: string;
  note_id: string;
  reporter_id: string | null;
  reason: string;
  created_at: string;
}

export interface Prompt {
  id: string;
  title: string;
  category: string;
  description: string;
}

export interface HelplineResource {
  country: string;
  name: string;
  phone: string;
  sms?: string;
  website: string;
  hours: string;
  notes: string;
}

export interface ModerationResult {
  allowed: boolean;
  status: ModerationStatus;
  categories: {
    self_harm: boolean;
    pii: boolean;
    abuse: boolean;
  };
  reason?: string;
}
