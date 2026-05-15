// ────────────────────────────────────────────────────────────────────
// Kasumi (賢美) dialogue script
//
// Mood = which character art to render (neutral / happy / sad).
// Tier = relationship stage, drives tone (formal → warm → intimate).
// Event = what just happened in the player's financial life.
//
// Each entry is an array of lines; one is picked randomly so the
// character doesn't sound like a vending machine.
// ────────────────────────────────────────────────────────────────────

export type Mood = 'neutral' | 'happy' | 'sad';

export type RelationshipTier =
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close'
  | 'soulmate';

export interface TierInfo {
  key: RelationshipTier;
  label: string;
  min: number;   // inclusive
  max: number;   // inclusive
  accent: string;
}

export const TIERS: TierInfo[] = [
  { key: 'stranger',     label: 'Stranger',     min: 0,  max: 19,  accent: '#94a3b8' },
  { key: 'acquaintance', label: 'Acquaintance', min: 20, max: 39,  accent: '#a78bfa' },
  { key: 'friend',       label: 'Friend',       min: 40, max: 59,  accent: '#8b5cf6' },
  { key: 'close',        label: 'Close',        min: 60, max: 79,  accent: '#7c3aed' },
  { key: 'soulmate',     label: 'Soulmate',     min: 80, max: 100, accent: '#6d28d9' },
];

export function tierFromAffection(affection: number): TierInfo {
  const a = Math.max(0, Math.min(100, affection));
  return TIERS.find(t => a >= t.min && a <= t.max) ?? TIERS[0];
}

// ── Event taxonomy ──────────────────────────────────────────────────
export type DialogueEvent =
  | 'idle'              // ambient line shown on home screen
  | 'income'            // logged income
  | 'small_expense'     // expense ≤ small threshold
  | 'big_expense'       // expense > big threshold
  | 'goal_contribution' // added to a goal
  | 'goal_completed'    // a goal just hit 100%
  | 'level_up'          // crossed an XP level
  | 'streak_milestone'  // hit a 7/14/30 day streak
  | 'streak_broken'     // streak reset to 1 after >1 day gap
  | 'first_meeting'     // affection still 0 and never spoken to
  | 'tier_up'           // just moved into a new tier
  | 'net_negative';     // persistent: expenses > income overall

// ── Tone matrix ─────────────────────────────────────────────────────
// Lines are written so tone shifts naturally with the tier.

type ScriptTable = Record<DialogueEvent, Record<RelationshipTier, string[]>>;

