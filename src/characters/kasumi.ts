import type { CharacterDef, ScriptTable } from './types';

const SCRIPT: ScriptTable = {
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
    stranger: ["Noted.", "Recorded. Small ones add up."],
    acquaintance: ["That's fine. Small ones are usually fine.", "Logged. Nothing to flag."],
    friend: ["Got it. You're good.", "Reasonable. Keep going."],
    close: ["No notes. Enjoy it.", "That's living, not leaking."],
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
    acquaintance: ["Yes — that's the move. Brick by brick.", "I like that. Keep that rhythm."],
    friend: [
      "Look at us actually doing this. Again tomorrow?",
      "Every contribution makes the goal a little less abstract.",
    ],
    close: [
      "I'm so glad you came back to feed this one. We're close.",
      "This is the version of you I always knew was in there.",
    ],
    soulmate: ["Mm. I love this. Slow and certain.", "You don't even hesitate anymore. That's what changed."],
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
    stranger: ["You leveled up. Small milestone, but real.", "Level up. The app noticed. So did I."],
    acquaintance: ["Level up! See? Showing up matters.", "Another level. You're building a track record."],
    friend: ["Level up — I'm clapping in here.", "That's a level. You earned every one of those entries."],
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
    stranger: ["A streak. That's discipline showing up uninvited.", "Days in a row. The boring superpower."],
    acquaintance: [
      "Look at this streak. You're becoming the kind of person who just does it.",
      "Streak milestone. I noticed. Of course I noticed.",
    ],
    friend: ["Streak! I knew you had it in you.", "This is the part where it stops being effort and starts being a habit."],
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
    soulmate: ["You skipped a day. I figured you needed it. Glad you're back.", "Streaks end. We don't."],
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

// Interactive choice prompts — warm, earnest. Replies that show care,
// honesty, or sensible money-thinking please her (affection); some grant
// coins; a few misread her and cost a little affection.
const CHOICE_PROMPTS: import('./types').ChoicePrompt[] = [
  {
    id: 'k_coffee',
    prompt: "Be honest with me — that coffee habit. Are we tracking it, or pretending it doesn't happen?",
    options: [
      { label: "Tracking every cup, I promise.", affection: 5, coins: 0, reaction: "Good. The honest little numbers are the ones that change things." },
      { label: "...Pretending. Loudly.", affection: 0, coins: 30, reaction: "Ha! At least you're honest about the dishonesty. Here — caffeine fund. Use it wisely." },
      { label: "Coffee's a need, not a want.", affection: -2, coins: 0, reaction: "Mm. That's the kind of thing we tell ourselves at 3pm. I'll let it go. This time." },
    ],
  },
  {
    id: 'k_weekend',
    prompt: "Quiet weekend coming up. What's the plan — rest, or chase something?",
    options: [
      { label: "Rest. Recharge. No spending.", affection: 4, coins: 0, reaction: "I love that for you. Rest is free and you've earned it." },
      { label: "Pick up a side gig.", affection: 2, coins: 40, reaction: "Ambitious. I admire it — just don't burn out on me. Here, a little something." },
      { label: "Treat myself, obviously.", affection: -1, coins: 0, reaction: "Okay, okay. Just… a small treat. We're still watching that balance." },
    ],
  },
  {
    id: 'k_future',
    minTier: 'friend',
    prompt: "Can I ask something real? When you picture having money sorted — what's the first feeling?",
    options: [
      { label: "Safe. Finally safe.", affection: 6, coins: 0, reaction: "...Yeah. That's the one that matters. We're building toward exactly that." },
      { label: "Free to help people I love.", affection: 6, coins: 0, reaction: "Oh. That's a beautiful reason to be careful with it. I mean that." },
      { label: "Rich enough to stop counting.", affection: -2, coins: 20, reaction: "Counting isn't the enemy, you know. But… I get the dream. Here." },
    ],
  },
  {
    id: 'k_slip',
    prompt: "You went a little over budget this week. How are we feeling about it?",
    options: [
      { label: "Owning it. Back on track tomorrow.", affection: 5, coins: 0, reaction: "That's maturity, right there. One week doesn't undo you." },
      { label: "Already adjusted next week's plan.", affection: 3, coins: 25, reaction: "Proactive. That's the good stuff. A little reward for thinking ahead." },
      { label: "It's fine, it doesn't matter.", affection: -3, coins: 0, reaction: "It's not a crisis… but it does matter. I'd rather we don't pretend it doesn't." },
    ],
  },
  {
    id: 'k_gift',
    minTier: 'close',
    prompt: "If I could give you one thing right now — advice or a little cash for a goal — which?",
    options: [
      { label: "Your advice. Always.", affection: 7, coins: 0, reaction: "...You're going to make me emotional. Okay. Advice it is, for as long as you want it." },
      { label: "The cash, let's be real.", affection: 0, coins: 60, reaction: "Pragmatic. I respect it. Don't say I never gave you anything." },
      { label: "Why not both?", affection: -1, coins: 30, reaction: "Cheeky. Fine — a little of both. You're lucky I like you." },
    ],
  },
];

export const KASUMI: CharacterDef = {
  id: 'kasumi',
  name: 'Kasumi',
  kanji: '賢美',
  blurb: 'Calm, steady, quietly encouraging. Your patient second opinion on money.',
  accent: '#a855f7',
  portraits: {
    neutral: require('../../assets/images/kasumi/neutral.png'),
    happy:   require('../../assets/images/kasumi/happy.jpeg'),
    sad:     require('../../assets/images/kasumi/sad.jpeg'),
  },
  script: SCRIPT,
  choicePrompts: CHOICE_PROMPTS,
  unlockedByDefault: true,
};
