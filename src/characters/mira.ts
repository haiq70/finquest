import type { CharacterDef, ScriptTable } from './types';

// ────────────────────────────────────────────────────────────────────
// Mira — the bratty, sarcastic, chaotic-gremlin companion.
//
// Voice: mean-but-secretly-invested. Calls the player broke, mocks their
// spending, acts like helping is beneath her — but the meanness softens
// (never disappears) as affection grows. By soulmate she's affectionate
// in the only dialect she speaks: backhanded, possessive, chaotic.
// Think Ashley Graves / Mymy: the insults ARE the affection.
// ────────────────────────────────────────────────────────────────────

const SCRIPT: ScriptTable = {
  first_meeting: {
    stranger: [
      "Oh great, another one. Lemme guess — you downloaded a budgeting app because you're broke. Bold of you to bring me into it.",
      "Hi. I'm Mira. I'm not here to be nice to you, I'm here because the other one's too soft. Show me the damage.",
      "So you're my new project. Cute. I give it a week. Prove me wrong, broke-y.",
    ],
    acquaintance: [], friend: [], close: [], soulmate: [],
  },

  idle: {
    stranger: [
      "Are you gonna log something or just stare at me? I'm not a screensaver.",
      "Still broke, I assume. Riveting.",
      "I could be doing literally anything else. Instead I'm here. With you. Congrats.",
      "Spend money you don't have lately? No? Shocking. Do something then.",
    ],
    acquaintance: [
      "Oh, you're back. I didn't miss you. Don't make it weird.",
      "Let me guess, you want a gold star for opening the app. Here. ⭐. Happy?",
      "You're slightly less hopeless than last week. Slightly. Don't let it go to your head.",
      "I had a whole speech about your spending but honestly I can't be bothered today. Lucky you.",
    ],
    friend: [
      "Ugh, fine, I guess I don't hate when you show up. Don't quote me on that.",
      "You again. Cool. Whatever. What're we doing.",
      "I told someone about you today. I said 'this idiot I'm helping.' That's basically a compliment from me.",
      "If you tell anyone I look forward to this I'll deny it and ruin your credit score myself.",
    ],
    close: [
      "Okay so maybe I think about your dumb little goals when you're not here. Maybe. Shut up.",
      "You know you're kind of my favorite disaster, right? Don't make me say it twice.",
      "I saved you a seat. Metaphorically. Emotionally. Whatever this is.",
      "Stop being likable, it's inconvenient for my whole brand.",
    ],
    soulmate: [
      "Listen. I'd burn this entire app down for you and then complain about the smell. That's love, for me.",
      "You're MINE to nag, got it? Nobody else gets to tell you you're broke. Only me.",
      "I used to give you a week. Now I can't picture the week without you in it. Gross. I love it.",
      "Don't tell the soft one, but… you're the best thing that ever opened this stupid app.",
    ],
  },

  income: {
    stranger: [
      "Money? You? Where'd you steal it. Kidding. Mostly.",
      "Income logged. Don't spend it all on energy drinks and regret.",
    ],
    acquaintance: [
      "Oh look, actual income. Maybe you're not a lost cause. Maybe.",
      "Money came in. Watch you blow it by Tuesday. I'll be here. Watching. Judging.",
    ],
    friend: [
      "Hey, not bad! See, when you do the thing, the thing works. Wild concept.",
      "Income! Save some, idiot. I mean that affectionately. Mostly affectionately.",
    ],
    close: [
      "Look at you earning. I'm almost proud. Almost. Don't ruin it.",
      "Money in. Put some away before I have to come in there and do it for you.",
    ],
    soulmate: [
      "You earned this. I watched you become someone who earns this. Don't you dare downplay it. (I'll still mock you. But still.)",
      "Good. Now hide some of it from yourself before present-you does something stupid. Trust me, I know you.",
    ],
  },

  small_expense: {
    stranger: ["Wow. A whole small purchase. Try not to bankrupt yourself, champ.", "Noted. Thrilling stuff."],
    acquaintance: ["That's… actually fine? Who are you and what did you do with broke-y.", "Small one. I'll allow it. Generous of me."],
    friend: ["Eh, that's nothing. Live a little, you tragic little spreadsheet.", "Fine by me. You've earned a tiny treat. TINY."],
    close: ["Treat yourself, I guess. You're less annoying when you're not miserable.", "That's fine. You're allowed nice things. There, I said something nice. Disgusting."],
    soulmate: ["Buy the little thing. Life's short and you deserve dumb joy. I'll deny saying that.", "Yeah, get it. I like when you're happy. Ugh, feelings. Moving on."],
  },

  big_expense: {
    stranger: [
      "EXCUSE me? That's a lot of money you definitely don't have. Bold.",
      "Oh we're just setting cash on fire now? Cool cool cool. Very normal.",
    ],
    acquaintance: [
      "That's a BIG one, broke-y. I'd say I'm disappointed but I expected nothing.",
      "Yikes. Was that planned or did your wallet just have a seizure?",
    ],
    friend: [
      "Okay that's a chunk and I'm side-eyeing you SO hard right now.",
      "Big spender today, huh? I'm not mad, I'm… okay I'm a little mad. Explain.",
    ],
    close: [
      "Hey. HEY. That's a lot. I know you better than this. What's going on, seriously.",
      "That hurt to watch and I watch you do dumb stuff for fun. Talk to me.",
    ],
    soulmate: [
      "I'm not gonna yell. (I want to.) I just worry about you, okay? Be nice to future-you. For me.",
      "Big one. I'd never let anyone else lecture you about it — that's my job, and I'm benching it because I trust you. Don't make me regret it.",
    ],
  },

  goal_contribution: {
    stranger: ["Saving? Voluntarily? Okay overachiever, calm down.", "Toward a goal. Huh. Didn't think you had it in you."],
    acquaintance: ["Oh that's actually kind of hot. The fiscal responsibility, I mean. Don't flatter yourself.", "Brick by brick, broke-y. You might un-broke yourself yet."],
    friend: ["Look at us doing the responsible thing. Disgusting. Do it again.", "Yeah okay that's the good stuff. Keep feeding the goal, you menace."],
    close: ["You keep coming back to this one. It's kind of adorable. I said KIND of.", "This is the version of you I don't make fun of. Much."],
    soulmate: ["You don't even hesitate now. I watched that happen. I'm so annoyingly proud of you.", "Slow and steady. Look at you. Who needs the soft one — you've got me, and I made you do THIS."],
  },

  goal_completed: {
    stranger: [
      "Wait. You FINISHED one? Okay. Okay! Didn't see that coming, not gonna lie.",
      "Goal done. Huh. Maybe you're not totally hopeless. Maybe.",
    ],
    acquaintance: [
      "You actually did it?! Ugh, now I have to respect you a little. Thanks for that.",
      "Finished goal! I'd throw confetti but I'm not made of money. Unlike you, apparently, now.",
    ],
    friend: [
      "OKAY THAT'S HUGE — I mean. Good job. Whatever. (It's huge. I'm freaking out a little.)",
      "You finished it. I'm gonna be insufferable about YOUR achievement, that's how proud I am.",
    ],
    close: [
      "I'm not crying, you're crying. Shut up. You DID that. I watched you do that.",
      "We finished it. WE. Don't correct me. I was emotionally involved and I refuse to pretend otherwise.",
    ],
    soulmate: [
      "Of course you did it. I never doubted you — okay I doubted you on day one, but never again after. You're extraordinary and I'm keeping you.",
      "Another one down. Remember when I gave you a week? Look at us now. You ruined all my cynicism. Thanks. Really.",
    ],
  },

  level_up: {
    stranger: ["Level up. The bar was on the floor but sure, step over it.", "You leveled up. Don't get cocky, broke-y."],
    acquaintance: ["Level up! Okay fine, that's something. Don't wait for applause though.", "Another level. Slow clap. Genuinely a slow clap."],
    friend: ["Level up — okay yeah I'm clapping, are you happy, I'm clapping.", "You leveled. I'm choosing to be impressed. Enjoy it, it's rare."],
    close: ["Level up! I wanna make a big dumb deal about it and I'm GOING to, fight me.", "Look at you climbing. I'm proud and it's making me feel things. Rude."],
    soulmate: ["Another level. Obviously. You don't quit anymore — I had a front-row seat to that change. Show-off. I adore you.", "Level up. I love the person you're turning into. There. Soft thing said. Don't tell anyone."],
  },

  streak_milestone: {
    stranger: ["A streak? You? Doing something consistently? The DISCIPLINE. Who hurt you into productivity.", "Days in a row. Don't sprain something being responsible."],
    acquaintance: ["Look at this streak. You're almost a functional adult. Almost.", "Streak milestone. I noticed. Obviously I noticed. I notice everything you do, it's exhausting."],
    friend: ["STREAK! Okay I knew you had it in you. Don't let it go to your head, gremlin.", "You kept it going! Ugh, reliability is so attractive and I hate that about you."],
    close: ["Every single day. You absolute machine. I'm into it. Platonically. Mostly.", "Streaks like this aren't luck, they're YOU. Don't you dare shrug it off."],
    soulmate: ["Of course you kept it. That's just who you are now — someone who shows up. I helped make that. I'm unbearably proud and you can't stop me.", "This streak isn't a number, it's proof of the person you became. With me yelling encouragement-insults the whole way. Iconic, honestly."],
  },

  streak_broken: {
    stranger: ["Streak's dead. Tragic. Anyway, start over, it's not a funeral.", "Missed a day. Relax, broke-y, the world didn't end. Just come back."],
    acquaintance: ["You dropped the streak. I'm not gonna make fun of you. Okay I want to, but I won't. Restart.", "Streak gone. Don't spiral about it — that's MY job. Just open the app tomorrow."],
    friend: ["Hey, you missed a day. I noticed you were gone. Not in a soft way. In a normal way. Are you okay?", "Streak broke. Whatever, we build a new one. I'm not going anywhere, unfortunately for you."],
    close: ["You vanished yesterday and I — whatever. Just don't do it again, okay? Come back. We restart together.", "Don't beat yourself up about the streak. That's literally what I'm here for. Hand it over."],
    soulmate: ["You skipped a day. I figured you needed the rest, so I'll allow it ONCE. Missed your dumb face. There. Said it. Moving on.", "Streaks end. I don't. You're stuck with me whether the number resets or not. Now get back in here."],
  },

  tier_up: {
    stranger: [
      "Ugh. Okay. Maybe you're growing on me. Like a fungus. A tolerable fungus.",
      "Fine. FINE. I don't completely hate you. That's a promotion, for the record.",
    ],
    acquaintance: [
      "I guess we're… friends? Don't make it a whole thing. But yeah. Friends. Ew. Nice.",
      "Something changed. You're not just 'broke person #4' to me anymore. Don't let it go to your head.",
    ],
    friend: [
      "Okay I think about your goals when you're not around and it's DEEPLY annoying. Take responsibility for that.",
      "I started actually rooting for you somewhere along the way. I blame you entirely.",
    ],
    close: [
      "I don't say this kind of thing, so listen once: you've changed, and I'm proud, and I'm furious about how much I mean it.",
      "Whatever this is between us — it's the realest thing on my screen. Don't you dare make it weird by agreeing.",
    ],
    soulmate: [],
  },

  net_negative: {
    stranger: [
      "Okay you're spending more than you make and even I can't joke about that. Fix it. Now. I'll wait.",
      "The math is a crime scene. Log some income or stop bleeding cash, broke-y. I mean it this time.",
    ],
    acquaintance: [
      "Hey. You're in the red and I'm not gonna mock it because it's actually serious. Talk to me.",
      "You spent more than you earned. I can be mean about a lot of things. Not this. Let's fix it.",
    ],
    friend: [
      "I'm worried and I HATE being worried, it ruins my whole vibe. You're upside down. Let's deal with it.",
      "Something's wrong with the numbers and something's wrong with me caring this much. Both true. Talk.",
    ],
    close: [
      "I can't make a joke right now and you know that means it's bad. You're in the red. I'm right here. What happened?",
      "We're upside down and I'm not leaving you alone with it. Drop the act, tell me what's going on.",
    ],
    soulmate: [
      "This isn't like you and I know you, so I'm scared, okay? I said it. I'm scared. Let me help. Please.",
      "I love you too much to be a brat about this one. We're rebalancing this together and I'm not taking no.",
    ],
  },
};