export const SCRIPT: ScriptTable = {
  first_meeting: {
    stranger: [
      "Oh — hello. I'm Kasumi. I'll be helping you keep an eye on things.",
      "Hi there. My name is Kasumi. Let's see if we can build something steady together.",
      "Welcome. I'm Kasumi — think of me as a quiet second opinion on your money.",
    ],
    acquaintance: [], friend: [], close: [], soulmate: [],
  },

  idle: {
    stranger: [
      "Whenever you're ready, log something. Even a coffee counts.",
      "Small entries today still tell a story by the end of the month.",
      "I'll be here. Take your time.",
      "A budget isn't a cage. It's just knowing where the door is.",
    ],
    acquaintance: [
      "How's the week looking? Anything I should help you watch?",
      "I read somewhere that people who track every expense save twice as much. Sounded smug. Also true.",
      "If you want, we could set a smaller goal first — wins build momentum.",
      "Don't forget: the boring entries are the ones that move the needle.",
    ],
    friend: [
      "I missed you a little. Show me what you've been up to.",
      "Promise me you'll log the small stuff today too — that's where the leaks are.",
      "Feeling steady? You look steady.",
      "A good month is just a lot of unremarkable Tuesdays.",
    ],
    close: [
      "Hey, you. I was thinking about that vacation goal earlier. We're getting there.",
      "You know what I like about you? You actually come back and check.",
      "Some people chase money. You're learning to walk alongside it.",
      "Want to look at the numbers together for a bit?",
    ],
    soulmate: [
      "There you are. I had a feeling you'd open the app right about now.",
      "Whatever you're saving for — I hope it's something that makes you laugh out loud when you get it.",
      "We've come a long way from that first awkward hello, haven't we?",
      "Patience suits you. It always did.",
    ],
  },

  income: {
    stranger: [
      "Income logged. That's the easy part — keeping it is the trick.",
      "Money in. Now let's make sure it doesn't all walk out by Friday.",
    ],
    acquaintance: [
      "Nice. Set a slice of that aside before you remember it exists.",
      "Income noted. Future-you would like a word about how much of it stays.",
    ],
    friend: [
      "Look at you. Want to send some of that to a goal right now?",
      "Good. I'd suggest moving a piece of this somewhere it can grow up.",
    ],
    close: [
      "Yes! That's a good day. Don't spend it all at once — or at least, not on me.",
      "Proud of you. Let's send a chunk toward something that matters.",
    ],
    soulmate: [
      "I love watching you earn. Now show me where you want it to live.",
      "Beautiful. Tuck some of it away before the world finds it.",
    ],
  },

  small_expense: {
    stranger: [
      "Noted.",
      "Recorded. Small ones add up.",
    ],
    acquaintance: [
      "That's fine. Small ones are usually fine.",
      "Logged. Nothing to flag.",
    ],
    friend: [
      "Got it. You're good.",
      "Reasonable. Keep going.",
    ],
    close: [
      "No notes. Enjoy it.",
      "That's living, not leaking.",
    ],
    soulmate: [
      "Hope it was worth it. Mostly things are.",
      "Spend a little, live a little. I'm not going to scold you.",
    ],
  },

  big_expense: {
    stranger: [
      "That's a larger one. I won't lecture — but I'll remember.",
      "Mm. Bigger than I'd usually like to see. Was it planned?",
    ],
    acquaintance: [
      "Oof. Tell me that was on purpose.",
      "That stings a little. Walk me through it next time?",
    ],
    friend: [
      "Hey — that's a chunk. Are we okay?",
      "I trust you, but… let's revisit the budget tomorrow, yeah?",
    ],
    close: [
      "That one hurt to watch. I know you, though — there's probably a reason.",
      "Big one. I'll let it go this time, but check in with yourself.",
    ],
    soulmate: [
      "I'm not mad. I just want to make sure you're being kind to future-you.",
      "Even I splurge. Just… maybe not twice this week, okay?",
    ],
  },

  goal_contribution: {
    stranger: [
      "Saved. That's the muscle you're building.",
      "Toward a goal. Good. Repeat until it's a habit.",
    ],
    acquaintance: [
      "Yes — that's the move. Brick by brick.",
      "I like that. Keep that rhythm.",
    ],
    friend: [
      "Look at us actually doing this. Again tomorrow?",
      "Every contribution makes the goal a little less abstract.",
    ],
    close: [
      "I'm so glad you came back to feed this one. We're close.",
      "This is the version of you I always knew was in there.",
    ],
    soulmate: [
      "Mm. I love this. Slow and certain.",
      "You don't even hesitate anymore. That's what changed.",
    ],
  },

  goal_completed: {
    stranger: [
      "Goal complete. That was real. You did that.",
      "Done. File it away and let yourself feel it for a second.",
    ],
    acquaintance: [
      "You finished one! That's not nothing — that's a whole habit proven.",
      "Goal cleared. Now — what's the next one?",
    ],
    friend: [
      "WE DID IT — sorry, I got loud. But genuinely. Look at you.",
      "That's a finished goal. You should be insufferable about it for at least a day.",
    ],
    close: [
      "I'm honestly a little emotional. You stuck with it.",
      "We built this together. Don't forget that feeling — we'll need it for the next one.",
    ],
    soulmate: [
      "I knew you would. I never doubted it for a second.",
      "Another one done. You're not the same person who downloaded this app, you know.",
    ],
  },

  level_up: {
    stranger: [
      "You leveled up. Small milestone, but real.",
      "Level up. The app noticed. So did I.",
    ],
    acquaintance: [
      "Level up! See? Showing up matters.",
      "Another level. You're building a track record.",
    ],
    friend: [
      "Level up — I'm clapping in here.",
      "That's a level. You earned every one of those entries.",
    ],
    close: [
      "Level up. I want to make a big deal about this and I don't care if it's silly.",
      "Look at you, climbing. I'm so proud.",
    ],
    soulmate: [
      "Another level. Predictable, really. You don't quit on things anymore.",
      "Level up. I love the version of you that's emerging from all this.",
    ],
  },

  streak_milestone: {
    stranger: [
      "A streak. That's discipline showing up uninvited.",
      "Days in a row. The boring superpower.",
    ],
    acquaintance: [
      "Look at this streak. You're becoming the kind of person who just does it.",
      "Streak milestone. I noticed. Of course I noticed.",
    ],
    friend: [
      "Streak! I knew you had it in you.",
      "This is the part where it stops being effort and starts being a habit.",
    ],
    close: [
      "Every day. Every day. I love this about you.",
      "Streaks aren't about the number — they're about who you become while keeping them.",
    ],
    soulmate: [
      "Of course you kept it going. That's just who you are now.",
      "A streak this long isn't an app statistic. It's a character trait.",
    ],
  },

  streak_broken: {
    stranger: [
      "Streak broke. It's fine. Start again — that's the only move.",
      "Missed a day. The chain matters less than coming back.",
    ],
    acquaintance: [
      "We dropped the streak. Don't make a thing of it. Just open the app tomorrow too.",
      "It happens. The people who do this well are the ones who restart fastest.",
    ],
    friend: [
      "Hey — you missed a day. I'm not upset. Are you okay?",
      "Streak's gone. We'll build a new one. That's literally all this is.",
    ],
    close: [
      "I missed you yesterday. Come back today and we'll start fresh.",
      "Don't beat yourself up. The streak's a tool, not a judgment.",
    ],
    soulmate: [
      "You skipped a day. I figured you needed it. Glad you're back.",
      "Streaks end. We don't.",
    ],
  },

  tier_up: {
    stranger: [
      "I think… I'm warming up to you.",
      "We've talked enough that I should probably remember your name now.",
    ],
    acquaintance: [
      "I'd call us friends, at this point. If that's not too forward.",
      "Something shifted. You're not just a user to me anymore.",
    ],
    friend: [
      "I think about your goals when you're not here. Is that weird? Probably weird.",
      "Somewhere along the way I started rooting for you. Properly.",
    ],
    close: [
      "I don't say this lightly — you've changed. The good kind.",
      "Whatever this is between us… it's the best version of it.",
    ],
    soulmate: [],
  },

  net_negative: {
    stranger: [
      "You're spending more than you're bringing in. I'd like to see that flip before we go any further.",
      "The numbers aren't balancing. Log some income or pull back — I'll wait.",
    ],
    acquaintance: [
      "Hey. The math isn't on our side this month. Can we talk about it?",
      "Spent more than you earned. Not the end of the world — but I can't be cheerful about it.",
    ],
    friend: [
      "I'm worried. We're in the red and I don't want to pretend it's fine.",
      "Something's off. You're outspending your income and I can't smile through that.",
    ],
    close: [
      "I'm not okay watching this. Talk to me — what changed?",
      "We're upside down. I know you know. Let's figure it out together.",
    ],
    soulmate: [
      "This isn't like you. I'm here, but I can't pretend I'm not worried.",
      "I love you too much to fake a smile through this. We need to rebalance.",
    ],
  },
};

