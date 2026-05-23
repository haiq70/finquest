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
  pickLine,
  tierFromAffection,
  type DialogueEvent,
  type Mood,
  type RelationshipTier,
} from '../kasumi/dialogue';
import {
  BASE_XP_GOAL_CONTRIB,
  BASE_XP_INCOME,
  calcSavingXp,
  type XpAward,
} from '../kasumi/xp';
import {
  checkNewAchievements,
  type AchievementDef,
  type AchievementSnapshot,
} from '../kasumi/achievements';

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

  // ── Kasumi (companion) ────────────────────────────────────────
  affection: number;            // 0..100
  hasMet: boolean;              // false until first interaction with her
  lastTierKey: RelationshipTier;// to detect tier-ups
  currentMood: Mood;            // which face to render right now
  currentEvent: DialogueEvent;  // what she's reacting to right now
  currentLine: string;          // line associated with currentEvent
  moodExpiresAt: number | null; // epoch ms when mood relaxes to idle

  // ── Achievements ──────────────────────────────────────────────
  unlockedAchievementIds: string[];
  pendingAchievements: AchievementDef[];

  // Actions
  clearPendingAchievements: () => void;
  shiftPendingAchievement: () => void; // remove first, keep rest
  addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id'>>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number) => void;

  // Kasumi actions
  markMet: () => void;
  refreshIdleLine: () => void;     // pick a new ambient line
  acknowledgeMood: () => void;     // user tapped the speech bubble → relax to idle
  tickMood: () => void;            // called periodically; relaxes expired mood

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
        const finalLine = pickLine(finalEvent, newTier.key);

        set({
          affection: newAffection,
          lastTierKey: newTier.key,
          currentMood: finalMood,
          currentEvent: finalEvent,
          currentLine: finalLine,
          moodExpiresAt: Date.now() + finalDuration,
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
        set(st => ({
          unlockedAchievementIds: [
            ...st.unlockedAchievementIds,
            ...newOnes.map(a => a.id),
          ],
          pendingAchievements: [...st.pendingAchievements, ...newOnes],
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

        // Kasumi defaults
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

        // ── Actions ────────────────────────────────────────────

        clearPendingAchievements() {
          set({ pendingAchievements: [] });
        },

        shiftPendingAchievement() {
          set(st => ({ pendingAchievements: st.pendingAchievements.slice(1) }));
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
          const oldLevel = calcLevel(state.xp);

          // ── Activity streak (any transaction) ─────────────────
          if (lastLogDate !== today) {
            if (lastLogDate === yesterday || lastLogDate === null) {
              streak = lastLogDate === yesterday ? streak + 1 : 1;
            } else {
              streakBroke = lastLogDate !== null;
              streak = 1;
            }
          }
          if (STREAK_MILESTONES.includes(streak)) streakHitMilestone = true;

          // ── Saving streak (income only — expenses don't count) ─
          // Updated BEFORE XP calc so today's saving counts toward today's gate.
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

          // ── XP award ─────────────────────────────────────────
          // Expenses earn nothing. Income earns base × multiplier (streak-gated).
          let award: XpAward | null = null;
          if (tx.type === 'income') {
            award = calcSavingXp(BASE_XP_INCOME, tx.amount, savingStreak);
          }
          const xpDelta = award?.amount ?? 0;
          const newXp = state.xp + xpDelta;
          const newLevel = calcLevel(newXp);
          const leveledUp = newLevel > oldLevel;

          set({
            transactions: [newTx, ...state.transactions],
            xp: newXp,
            streak,
            lastLogDate: today,
            savingStreak,
            lastSavingDate,
            lastXpAward: award,
          });

          // ── Kasumi mood reaction ─────────────────────────────
          // Priority: streak-broken > level-up > streak-milestone > the tx itself
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

          // XP award with multiplier (streak-gated).
          const award = calcSavingXp(BASE_XP_GOAL_CONTRIB, amount, savingStreak);
          const oldLevel = calcLevel(state.xp);
          const newXp = state.xp + award.amount;
          const leveledUp = calcLevel(newXp) > oldLevel;

          set({
            goals: state.goals.map(g =>
              g.id === goalId ? { ...g, saved: newSaved } : g
            ),
            xp: newXp,
            savingStreak,
            lastSavingDate,
            lastXpAward: award,
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

        // ── Kasumi actions ─────────────────────────────────────

        markMet() {
          if (get().hasMet) return;
          set({
            hasMet: true,
            currentEvent: 'first_meeting',
            currentMood: 'neutral',
            currentLine: pickLine('first_meeting', 'stranger'),
            moodExpiresAt: Date.now() + 6000,
          });
        },

        refreshIdleLine() {
          const tier = tierFromAffection(get().affection);
          set({
            currentEvent: 'idle',
            currentMood: 'neutral',
            currentLine: pickLine('idle', tier.key),
            moodExpiresAt: null,
          });
        },

        acknowledgeMood() {
          const tier = tierFromAffection(get().affection);
          set({
            currentEvent: 'idle',
            currentMood: 'neutral',
            currentLine: pickLine('idle', tier.key),
            moodExpiresAt: null,
          });
        },

        tickMood() {
          const { moodExpiresAt, currentEvent } = get();
          if (!moodExpiresAt) return;
          if (Date.now() >= moodExpiresAt && currentEvent !== 'idle') {
            const tier = tierFromAffection(get().affection);
            set({
              currentEvent: 'idle',
              currentMood: 'neutral',
              currentLine: pickLine('idle', tier.key),
              moodExpiresAt: null,
            });
          }
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
      name: 'finapp-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: state => ({
        transactions: state.transactions,
        xp: state.xp,
        streak: state.streak,
        lastLogDate: state.lastLogDate,
        goals: state.goals,
        // Saving-streak persistence
        savingStreak: state.savingStreak,
        lastSavingDate: state.lastSavingDate,
        // Kasumi persistence — keep affection + hasMet across sessions,
        // but let the transient mood/line reset on each launch.
        affection: state.affection,
        hasMet: state.hasMet,
        lastTierKey: state.lastTierKey,
        // Achievement persistence
        unlockedAchievementIds: state.unlockedAchievementIds,
      }),
    }
  )
);
