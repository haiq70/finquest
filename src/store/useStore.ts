import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../utils/safeStorage';
import {
  BASE_BALANCE,
  Category,
  XP_PER_LEVEL,
} from '../theme';
import { todayString, yesterdayString } from '../utils/format';
import {
  AFFECTION_MAX,
  clampAffection,
  moodEventForExpense,
  moodEventForGoalContribution,
  moodEventForIncome,
  MOOD_EVENT_GOAL_COMPLETED,
  MOOD_EVENT_LEVEL_UP,
  MOOD_EVENT_STREAK_BROKEN,
  MOOD_EVENT_STREAK_MILESTONE,
  MOOD_EVENT_TIER_UP,
  STREAK_MILESTONES,
  type MoodEvent,
} from '../kasumi/affection';
import {
  pickLineFor,
  tierFromAffection,
  getCharacter,
  CHARACTERS,
  DEFAULT_CHARACTER_ID,
  type CharacterId,
  type CharacterDef,
  type DialogueEvent,
  type Mood,
  type RelationshipTier,
} from '../characters';
import {
  BASE_XP_GOAL_CONTRIB,
  BASE_XP_INCOME,
  calcSavingXp,
  streakMultiplier,
  type XpAward,
} from '../kasumi/xp';
import {
  checkNewAchievements,
  type AchievementDef,
  type AchievementSnapshot,
} from '../kasumi/achievements';
import {
  SHOP_ITEM_MAP,
  type ShopItem,
  type AvatarSlot,
} from '../shop/shopCatalogue';
import {
  coinsForTransaction,
  coinsForGoalContrib,
  coinsForAchievement,
  DAILY_COIN_TX_CAP,
} from '../shop/coins';

// ── Types ──────────────────────────────────────────────────────────

export type TxType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  description: string;
  category: Category;
  date: string; // ISO string
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  target: number;
  saved: number;
  color: string;
}

export interface LeaderboardEntry {
  id: string;
  initials: string;
  name: string;
  xp: number;
  level: number;
  bg: string;
  fg: string;
  isMe?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────

export function calcLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function calcXpInLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

// ── Companion state ─────────────────────────────────────────────────
// Per-character relationship progress. The active character's copy is
// mirrored into the store's top-level fields; the rest live in `companions`.
export interface CompanionState {
  affection: number;
  hasMet: boolean;
  lastTierKey: RelationshipTier;
  currentMood: Mood;
  currentEvent: DialogueEvent;
  currentLine: string;
  moodExpiresAt: number | null;
}

function freshCompanion(): CompanionState {
  return {
    affection: 0,
    hasMet: false,
    lastTierKey: 'stranger',
    currentMood: 'neutral',
    currentEvent: 'idle',
    currentLine: '',
    moodExpiresAt: null,
  };
}

function freshCompanionMap(): Record<CharacterId, CompanionState> {
  const map = {} as Record<CharacterId, CompanionState>;
  for (const c of CHARACTERS) map[c.id] = freshCompanion();
  return map;
}

// ── Store ──────────────────────────────────────────────────────────

interface StoreState {
  transactions: Transaction[];
  xp: number;
  streak: number;
  lastLogDate: string | null;
  goals: Goal[];

  // ── Saving-streak tracking (separate from activity streak) ────
  // savingStreak counts consecutive days with at least one saving
  // action (income OR goal contribution). Drives XP multipliers.
  savingStreak: number;
  lastSavingDate: string | null;

  // ── Last XP award (for transient UI feedback) ─────────────────
  lastXpAward: XpAward | null;

  // ── Companion (active character) ──────────────────────────────
  // The top-level fields below mirror the *currently active* character.
  // Inactive characters' progress is stashed in `companions`.
  activeCharacterId: CharacterId;
  unlockedCharacterIds: CharacterId[];
  // Saved state for every character (including the active one, synced on change).
  companions: Record<CharacterId, CompanionState>;
  // When a new character unlocks, this holds their id until the UI shows
  // the unlock popup, then it's cleared.
  pendingCharacterUnlock: CharacterId | null;
  // First-launch story intro: false until the player has seen the opening
  // popup that introduces the premise + Kasumi.
  hasSeenIntro: boolean;