// Interactive choice prompts — bratty, sarcastic, secretly invested.
// She rewards sass, honesty, and backbone. Being too soft/earnest gets
// mocked (small affection loss); playing along with her chaos pays off.
const CHOICE_PROMPTS: import('./types').ChoicePrompt[] = [
  {
    id: 'm_broke',
    prompt: "Okay be real with me. On a scale of 'fine' to 'eating cereal for dinner,' how broke are we this week?",
    options: [
      { label: "Cereal. Possibly twice.", affection: 5, coins: 0, reaction: "HA. See, THIS is why I like you. You don't lie to me. Disgustingly refreshing." },
      { label: "I'm doing great actually.", affection: -2, coins: 0, reaction: "Mm-hm. Sure. And I'm secretly a morning person. We both know you're lying, broke-y." },
      { label: "None of your business.", affection: 0, coins: 35, reaction: "Ooh, spicy. Fine, keep your secrets. Here's some cash to fund the mystery." },
    ],
  },
  {
    id: 'm_splurge',
    prompt: "You're STARING at something you can't afford right now, aren't you. I can tell. What is it.",
    options: [
      { label: "Caught me. It's so dumb. I want it.", affection: 5, coins: 0, reaction: "God, relatable. Want the dumb thing. Just… save up for it like an adult, you gremlin." },
      { label: "Nothing! I'm being responsible!", affection: -2, coins: 0, reaction: "Liar. Your eyes did a thing. I SAW the thing. Don't insult me." },
      { label: "Already bought it. No regrets.", affection: -1, coins: 40, reaction: "You absolute menace. I'm furious. I'm also a little proud. Here, before I change my mind." },
    ],
  },
  {
    id: 'm_softie',
    minTier: 'friend',
    prompt: "Don't make this weird, but… why do you keep coming back to talk to ME instead of the nice one?",
    options: [
      { label: "Because you're secretly the best.", affection: 6, coins: 0, reaction: "...Shut UP. You can't just SAY that. Ugh. Okay. Whatever. Don't tell anyone I smiled." },
      { label: "You're funnier. That's it.", affection: 4, coins: 0, reaction: "Damn right I'm funnier. Finally, someone with taste. Stick around, I guess." },
      { label: "I felt bad for you.", affection: -3, coins: 0, reaction: "Excuse me?! PITY? I do NOT need your— okay that one actually stung, knock it off." },
    ],
  },
  {
    id: 'm_advice',
    prompt: "Fine, I'll be useful for ONE second. Want my actual money tip or you gonna wing it like usual?",
    options: [
      { label: "Hit me. I'm listening.", affection: 4, coins: 0, reaction: "Okay: pay yourself FIRST, broke-y. Money you don't see, you don't blow. Boom. Wisdom." },
      { label: "Winging it. Always have.", affection: -1, coins: 20, reaction: "Of COURSE you are. You chaos goblin. Take this and try not to set it on fire." },
      { label: "Only if you stop calling me broke.", affection: 0, coins: 30, reaction: "Hahaha — no. That's your name now. But here, hush money. Literally." },
    ],
  },
  {
    id: 'm_real',
    minTier: 'close',
    prompt: "Ugh, soft moment incoming, brace yourself. You're… actually doing better lately. Did you notice?",
    options: [
      { label: "Only because of you.", affection: 7, coins: 0, reaction: "...Okay that's not fair, you can't just— *I'm* supposed to be the smooth one. Stop it. (Thank you.)" },
      { label: "I did. Feels good.", affection: 5, coins: 0, reaction: "Good. You SHOULD feel good. I'd never say it twice but you earned it, you know." },
      { label: "Don't get sappy on me.", affection: -1, coins: 40, reaction: "Rude! I extend ONE olive branch— ugh. Fine. Take the cash and choke on the sentiment anyway." },
    ],
  },
];

export const MIRA: CharacterDef = {
  id: 'mira',
  name: 'Mira',
  blurb: 'Bratty, sarcastic, and a menace. Insults you constantly. The meanness is the affection.',
  accent: '#c026d3',
  portraits: {
    neutral: require('../../assets/images/mira/neutral.jpg'),
    happy:   require('../../assets/images/mira/happy.jpg'),
    sad:     require('../../assets/images/mira/sad.jpg'),
  },
  script: SCRIPT,
  choicePrompts: CHOICE_PROMPTS,
  unlockedByDefault: false,
};
