import React from "react";
import {
  ShieldCheck,
  Flag,
  HeartHandshake,
  EyeOff,
  Mail,
  Feather,
  Scale,
} from "lucide-react";
import { GrandHallBackdrop } from "../components/library/GrandHallBackdrop";

interface GuardrailItem {
  icon: React.ReactNode;
  title: string;
  body: string;
}

// Every claim on this page maps to something the code actually does:
// pre-public screening (services/moderation.ts + screen-content edge fn),
// crisis helplines (ShareModal -> HelplineModal), PII held private,
// 3-report auto-hide (supabase trigger handle_note_report_threshold),
// screened private-first replies (ResponseComposer + AuthorInbox pinning).
const GUARDRAILS: GuardrailItem[] = [
  {
    icon: <ShieldCheck className="w-5 h-5 text-gold" />,
    title: "Every letter is screened before it can go public",
    body: "Nothing reaches the public library unread by our safety checks. When a writer releases a letter, automated screening reviews it first. Letters that do not pass never appear on a public shelf - they simply remain private to their writer.",
  },
  {
    icon: <HeartHandshake className="w-5 h-5 text-gold" />,
    title: "Crisis language is met with care, not an audience",
    body: "If a letter contains self-harm or crisis language, it is held private and the writer is gently shown free, confidential helplines in their country. The letter is never published, and no one is ever shown such a letter on a public shelf.",
  },
  {
    icon: <EyeOff className="w-5 h-5 text-gold" />,
    title: "Personal details stay out of the public library",
    body: "Letters containing personal contact details - phone numbers, email addresses, similar identifiers - are held private automatically, to protect the writer and anyone they mention.",
  },
  {
    icon: <Flag className="w-5 h-5 text-gold" />,
    title: "Every public letter can be reported",
    body: "Open any public letter and you will find a Report option beside it. A letter that gathers 3 reports is automatically hidden from the library at once, pending review.",
  },
  {
    icon: <Mail className="w-5 h-5 text-gold" />,
    title: "Replies are screened and private-first",
    body: "Reader response letters pass through the same screening before they are delivered. They arrive privately in the writer's postbox, and a reply only ever becomes public if the writer chooses to pin it to their letter.",
  },
  {
    icon: <Feather className="w-5 h-5 text-gold" />,
    title: "Pseudonymous by default",
    body: "Writers appear only under an anonymous pen name. Email addresses are used solely to preserve a private library across devices - never shown, never shared.",
  },
  {
    icon: <Scale className="w-5 h-5 text-gold" />,
    title: "How the screening works",
    body: "Screening runs on automated classifiers that share a single rulebook between the app and our servers, so the same standard applies everywhere. Where configured, an independent AI moderation service adds a second pass. Screening looks for crisis language, personal contact details, and abusive or harassing content.",
  },
];

export const GuidelinesPage: React.FC = () => {
  return (
    <div className="relative max-w-4xl mx-auto pt-16 pb-10 px-4 sm:py-10">
      <GrandHallBackdrop />

      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-gold" />
          <span className="label-caps">Community Guidelines &amp; Safety</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-[#f3ece0] tracking-tight">
          The Guardrails of the Vault
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-body text-sm sm:text-base text-[#9e9488] italic leading-relaxed">
          A library of unsent things only works if it is safe to leave heavy
          things here. These are the rules every letter lives under - and the
          machinery that enforces them.
        </p>
      </div>

      {/* Guardrail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {GUARDRAILS.map((item) => (
          <div
            key={item.title}
            className="bg-card/80 border border-hairline rounded-2xl p-6 backdrop-blur-md shadow-parchment"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-900/15 border border-amber-800/30 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <h2 className="font-serif text-lg text-[#f3ece0] leading-snug">
                {item.title}
              </h2>
            </div>
            <p className="font-body text-sm text-[#c9bda9] leading-relaxed">
              {item.body}
            </p>
          </div>
        ))}
      </div>

      {/* What we ask of writers */}
      <div className="letter-frame parchment-sheet letter-deckle p-8 sm:p-10 text-wood-950 relative mb-10">
        <div className="letter-ribbon" />
        <div className="letter-stamps">
          <span className="letter-stamp" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-wood-950 mb-4">
          What we ask of every writer
        </h2>
        <ul className="space-y-3 font-body text-sm sm:text-base text-wood-900 leading-relaxed list-disc pl-5">
          <li>Write honestly, but never name or identify another person.</li>
          <li>
            Do not include anyone's contact details - not yours, not theirs.
          </li>
          <li>
            Nothing hateful, harassing, or threatening. The shelf is for
            weight, not for weapons.
          </li>
          <li>
            If a letter worries you, report it. Three reports hide a letter
            automatically while it is reviewed.
          </li>
        </ul>
      </div>

      {/* Support note */}
      <div className="text-center bg-card/60 border border-hairline rounded-2xl p-6 backdrop-blur-sm">
        <p className="font-body text-sm text-[#c9bda9] leading-relaxed max-w-xl mx-auto">
          The Paper Vault is not a substitute for professional support. If you
          are struggling, please reach out to a{" "}
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("paper-vault:open-helplines"))
            }
            className="text-gold underline underline-offset-4 hover:text-gold-light transition cursor-pointer"
          >
            free &amp; confidential helpline in your country
          </button>
          . You matter more than any letter.
        </p>
      </div>
    </div>
  );
};