  affection: number;            // 0..100 (active character)
  hasMet: boolean;              // false until first interaction
  lastTierKey: RelationshipTier;// to detect tier-ups
  currentMood: Mood;            // which face to render right now
  currentEvent: DialogueEvent;  // what they're reacting to right now
  currentLine: string;          // line associated with currentEvent
  moodExpiresAt: number | null; // epoch ms when mood relaxes to idle

  // ── Achievements ──────────────────────────────────────────────
  unlockedAchievementIds: string[];
  pendingAchievements: AchievementDef[];

  // ── Shop & Currency ───────────────────────────────────────────
  coins: number;                           // current FC balance
  totalCoinsEarned: number;                // lifetime total (for stats)
  // Owned items: itemId → quantity (consumables) or 1 (accessories)
  ownedItems: Record<string, number>;
  // Equipped accessories per slot
  equippedItems: Partial<Record<AvatarSlot, string>>;
  // Active timed effects
  activeXpBoost: { multiplier: number; expiresAt: number } | null;
  activeCoinBoost: { multiplier: number; expiresAt: number } | null;
  // Streak-freeze count (separate from ownedItems for quick access)
  streakFreezes: number;
  // Pending coin award for toast feedback (similar to lastXpAward)
  lastCoinAward: { amount: number; reason: string } | null;
  // Daily coin-earning cap tracking (anti-exploit)
  coinTxDate: string | null;   // date the count applies to (todayString)
  coinTxCount: number;         // coin-earning transactions logged that date

  // Actions
  clearPendingAchievements: () => void;
  shiftPendingAchievement: () => void;
  // Shop actions
  purchaseItem: (itemId: string) => { success: boolean; error?: string };
  equipItem: (itemId: string) => void;
  unequipSlot: (slot: AvatarSlot) => void;
  activateItem: (itemId: string) => void;   // activates consumables from inventory
  tickBoosts: () => void;                   // expire timed boosts
  clearLastCoinAward: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id'>>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number) => void;

  // Companion actions
  markMet: () => void;
  refreshIdleLine: () => void;     // pick a new ambient line
  acknowledgeMood: () => void;     // user tapped the speech bubble → relax to idle
  tickMood: () => void;            // called periodically; relaxes expired mood
  setActiveCharacter: (id: CharacterId) => void;  // switch active companion
  clearPendingCharacterUnlock: () => void;        // dismiss the unlock popup
  markIntroSeen: () => void;                       // dismiss the first-launch intro

  // Derived (computed on the fly — not stored)
  getTotals: () => { income: number; expenses: number; balance: number };
  getLevel: () => number;
  getXpInLevel: () => number;
  getCategoryBreakdown: () => [Category, number][];
  getLeaderboardWithMe: () => Array<LeaderboardEntry & { rank: number }>;
  getMonthlyTotals: () => { income: number; expenses: number; saved: number };
  getTier: () => ReturnType<typeof tierFromAffection>;
  isNetNegative: () => boolean;            // expenses > income overall
  getDisplayMood: () => Mood;              // factors in net-negative override
}

const STATIC_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'u1', initials: 'JL', name: 'Julie L.',  xp: 820, level: 12, bg: '#fef3c7', fg: '#b45309' },
  { id: 'u2', initials: 'MR', name: 'Marc R.',   xp: 640, level: 9,  bg: '#e0e7ff', fg: '#4338ca' },
  { id: 'u3', initials: 'SB', name: 'Sophie B.', xp: 590, level: 8,  bg: '#fce7f3', fg: '#9d174d' },
  { id: 'u5', initials: 'TK', name: 'Thomas K.', xp: 210, level: 5,  bg: '#ecfdf5', fg: '#065f46' },
];

