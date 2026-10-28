import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Feather, Search, SlidersHorizontal } from 'lucide-react';
import { Note } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { InteractiveBookshelf } from '../components/bookshelf/InteractiveBookshelf';
import { CandleLanternIcon } from '../components/common/CandleLanternIcon';
import { LibraryCard } from '../components/library/LibraryCard';
import { ResponseComposer } from '../components/feed/ResponseComposer';
import { ReportModal } from '../components/feed/ReportModal';
import { SignInModal } from '../components/auth/SignInModal';
import { NoteEditor } from '../components/editor/NoteEditor';
import { useCancellableLoad } from '../hooks/useCancellableLoad';

const DEMO_NOTES_KEY = 'unsent_library_demo_notes_v2';

// 24 Evocatively Named Books across all 6 thematic shelf sections
export const INITIAL_PUBLIC_NOTES: Note[] = [
  // ── Section 1: To someone I miss (Nostalgia & Longing) ──
  {
    id: 'book-miss-1',
    user_id: 'seed-user-1',
    shelf_id: null,
    title: 'The Subway Window in October',
    content:
      'I still catch myself looking for your reflection in subway windows whenever the train decelerates between 14th and 8th. I don\'t miss the person who left without turning back, but I miss the person who once believed I was courageous enough to start over in this city. You never knew that your confidence in me was the only thing standing between me and giving up.',
    prompt_id: 'prompt-5',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    profiles: {
      id: 'seed-user-1',
      pen_name: 'Silent Quill #482',
      avatar_color: '#d4a373',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-miss-2',
    user_id: 'seed-user-2',
    shelf_id: null,
    title: 'The Blue Porcelain Mugs',
    content:
      'You always drank your tea lukewarm because you spent every morning making sure everyone else\'s cup was poured and sweet before you sat down. I bought a set of blue porcelain mugs yesterday and cried in the kitchen aisle because I never once said "sit down, Mom, let me pour yours." I hope wherever you are now, tea stays warm for you as long as you want.',
    prompt_id: 'prompt-7',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    profiles: {
      id: 'seed-user-2',
      pen_name: 'Velvet Sparrow #193',
      avatar_color: '#a85d66',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-miss-3',
    user_id: 'seed-user-3',
    shelf_id: null,
    title: 'A Cassette Taped Over Twice',
    content:
      'I found the mixtapes we made the summer before college in a dusty shoe box under the bed. Side B still has your handwriting with the crooked little heart next to Track 4. I listened to it all the way through without fast-forwarding. I missed the sound of your laugh in the two seconds of silence before the guitar kicked in.',
    prompt_id: 'prompt-5',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    profiles: {
      id: 'seed-user-3',
      pen_name: 'Amber Nomad #614',
      avatar_color: '#d4a373',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-miss-4',
    user_id: 'seed-user-4',
    shelf_id: null,
    title: 'Your Laugh in a Crowded Train',
    content:
      'Someone on the morning commute laughed this morning in that rapid, breathless way you used to when something caught you off guard. I turned around so fast I bumped into the person behind me. It wasn\'t you, of course. But for three seconds, it was seven years ago and we were sitting on the steps with melted ice cream.',
    prompt_id: 'prompt-5',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    profiles: {
      id: 'seed-user-4',
      pen_name: 'Solitary Haven #729',
      avatar_color: '#2a4365',
      created_at: new Date().toISOString(),
    },
  },

  // ── Section 2: Things I'm sorry for (Forgiveness & Apologies) ──
  {
    id: 'book-sorry-1',
    user_id: 'seed-user-5',
    shelf_id: null,
    title: 'The Apology Swallowed at 17',
    content:
      'We stood on your porch in the damp autumn air and I knew you were waiting for me to say it. I felt the words right behind my teeth, but my stubborn teenage pride thought keeping quiet was strength. I have spent ten years learning that apologizing is the only real courage there is. I am so sorry.',
    prompt_id: 'prompt-2',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    profiles: {
      id: 'seed-user-5',
      pen_name: 'Wistful Voyager #312',
      avatar_color: '#52796f',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-sorry-2',
    user_id: 'seed-user-6',
    shelf_id: null,
    title: 'I Let the Phone Ring Out',
    content:
      'You called at 11:42 PM on a Thursday. I saw your name glowing on my bedside table, and I told myself I was too tired and would call you back at breakfast. There was no breakfast call. I will carry the sound of those four unanswered rings for the rest of my life.',
    prompt_id: 'prompt-2',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    profiles: {
      id: 'seed-user-6',
      pen_name: 'Midnight Keeper #805',
      avatar_color: '#6c5b7b',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-sorry-3',
    user_id: 'seed-user-7',
    shelf_id: null,
    title: 'Pride Was Smaller Than You',
    content:
      'I wanted so badly to win that argument in the diner parking lot. I used sharp sentences like knives because I thought being right meant being safe. When your car backed out of the space, I realized that being right in an empty parking lot is the loneliest feeling in the world.',
    prompt_id: 'prompt-2',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    profiles: {
      id: 'seed-user-7',
      pen_name: 'Gentle Echo #441',
      avatar_color: '#c06c84',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-sorry-4',
    user_id: 'seed-user-8',
    shelf_id: null,
    title: 'The Letter Left in the Glovebox',
    content:
      'I wrote you an honest three-page letter on yellow legal paper. I put it in an envelope, slipped it into your car glove compartment, and took it back out twenty minutes later before you got back from the store. I should have left it there. You deserved to know the truth.',
    prompt_id: 'prompt-2',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
    profiles: {
      id: 'seed-user-8',
      pen_name: 'Distant Poet #208',
      avatar_color: '#3d372e',
      created_at: new Date().toISOString(),
    },
  },

  // ── Section 3: What I wish I'd said (Truth & Vulnerability) ──
  {
    id: 'book-wish-1',
    user_id: 'seed-user-9',
    shelf_id: null,
    title: 'To the Stranger on the Bench',
    content:
      'You handed me your extra umbrella on a Tuesday afternoon when the rain was coming down sideways and said, "Hold on, the storm always breaks eventually." You walked away into the deluge before I could say a word. You had no idea what I was carrying that afternoon. You kept someone alive with seven words.',
    prompt_id: 'prompt-8',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    profiles: {
      id: 'seed-user-9',
      pen_name: 'Copper Whisper #512',
      avatar_color: '#2a4365',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-wish-2',
    user_id: 'seed-user-10',
    shelf_id: null,
    title: 'You Made the Heavy Things Light',
    content:
      'Whenever my world felt like it was caving in, you never gave speeches or offered advice. You just brought hot soup in plastic containers, sat on the rug, and let me exist without having to perform being okay. I never told you that your quiet presence saved me from drowning.',
    prompt_id: 'prompt-6',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    profiles: {
      id: 'seed-user-10',
      pen_name: 'Wandering Lantern #923',
      avatar_color: '#d4a373',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-wish-3',
    user_id: 'seed-user-11',
    shelf_id: null,
    title: 'I Loved You Before I Understood It',
    content:
      'I knew I loved you the morning we were stuck in traffic on the expressway and you were singing terribly off-key to a song on the radio with your hand on the wheel. I looked at the side of your face and thought, "I could spend eighty years being stuck in traffic with you." I swallowed the words because I was terrified of spoiling the simplicity of that moment.',
    prompt_id: 'prompt-6',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    profiles: {
      id: 'seed-user-11',
      pen_name: 'Fading Compass #147',
      avatar_color: '#a85d66',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-wish-4',
    user_id: 'seed-user-12',
    shelf_id: null,
    title: 'Stay Five More Minutes',
    content:
      'When you reached for your coat on the rack by the front door, every cell in my body wanted to reach out and hold the sleeve. I just stood there with my hands in my cardigan pockets and said, "Drive safe, text me when you get in." Those five minutes would have given us everything we never got to finish.',
    prompt_id: 'prompt-6',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    profiles: {
      id: 'seed-user-12',
      pen_name: 'Somber Cartographer #680',
      avatar_color: '#52796f',
      created_at: new Date().toISOString(),
    },
  },

  // ── Section 4: To the one who left (Closure & Loss) ──
  {
    id: 'book-left-1',
    user_id: 'seed-user-13',
    shelf_id: null,
    title: 'The Words Left on the Platform',
    content:
      'I watched the train pull away, and my hands stayed in my pockets. Everything I planned to say felt too heavy to carry through the station air. The platform slowly emptied out, and I sat on the wooden bench until the next train arrived for a destination I wasn\'t traveling to. I hope the quiet didn\'t sound like I didn\'t care.',
    prompt_id: 'prompt-1',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    profiles: {
      id: 'seed-user-13',
      pen_name: 'Quiet Heron #389',
      avatar_color: '#204a39',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-left-2',
    user_id: 'seed-user-14',
    shelf_id: null,
    title: 'You Took the Key but Left the Door Open',
    content:
      'You slipped your house key onto the front credenza beside the ceramic dish and walked out without slamming the door. The draft from the hallway rustled the papers on the table for ten minutes after you were gone. I didn\'t lock the deadbolt for six weeks because I kept imagining you\'d remember you left your favorite woolen scarf behind.',
    prompt_id: 'prompt-1',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    profiles: {
      id: 'seed-user-14',
      pen_name: 'Autumnal Shadow #754',
      avatar_color: '#8c5027',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-left-3',
    user_id: 'seed-user-15',
    shelf_id: null,
    title: 'The Winter We Stopped Trying',
    content:
      'We didn\'t have a massive screaming match or a dramatic final chapter. We just stopped asking each other about our afternoons. We let the silence fill the space between the kitchen table and the television until we were two strangers sharing a lease. I am writing this to say that the quiet ending broke me more than a fight ever could.',
    prompt_id: 'prompt-1',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    profiles: {
      id: 'seed-user-15',
      pen_name: 'Hollow Hourglass #263',
      avatar_color: '#383530',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-left-4',
    user_id: 'seed-user-16',
    shelf_id: null,
    title: 'No Goodbye at the Gate',
    content:
      'You texted "boarding now" while I was standing outside Terminal 2 looking up at the departing flights board. I held the silver keychain I bought you in my palm until the edges dug into my skin. I never sent the reply I drafted: "Turn around and let\'s try again."',
    prompt_id: 'prompt-1',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
    profiles: {
      id: 'seed-user-16',
      pen_name: 'Patient Archive #901',
      avatar_color: '#6b232c',
      created_at: new Date().toISOString(),
    },
  },

  // ── Section 5: Things I swallowed to keep the peace (Vulnerability & Truth) ──
  {
    id: 'book-swallow-1',
    user_id: 'seed-user-17',
    shelf_id: null,
    title: 'Laughing at the Dinner Table',
    content:
      'I wanted to tell you how deeply it bruised when you made a joke out of the things that made my eyes light up. Instead I forced a smile and laughed with the rest of the table so nobody would think I was "too sensitive." I am finally unlearning the habit of shrinking myself to fit inside rooms that were never built for depth.',
    prompt_id: 'prompt-3',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    profiles: {
      id: 'seed-user-17',
      pen_name: 'Amber Nomad #614',
      avatar_color: '#d4a373',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-swallow-2',
    user_id: 'seed-user-18',
    shelf_id: null,
    title: 'I Pretended It Didn\'t Bruise',
    content:
      'You said "no offense, but..." and then proceeded to dismantle the project I spent four months pouring my nights into. I nodded and said, "No, totally, you make great points!" while my chest felt like it was caving in. I am done smiling through people\'s carelessness.',
    prompt_id: 'prompt-3',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    profiles: {
      id: 'seed-user-18',
      pen_name: 'Luminous Sleeper #407',
      avatar_color: '#a85d66',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-swallow-3',
    user_id: 'seed-user-19',
    shelf_id: null,
    title: 'The Sentences I Bit in Half',
    content:
      'Every Sunday phone call I rehearse five sentences about how lonely I actually feel. And every Sunday when you ask "How\'s everything?", I answer "Super busy, doing great!" and swallow the rest like cold stones. I wish I was brave enough to let you know me as I really am.',
    prompt_id: 'prompt-3',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    profiles: {
      id: 'seed-user-19',
      pen_name: 'Drifting Memory #833',
      avatar_color: '#52796f',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-swallow-4',
    user_id: 'seed-user-20',
    shelf_id: null,
    title: 'Smiling So Nobody Would Ask',
    content:
      'I got very good at being the cheerful friend who listens to everyone\'s crises over coffee. The problem with being the person who never breaks is that nobody ever checks whether you are already in pieces. I am letting this letter carry the breakdown I never gave myself permission to have.',
    prompt_id: 'prompt-3',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
    profiles: {
      id: 'seed-user-20',
      pen_name: 'Golden River #192',
      avatar_color: '#d4a373',
      created_at: new Date().toISOString(),
    },
  },

  // ── Section 6: Dear younger me (Self & Healing) ──
  {
    id: 'book-younger-1',
    user_id: 'seed-user-21',
    shelf_id: null,
    title: 'You Didn\'t Have to Grow Up in One Night',
    content:
      'You were 14 sitting on the bottom of the basement stairs listening to the shouting upstairs, deciding that from that night on you would be the parent, the protector, and the rock. I am writing from 20 years in the future to tell you: you were just a kid. You were allowed to be frightened. Put the backpack down. You did enough.',
    prompt_id: 'prompt-4',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    profiles: {
      id: 'seed-user-21',
      pen_name: 'Patient Keeper #559',
      avatar_color: '#6c5b7b',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-younger-2',
    user_id: 'seed-user-22',
    shelf_id: null,
    title: 'Softness Was Never Your Weakness',
    content:
      'The world convinced you that feeling things deeply would get you destroyed, so you built fortress walls out of sarcasm and closed doors. Look at where we are now. It took a decade of unlearning to realize that your tender heart was the only thing truly extraordinary about you. Don\'t hide it.',
    prompt_id: 'prompt-4',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    profiles: {
      id: 'seed-user-22',
      pen_name: 'Gentle Quill #378',
      avatar_color: '#2a4365',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-younger-3',
    user_id: 'seed-user-23',
    shelf_id: null,
    title: 'The Ocean Wasn\'t Angry at You',
    content:
      'You spent years wondering what was fundamentally wrong with you that people seemed to leave so easily. The answer is nothing. Sometimes seasons change and leaves fall, not because the tree failed, but because winter is just winter. You are going to survive every single heartbreak.',
    prompt_id: 'prompt-4',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    profiles: {
      id: 'seed-user-23',
      pen_name: 'Solitary Poet #910',
      avatar_color: '#a85d66',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'book-younger-4',
    user_id: 'seed-user-24',
    shelf_id: null,
    title: 'Put Down the Armor, It\'s Morning',
    content:
      'You don\'t have to stay braced for impact anymore. The war you were fighting in that house ended a long time ago. The doors have locks now, the windows let in morning sunlight, and nobody is going to come in and take away the things you love. Take a deep breath. You are home.',
    prompt_id: 'prompt-4',
    is_locked: false,
    passcode_hash: null,
    is_public: true,
    allow_responses: true,
    moderation_status: 'clean',
    report_count: 0,
    published_at: new Date(Date.now() - 3600000 * 24 * 11).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24 * 11).toISOString(),
    profiles: {
      id: 'seed-user-24',
      pen_name: 'Velvet Voyager #642',
      avatar_color: '#d4a373',
      created_at: new Date().toISOString(),
    },
  },
];

export const PublicFeedPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Modals
  const [respondingNote, setRespondingNote] = useState<Note | null>(null);
  const [reportingNote, setReportingNote] = useState<Note | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  // Discovery control (KTD8): free-text search over title/content/pen name
  // plus a latest/oldest sort, applied to the same list InteractiveBookshelf
  // renders so it narrows (never conflicts with) its shelf-section browsing.
  const [feedSearch, setFeedSearch] = useState('');
  const [feedSort, setFeedSort] = useState<'latest' | 'oldest'>('latest');

  const loadPublicNotes = async (): Promise<Note[] | null> => {
    if (!isSupabaseConfigured) {
      const raw = localStorage.getItem(DEMO_NOTES_KEY);
      let localNotes: Note[] = raw ? JSON.parse(raw) : [];

      if (localNotes.length === 0) {
        localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(INITIAL_PUBLIC_NOTES));
        localNotes = INITIAL_PUBLIC_NOTES;
      }

      return localNotes.filter(
        (n) => n.is_public && n.moderation_status === 'clean'
      );
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*, profiles:user_id(id, pen_name, avatar_color)')
      .eq('is_public', true)
      .eq('moderation_status', 'clean')
      .order('published_at', { ascending: false });

    if (error || !data) return null;
    return data as Note[];
  };

  // Initial load runs under the shared cancellation guard; every refresh below
  // goes through refetch() so it shares the same guard.
  const { loading, refetch } = useCancellableLoad(loadPublicNotes, [], setNotes);

  const visibleNotes = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();
    const filtered = query
      ? notes.filter((n) =>
          [n.title ?? '', n.content ?? '', n.profiles?.pen_name ?? ''].some((field) =>
            field.toLowerCase().includes(query)
          )
        )
      : notes;
    const byDate = (n: Note) => n.published_at || n.created_at || '';
    return [...filtered].sort((a, b) =>
      feedSort === 'latest'
        ? byDate(b).localeCompare(byDate(a))
        : byDate(a).localeCompare(byDate(b))
    );
  }, [notes, feedSearch, feedSort]);

  const handleStartResponse = (note: Note) => {
    if (!user) {
      setIsSignInModalOpen(true);
      return;
    }
    setRespondingNote(note);
  };

  const handleSaveNewNote = async (newNoteData: Partial<Note>) => {
    if (!isSupabaseConfigured) {
      const now = new Date().toISOString();
      const raw = localStorage.getItem(DEMO_NOTES_KEY);
      const existing: Note[] = raw ? JSON.parse(raw) : [];
      const created: Note = {
        id: 'note-' + Date.now(),
        user_id: user?.id || 'guest',
        shelf_id: null,
        title: newNoteData.title || null,
        content: newNoteData.content || '',
        prompt_id: newNoteData.prompt_id || null,
        is_locked: newNoteData.is_locked || false,
        passcode_hash: newNoteData.passcode_hash || null,
        is_public: newNoteData.is_public || false,
        allow_responses: newNoteData.allow_responses ?? true,
        moderation_status: newNoteData.moderation_status || 'clean',
        report_count: 0,
        published_at: newNoteData.is_public ? now : null,
        created_at: now,
        profiles: profile || undefined,
      };
      existing.unshift(created);
      localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(existing));
      setIsEditorOpen(false);
      refetch();
      return;
    }

    if (user) {
      const { data } = await supabase
        .from('notes')
        .insert([{ ...newNoteData, user_id: user.id }])
        .select()
        .single();
      if (data) {
        setIsEditorOpen(false);
        refetch();
      }
    }
  };

  if (isEditorOpen) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <NoteEditor
          note={{ is_public: true, allow_responses: true }}
          shelves={[]}
          onSave={handleSaveNewNote}
          onClose={() => setIsEditorOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden text-amber-100">
      {/* 1. Hero Section (Design & Aesthetic from thediaryproject.lovable.app) */}
      <section className="relative flex min-h-[82vh] items-center justify-center overflow-hidden px-6 py-20 text-center">
        {/* Candle Glow Ambient Gradient */}
        <div className="candle-glow absolute inset-0" />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Hanging Candle Lantern Icon */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <CandleLanternIcon className="h-28 w-14 text-gold mb-3" />
          </motion.div>

          {/* Subtitle Badge */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="label-caps mt-2 text-gold/90"
          >
            Anonymous Literary Sanctuary
          </motion.p>

          {/* Main Hero Header */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-4 text-5xl sm:text-7xl font-serif tracking-tight text-[#f3ece0]"
          >
            Say what you couldn't say.
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mx-auto mt-6 max-w-lg font-body text-base sm:text-lg text-[#9e9488] leading-relaxed italic"
          >
            An anonymous library for the things you carry and never told anyone. Write them down. Shelve them. Be known by no one.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => setIsEditorOpen(true)}
              className="rounded-full bg-gold hover:bg-gold-light px-8 py-3.5 font-serif text-lg text-wood-950 font-semibold shadow-candle transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
            >
              <Feather className="w-5 h-5" />
              <span>Write an Unsent Letter</span>
            </button>

            <a
              href="#bookshelf"
              className="rounded-full border border-hairline bg-card/80 hover:bg-wood-850 px-8 py-3.5 font-serif text-lg text-amber-100 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              Browse the Bookshelf
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. Poetic Quote Divider */}
      <section className="px-6 py-20 border-y border-hairline/60 bg-wood-950/40">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-serif text-3xl leading-snug sm:text-4xl text-[#f3ece0]">
            Some things are too heavy to carry and too hard to say. So they sit in your chest.{' '}
            <em className="text-gold not-italic">Here, they can sit on a shelf instead.</em>
          </p>
        </div>
      </section>

      {/* 3. The Interactive Bookshelf (Letters are opened by touching a book) */}
      <div id="bookshelf" className="scroll-mt-16 py-10">
        {/* Search + sort control: lives above the bookshelf and narrows what it renders */}
        <div className="mx-auto max-w-5xl px-4 mb-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={feedSearch}
              onChange={(e) => setFeedSearch(e.target.value)}
              placeholder="Search letters by title, words, or pen name..."
              aria-label="Search letters"
              className="w-full pl-10 pr-4 py-2.5 bg-card/80 border border-hairline rounded-xl text-sm text-amber-100 placeholder:text-[#9e9488]/70 font-serif focus:outline-none focus:ring-1 focus:ring-gold transition"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-200 bg-card/80 border border-hairline rounded-xl px-3 py-2.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gold" />
            <select
              value={feedSort}
              onChange={(e) => setFeedSort(e.target.value as 'latest' | 'oldest')}
              aria-label="Sort letters by date"
              className="bg-transparent text-xs font-serif text-amber-100 focus:outline-none cursor-pointer"
            >
              <option value="latest" className="bg-wood-900 text-amber-100">Latest archived</option>
              <option value="oldest" className="bg-wood-900 text-amber-100">Earliest archived</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div role="status" className="text-center py-20 px-4">
            <Feather className="w-6 h-6 text-gold/60 mx-auto mb-3 animate-pulse" />
            <p className="font-body text-sm text-[#9e9488] italic">
              Unshelving the letters...
            </p>
          </div>
        ) : feedSearch.trim() && visibleNotes.length === 0 ? (
          <div role="status" className="text-center py-20 px-4">
            <Feather className="w-8 h-8 text-gold/50 mx-auto mb-3" />
            <h3 className="font-serif text-2xl text-amber-100 mb-2">
              No letters match your search
            </h3>
            <p className="font-body text-sm text-[#9e9488] italic max-w-sm mx-auto">
              Try a different phrase, or search by pen name.
            </p>
          </div>
        ) : (
          <InteractiveBookshelf
            notes={visibleNotes}
            onWriteClick={() => setIsEditorOpen(true)}
            onRespondLetter={handleStartResponse}
          />
        )}
      </div>

      {/* 4. Library Card & Sample Letter Quote Section (Clean and focused, four rooms removed) */}
      <section className="px-6 py-24 border-t border-hairline bg-wood-950/40">
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Library Card */}
          <div className="text-center md:text-left">
            <span className="label-caps block mb-2">Anonymous Identity</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#f3ece0] mb-4">
              Your identity belongs to you alone
            </h2>
            <p className="font-body text-base text-[#9e9488] leading-relaxed mb-6 italic">
              When you enter the library, you receive an anonymous pseudonym. Nobody sees your email, location, or personal details.
            </p>
            <LibraryCard
              penName={profile?.pen_name || 'Quiet Heron'}
              avatarColor="#d4a373"
              className="mx-auto md:mx-0"
            />
          </div>

          {/* Sample Unsent Parchment Note from the shelf */}
          <div>
            <p className="label-caps mb-4 text-center">From a shelf, someday</p>
            <div className="parchment-sheet rotate-[0.6deg] rounded-sm p-8 sm:p-12 shadow-parchment text-wood-950 border border-amber-900/30">
              <blockquote className="font-serif text-2xl sm:text-3xl italic leading-relaxed text-wood-950">
                "To the friend I stopped calling:
                <br />
                <br />
                I'm not angry anymore. I just didn't know how to say I missed you."
              </blockquote>
              <div className="mt-8 text-right font-serif text-lg text-wood-800">
                — Quiet Heron
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Response Composer Modal */}
      {respondingNote && (
        <ResponseComposer
          isOpen={!!respondingNote}
          targetNoteId={respondingNote.id}
          targetNoteTitle={respondingNote.title || 'Untitled Letter'}
          targetPenName={respondingNote.profiles?.pen_name || 'Anonymous Writer'}
          onClose={() => setRespondingNote(null)}
          onResponseSent={() => {
            setRespondingNote(null);
            refetch();
          }}
        />
      )}

      {/* Report Modal */}
      {reportingNote && (
        <ReportModal
          isOpen={!!reportingNote}
          noteId={reportingNote.id}
          onClose={() => setReportingNote(null)}
          onReportSubmitted={() => {
            refetch();
            setReportingNote(null);
          }}
        />
      )}

      {/* Sign In Modal if guest tries to respond */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </div>
  );
};