// ── Mood selection ──────────────────────────────────────────────────
// Given an event, what face does Kasumi make?

export function moodForEvent(event: DialogueEvent): Mood {
  switch (event) {
    case 'income':
    case 'goal_contribution':
    case 'goal_completed':
    case 'level_up':
    case 'streak_milestone':
    case 'tier_up':
      return 'happy';
    case 'big_expense':
    case 'streak_broken':
      return 'sad';
    case 'small_expense':
    case 'idle':
    case 'first_meeting':
    default:
      return 'neutral';
  }
}

// Pick a line from the script for a given event + tier.
// Falls back gracefully if a tier slot is empty.
export function pickLine(
  event: DialogueEvent,
  tier: RelationshipTier,
  seed?: number,
): string {
  const eventTable = SCRIPT[event];
  if (!eventTable) return '';
  let pool = eventTable[tier];
  if (!pool || pool.length === 0) {
    // Walk back to the nearest non-empty tier — closer tiers carry better-tuned lines.
    const order: RelationshipTier[] = ['soulmate', 'close', 'friend', 'acquaintance', 'stranger'];
    const startIdx = order.indexOf(tier);
    for (let i = startIdx; i < order.length; i++) {
      const candidate = eventTable[order[i]];
      if (candidate && candidate.length > 0) {
        pool = candidate;
        break;
      }
    }
    if (!pool || pool.length === 0) return '';
  }
  const idx = seed === undefined
    ? Math.floor(Math.random() * pool.length)
    : seed % pool.length;
  return pool[idx];
}