const DEFAULT_GOALS: Goal[] = [
  { id: 'g1', name: 'Vacation',  icon: '🏖️', target: 1200, saved: 0,  color: '#6366f1' },
  { id: 'g2', name: 'Laptop',    icon: '💻', target: 800,  saved: 0,  color: '#8b5cf6' },
  { id: 'g3', name: 'Emergency', icon: '🛡️', target: 3000, saved: 0,  color: '#06b6d4' },
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      // ── Internal helper ─────────────────────────────────────
      // Apply a MoodEvent: bump affection, set face + line, detect
      // tier-up and overlay the tier-up reaction if it happened.
      function applyMoodEvent(me: MoodEvent) {
        const state = get();
        const charId = state.activeCharacterId;
        const oldTier = tierFromAffection(state.affection);
        const newAffection = clampAffection(state.affection + me.affectionDelta);
        const newTier = tierFromAffection(newAffection);
        const tierChanged = newTier.key !== oldTier.key && me.affectionDelta > 0;

        // If we crossed into a higher tier, the tier-up reaction wins.
        const finalEvent = tierChanged ? MOOD_EVENT_TIER_UP.event : me.event;
        const finalMood: Mood =
          finalEvent === 'income' || finalEvent === 'goal_contribution' ||
          finalEvent === 'goal_completed' || finalEvent === 'level_up' ||
          finalEvent === 'streak_milestone' || finalEvent === 'tier_up'
            ? 'happy'
            : finalEvent === 'big_expense' || finalEvent === 'streak_broken'
              ? 'sad'
              : 'neutral';
        const finalDuration = tierChanged
          ? Math.max(me.durationMs, MOOD_EVENT_TIER_UP.durationMs)
          : me.durationMs;
        const finalLine = pickLineFor(charId, finalEvent, newTier.key);

        // Story unlock: when Kasumi advances past her first tier (stranger →
        // acquaintance), Mira becomes available. Queue the unlock popup.
        let unlockPatch: Partial<StoreState> = {};
        if (
          tierChanged &&
          charId === 'kasumi' &&
          oldTier.key === 'stranger' &&
          !state.unlockedCharacterIds.includes('mira')
        ) {
          unlockPatch = {
            unlockedCharacterIds: [...state.unlockedCharacterIds, 'mira'],
            pendingCharacterUnlock: 'mira',
          };
        }

        set({
          affection: newAffection,
          lastTierKey: newTier.key,
          currentMood: finalMood,
          currentEvent: finalEvent,
          currentLine: finalLine,
          moodExpiresAt: Date.now() + finalDuration,
          ...unlockPatch,
        });
      }

      // ── Achievement helper ──────────────────────────────────────
      const checkAndQueueAchievements = () => {
        const s = get();
        const snap: AchievementSnapshot = {
          transactions: s.transactions,
          xp: s.xp,
          streak: s.streak,
          savingStreak: s.savingStreak,
          goals: s.goals,
          affection: s.affection,
          unlockedIds: s.unlockedAchievementIds,
        };
        const newOnes = checkNewAchievements(snap);
        if (newOnes.length === 0) return;
        // Each newly-unlocked achievement grants a one-time coin reward
        // scaled by rarity. Summed so multiple unlocks in one action pay out together.
        const achievementCoins = newOnes.reduce(
          (sum, a) => sum + coinsForAchievement(a.rarity).amount, 0,
        );
        set(st => ({
          unlockedAchievementIds: [
            ...st.unlockedAchievementIds,
            ...newOnes.map(a => a.id),
          ],
          pendingAchievements: [...st.pendingAchievements, ...newOnes],
          coins: st.coins + achievementCoins,
          totalCoinsEarned: st.totalCoinsEarned + achievementCoins,
        }));
      };

      return {
        transactions: [],
        xp: 0,
        streak: 0,
        lastLogDate: null,
        goals: DEFAULT_GOALS,

        // Saving-streak defaults
        savingStreak: 0,
        lastSavingDate: null,
        lastXpAward: null,

        // Companion defaults
        activeCharacterId: DEFAULT_CHARACTER_ID,
        unlockedCharacterIds: CHARACTERS.filter(c => c.unlockedByDefault).map(c => c.id),
        companions: freshCompanionMap(),
        pendingCharacterUnlock: null,
        hasSeenIntro: false,

        affection: 0,
        hasMet: false,
        lastTierKey: 'stranger' as RelationshipTier,
        currentMood: 'neutral' as Mood,
        currentEvent: 'idle' as DialogueEvent,
        currentLine: '',
        moodExpiresAt: null,

        // Achievement defaults
        unlockedAchievementIds: [],
        pendingAchievements: [],

        // Shop & currency defaults
        coins: 0,
        totalCoinsEarned: 0,
        ownedItems: {},
        equippedItems: {},
        activeXpBoost: null,
        activeCoinBoost: null,
        streakFreezes: 0,
        lastCoinAward: null,
        coinTxDate: null,
        coinTxCount: 0,

        // ── Actions ────────────────────────────────────────────

        clearPendingAchievements() {
          set({ pendingAchievements: [] });
        },

        shiftPendingAchievement() {
          set(st => ({ pendingAchievements: st.pendingAchievements.slice(1) }));
        },

        // ── Shop actions ───────────────────────────────────────

        purchaseItem(itemId) {
          const item = SHOP_ITEM_MAP[itemId];
          if (!item) return { success: false, error: 'Item not found.' };
          const s = get();
          if (s.coins < item.price) return { success: false, error: 'Not enough coins.' };
          // Check max-owned limit
          const currentQty = s.ownedItems[itemId] ?? 0;
          if (item.maxOwned !== undefined && currentQty >= item.maxOwned) {
            return { success: false, error: `You can hold at most ${item.maxOwned} of this item.` };
          }
          // Streak freeze special handling — track separately for easy access
          const freezeAdd = item.type === 'streak_freeze' ? (item.uses ?? 1) : 0;
          // Cap total freezes at 2 (Duolingo rule)
          if (item.type === 'streak_freeze') {
            const newTotal = s.streakFreezes + freezeAdd;
            if (newTotal > 2) return { success: false, error: 'You can hold at most 2 streak freezes.' };
          }
          set(st => ({
            coins: st.coins - item.price,
            ownedItems: {
              ...st.ownedItems,
              [itemId]: (st.ownedItems[itemId] ?? 0) + (item.uses ?? 1),
            },
            streakFreezes: item.type === 'streak_freeze'
              ? Math.min(2, st.streakFreezes + freezeAdd)
              : st.streakFreezes,
          }));
          return { success: true };
        },

        equipItem(itemId) {
          const item = SHOP_ITEM_MAP[itemId];
          if (!item || item.type !== 'avatar_accessory' || !item.slot) return;
          const owned = get().ownedItems[itemId] ?? 0;
          if (owned <= 0) return;
          set(st => ({
            equippedItems: { ...st.equippedItems, [item.slot!]: itemId },
          }));
        },

        unequipSlot(slot) {
          set(st => {
            const next = { ...st.equippedItems };
            delete next[slot];
            return { equippedItems: next };
          });
        },

        activateItem(itemId) {
          const item = SHOP_ITEM_MAP[itemId];
          if (!item) return;
          const s = get();
          const owned = s.ownedItems[itemId] ?? 0;
          if (owned <= 0) return;
          const now = Date.now();
          const newOwned = { ...s.ownedItems, [itemId]: owned - 1 };
          if (item.type === 'xp_booster' && item.durationHours && item.xpMultiplier) {
            set({
              ownedItems: newOwned,
              activeXpBoost: {
                multiplier: item.xpMultiplier,
                expiresAt: now + item.durationHours * 3600 * 1000,
              },
            });
          } else if (item.type === 'coin_magnet' && item.durationHours && item.coinBonus) {
            set({
              ownedItems: newOwned,
              activeCoinBoost: {
                multiplier: item.coinBonus,
                expiresAt: now + item.durationHours * 3600 * 1000,
              },
            });
          }
        },

        tickBoosts() {
          const now = Date.now();
          const s = get();
          const updates: Partial<typeof s> = {};
          if (s.activeXpBoost && now >= s.activeXpBoost.expiresAt) updates.activeXpBoost = null;
          if (s.activeCoinBoost && now >= s.activeCoinBoost.expiresAt) updates.activeCoinBoost = null;
          if (Object.keys(updates).length) set(updates);
        },

        clearLastCoinAward() {
          set({ lastCoinAward: null });
        },

        addTransaction(tx) {
          const today = todayString();
          const yesterday = yesterdayString();
          const newTx: Transaction = {
            ...tx,
            id: Date.now().toString(),
            date: new Date().toISOString(),
          };

          const state = get();
          let { streak, lastLogDate, savingStreak, lastSavingDate } = state;
          let streakBroke = false;
          let streakHitMilestone = false;
          let usedFreeze = false;
          const oldLevel = calcLevel(state.xp);
          const isNewStreakDay = lastLogDate !== today;

          // ── Activity streak (any transaction) ─────────────────
          if (lastLogDate !== today) {
            if (lastLogDate === yesterday || lastLogDate === null) {
              streak = lastLogDate === yesterday ? streak + 1 : 1;
            } else {
              // Missed at least one day — try to spend a streak freeze
              if (state.streakFreezes > 0) {
                usedFreeze = true;
                streak = streak; // streak preserved
              } else {
                streakBroke = lastLogDate !== null;
                streak = 1;
              }
            }
          }
          if (STREAK_MILESTONES.includes(streak)) streakHitMilestone = true;

          // ── Saving streak (income only — expenses don't count) ─
          if (tx.type === 'income') {
            if (lastSavingDate !== today) {
              if (lastSavingDate === yesterday || lastSavingDate === null) {
                savingStreak = lastSavingDate === yesterday ? savingStreak + 1 : 1;
              } else {
                savingStreak = 1;
              }
              lastSavingDate = today;
            }
          }

          // ── XP award (with active boost + streak multiplier) ──
          const streakMult = streakMultiplier(streak);
          let award: XpAward | null = null;
          if (tx.type === 'income') {
            const baseAward = calcSavingXp(BASE_XP_INCOME, tx.amount, savingStreak);
            const boostMult = (state.activeXpBoost && Date.now() < state.activeXpBoost.expiresAt)
              ? state.activeXpBoost.multiplier : 1;
            const combined = boostMult * streakMult;
            const streakLabel = streakMult > 1 ? ` + ${streakMult.toFixed(2).replace(/\.?0+$/, '')}× streak` : '';
            award = {
              ...baseAward,
              amount: Math.round(baseAward.amount * combined),
              multiplier: baseAward.multiplier * combined,
              tierLabel: (boostMult > 1
                ? `${baseAward.tierLabel} + ${boostMult}× boost`
                : baseAward.tierLabel) + streakLabel,
            };
          }
          const xpDelta = award?.amount ?? 0;
          const newXp = state.xp + xpDelta;
          const newLevel = calcLevel(newXp);
          const leveledUp = newLevel > oldLevel;

          // ── Coin award (daily cap + boost + streak multiplier) ─
          const coinBoostActive = !!(state.activeCoinBoost && Date.now() < state.activeCoinBoost.expiresAt);
          const coinBoostMult = coinBoostActive ? state.activeCoinBoost!.multiplier : 0;

          // Reset the daily counter when the date rolls over.
          const coinTxCountToday = state.coinTxDate === today ? state.coinTxCount : 0;
          const underCoinCap = coinTxCountToday < DAILY_COIN_TX_CAP;

          let coinAward = coinsForTransaction(
            tx.type,
            isNewStreakDay,
            streakHitMilestone,
            leveledUp,
            coinBoostActive,
            coinBoostMult,
          );
          // Apply the streak multiplier to coins (same growth as XP).
          if (streakMult > 1 && coinAward.amount > 0) {
            const boosted = Math.round(coinAward.amount * streakMult);
            coinAward = {
              amount: boosted,
              reason: `${coinAward.reason} · ${streakMult.toFixed(2).replace(/\.?0+$/, '')}× streak`,
            };
          }
          // Past the cap: transaction still logs (XP, streak, achievements
          // all unaffected) but earns no coins.
          if (!underCoinCap) {
            coinAward = { amount: 0, reason: 'Daily coin limit reached' };
          }
          const newCoinTxCount = underCoinCap ? coinTxCountToday + 1 : coinTxCountToday;

          set({
            transactions: [newTx, ...state.transactions],
            xp: newXp,
            streak,
            lastLogDate: today,
            savingStreak,
            lastSavingDate,
            lastXpAward: award,
            coins: state.coins + coinAward.amount,
            totalCoinsEarned: state.totalCoinsEarned + coinAward.amount,
            lastCoinAward: coinAward,
            coinTxDate: today,
            coinTxCount: newCoinTxCount,
            streakFreezes: usedFreeze ? state.streakFreezes - 1 : state.streakFreezes,
          });

          // ── Kasumi mood reaction ─────────────────────────────
          if (usedFreeze) {
            // Treat like a normal day — no streak broken reaction
            applyMoodEvent(
              tx.type === 'income'
                ? moodEventForIncome(tx.amount)
                : moodEventForExpense(tx.amount)
            );
            checkAndQueueAchievements();
            return;
          }
          if (streakBroke) { applyMoodEvent(MOOD_EVENT_STREAK_BROKEN); checkAndQueueAchievements(); return; }
          if (leveledUp) { applyMoodEvent(MOOD_EVENT_LEVEL_UP); checkAndQueueAchievements(); return; }
          if (streakHitMilestone) { applyMoodEvent(MOOD_EVENT_STREAK_MILESTONE); checkAndQueueAchievements(); return; }
          applyMoodEvent(
            tx.type === 'income'
              ? moodEventForIncome(tx.amount)
              : moodEventForExpense(tx.amount)
          );
          checkAndQueueAchievements();
        },

        deleteTransaction(id) {
          set(state => ({
            transactions: state.transactions.filter(t => t.id !== id),
          }));
        },

        addGoal(goal) {
          const newGoal: Goal = { ...goal, id: Date.now().toString() };
          set(state => ({ goals: [...state.goals, newGoal] }));
          checkAndQueueAchievements();
        },

        updateGoal(id, patch) {
          set(state => ({
            goals: state.goals.map(g => (g.id === id ? { ...g, ...patch } : g)),
          }));
        },

        deleteGoal(id) {
          set(state => ({ goals: state.goals.filter(g => g.id !== id) }));
        },

        contributeToGoal(goalId, amount) {
          const today = todayString();
          const yesterday = yesterdayString();
          const state = get();
          const target = state.goals.find(g => g.id === goalId);
          if (!target) return;

          const newSaved = Math.min(target.target, target.saved + amount);
          const justCompleted =
            target.saved < target.target && newSaved >= target.target;

          // Saving streak bump (goal contributions count as saving).
          let { savingStreak, lastSavingDate } = state;
          if (lastSavingDate !== today) {
            if (lastSavingDate === yesterday || lastSavingDate === null) {
              savingStreak = lastSavingDate === yesterday ? savingStreak + 1 : 1;
            } else {
              savingStreak = 1;
            }
            lastSavingDate = today;
          }

          // XP award with multiplier (streak-gated) + streak reward multiplier.
          const goalStreakMult = streakMultiplier(state.streak);
          const baseGoalAward = calcSavingXp(BASE_XP_GOAL_CONTRIB, amount, savingStreak);
          const award: XpAward = goalStreakMult > 1
            ? {
                ...baseGoalAward,
                amount: Math.round(baseGoalAward.amount * goalStreakMult),
                multiplier: baseGoalAward.multiplier * goalStreakMult,
                tierLabel: `${baseGoalAward.tierLabel} + ${goalStreakMult.toFixed(2).replace(/\.?0+$/, '')}× streak`,
              }
            : baseGoalAward;
          const oldLevel = calcLevel(state.xp);
          const newXp = state.xp + award.amount;
          const leveledUp = calcLevel(newXp) > oldLevel;

          // Coin award (subject to the same daily anti-exploit cap)
          const coinBoostActive2 = !!(state.activeCoinBoost && Date.now() < state.activeCoinBoost.expiresAt);
          const coinBoostMult2 = coinBoostActive2 ? state.activeCoinBoost!.multiplier : 0;

          const coinTxCountToday2 = state.coinTxDate === today ? state.coinTxCount : 0;
          const underCoinCap2 = coinTxCountToday2 < DAILY_COIN_TX_CAP;

          let coinAward2 = coinsForGoalContrib(justCompleted, coinBoostActive2, coinBoostMult2);
          if (goalStreakMult > 1 && coinAward2.amount > 0) {
            coinAward2 = {
              amount: Math.round(coinAward2.amount * goalStreakMult),
              reason: `${coinAward2.reason} · ${goalStreakMult.toFixed(2).replace(/\.?0+$/, '')}× streak`,
            };
          }
          if (!underCoinCap2) {
            coinAward2 = { amount: 0, reason: 'Daily coin limit reached' };
          }
          const newCoinTxCount2 = underCoinCap2 ? coinTxCountToday2 + 1 : coinTxCountToday2;

          set({
            goals: state.goals.map(g =>
              g.id === goalId ? { ...g, saved: newSaved } : g
            ),
            xp: newXp,
            savingStreak,
            lastSavingDate,
            lastXpAward: award,
            coins: state.coins + coinAward2.amount,
            totalCoinsEarned: state.totalCoinsEarned + coinAward2.amount,
            lastCoinAward: coinAward2,
            coinTxDate: today,
            coinTxCount: newCoinTxCount2,
          });

          // Mood priority: goal-completed > level-up > regular contribution.
          if (justCompleted) {
            applyMoodEvent(MOOD_EVENT_GOAL_COMPLETED);
          } else if (leveledUp) {
            applyMoodEvent(MOOD_EVENT_LEVEL_UP);
          } else {
            applyMoodEvent(moodEventForGoalContribution(amount));
          }
          checkAndQueueAchievements();
        },

        // ── Companion actions ──────────────────────────────────

        markMet() {
          if (get().hasMet) return;
          const id = get().activeCharacterId;
          set({
            hasMet: true,
            currentEvent: 'first_meeting',
            currentMood: 'neutral',
            currentLine: pickLineFor(id, 'first_meeting', 'stranger'),
            moodExpiresAt: Date.now() + 6000,
          });
        },

        refreshIdleLine() {
          const { activeCharacterId, affection } = get();
          const tier = tierFromAffection(affection);
          set({
            currentEvent: 'idle',
            currentMood: 'neutral',
            currentLine: pickLineFor(activeCharacterId, 'idle', tier.key),
            moodExpiresAt: null,
          });
        },

        acknowledgeMood() {
          const { activeCharacterId, affection } = get();
          const tier = tierFromAffection(affection);
          set({
            currentEvent: 'idle',
            currentMood: 'neutral',
            currentLine: pickLineFor(activeCharacterId, 'idle', tier.key),
            moodExpiresAt: null,
          });
        },

        tickMood() {
          const { moodExpiresAt, currentEvent, activeCharacterId, affection } = get();
          if (!moodExpiresAt) return;
          if (Date.now() >= moodExpiresAt && currentEvent !== 'idle') {
            const tier = tierFromAffection(affection);
            set({
              currentEvent: 'idle',
              currentMood: 'neutral',
              currentLine: pickLineFor(activeCharacterId, 'idle', tier.key),
              moodExpiresAt: null,
            });
          }
        },

        setActiveCharacter(id: CharacterId) {
          const state = get();
          if (id === state.activeCharacterId) return;
          if (!state.unlockedCharacterIds.includes(id)) return;

          // Stash the current active character's live state back into the map…
          const savedActive: CompanionState = {
            affection: state.affection,
            hasMet: state.hasMet,
            lastTierKey: state.lastTierKey,
            currentMood: state.currentMood,
            currentEvent: state.currentEvent,
            currentLine: state.currentLine,
            moodExpiresAt: state.moodExpiresAt,
          };
          const companions = { ...state.companions, [state.activeCharacterId]: savedActive };

          // …and load the target character's saved state into the top-level fields.
          const next = companions[id] ?? freshCompanion();

          // If they've never been met, prime an idle line so the home screen
          // isn't blank before first interaction.
          const tier = tierFromAffection(next.affection);
          const primedLine = next.currentLine || pickLineFor(id, 'idle', tier.key);

          set({
            activeCharacterId: id,
            companions,
            affection: next.affection,
            hasMet: next.hasMet,
            lastTierKey: next.lastTierKey,
            currentMood: next.currentMood,
            currentEvent: next.currentEvent,
            currentLine: primedLine,
            moodExpiresAt: next.moodExpiresAt,
          });
        },

        clearPendingCharacterUnlock() {
          set({ pendingCharacterUnlock: null });
        },

        markIntroSeen() {
          set({ hasSeenIntro: true });
        },

        // ── Derived ────────────────────────────────────────────

        getTotals() {
          const { transactions } = get();
          let income = 0, expenses = 0;
          transactions.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else expenses += t.amount;
          });
          return { income, expenses, balance: BASE_BALANCE + income - expenses };
        },

        getLevel() { return calcLevel(get().xp); },
        getXpInLevel() { return calcXpInLevel(get().xp); },

        getCategoryBreakdown() {
          const { transactions } = get();
          const map: Partial<Record<Category, number>> = {};
          transactions
            .filter(t => t.type === 'expense')
            .forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
          return (Object.entries(map) as [Category, number][]).sort((a, b) => b[1] - a[1]);
        },

        getLeaderboardWithMe() {
          const { xp } = get();
          const me: LeaderboardEntry = {
            id: 'me', initials: 'ME', name: 'You',
            xp, level: calcLevel(xp),
            bg: '#1a1a2e', fg: '#ffffff', isMe: true,
          };
          return [...STATIC_LEADERBOARD, me]
            .sort((a, b) => b.xp - a.xp)
            .map((entry, i) => ({ ...entry, rank: i + 1 }));
        },

        getMonthlyTotals() {
          const { transactions } = get();
          const now = new Date();
          const monthly = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          });
          let income = 0, expenses = 0;
          monthly.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else expenses += t.amount;
          });
          return { income, expenses, saved: Math.max(0, income - expenses) };
        },

        getTier() {
          return tierFromAffection(get().affection);
        },

        isNetNegative() {
          const { transactions } = get();
          let income = 0, expenses = 0;
          for (const t of transactions) {
            if (t.type === 'income') income += t.amount;
            else expenses += t.amount;
          }
          // Only flag once there's actual spending to react to.
          return expenses > 0 && expenses > income;
        },

        getDisplayMood() {
          // If the user is overspending, Kasumi stays visibly sad until
          // they recover — this overrides whatever transient reaction
          // would otherwise be showing.
          const state = get();
          let income = 0, expenses = 0;
          for (const t of state.transactions) {
            if (t.type === 'income') income += t.amount;
            else expenses += t.amount;
          }
          if (expenses > 0 && expenses > income) return 'sad';
          return state.currentMood;
        },
      };
    },
    {
      name: 'finapp-v2',
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      // Migrate old single-character saves: seed the companion map from the
      // top-level Kasumi fields, keep Kasumi unlocked, leave Mira locked.
      migrate: (persisted: any, fromVersion: number) => {
        if (!persisted) return persisted;
        if (fromVersion < 2) {
          persisted.activeCharacterId = 'kasumi';
          persisted.unlockedCharacterIds = ['kasumi'];
          persisted.companions = {
            kasumi: {
              affection: persisted.affection ?? 0,
              hasMet: persisted.hasMet ?? false,
              lastTierKey: persisted.lastTierKey ?? 'stranger',
              currentMood: 'neutral',
              currentEvent: 'idle',
              currentLine: '',
              moodExpiresAt: null,
            },
            mira: {
              affection: 0, hasMet: false, lastTierKey: 'stranger',
              currentMood: 'neutral', currentEvent: 'idle', currentLine: '', moodExpiresAt: null,
            },
          };
          // Existing players are already mid-app — don't show them the
          // "you just moved in" opening.
          persisted.hasSeenIntro = true;
        }
        return persisted;
      },
      partialize: state => ({
        transactions: state.transactions,
        xp: state.xp,
        streak: state.streak,
        lastLogDate: state.lastLogDate,
        goals: state.goals,
        // Saving-streak persistence
        savingStreak: state.savingStreak,
        lastSavingDate: state.lastSavingDate,
        // Companion persistence — active character's progress + the
        // saved map of all characters + which are unlocked. Transient
        // mood/line resets on launch.
        affection: state.affection,
        hasMet: state.hasMet,
        lastTierKey: state.lastTierKey,
        activeCharacterId: state.activeCharacterId,
        unlockedCharacterIds: state.unlockedCharacterIds,
        companions: state.companions,
        hasSeenIntro: state.hasSeenIntro,
        // Achievement persistence
        unlockedAchievementIds: state.unlockedAchievementIds,
        // Shop & currency persistence
        coins: state.coins,
        totalCoinsEarned: state.totalCoinsEarned,
        ownedItems: state.ownedItems,
        equippedItems: state.equippedItems,
        activeXpBoost: state.activeXpBoost,
        activeCoinBoost: state.activeCoinBoost,
        streakFreezes: state.streakFreezes,
        // Daily coin-cap persistence (so the limit can't be reset by relaunching)
        coinTxDate: state.coinTxDate,
        coinTxCount: state.coinTxCount,
      }),
    }
  )
);
