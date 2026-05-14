import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  BASE_BALANCE,
  Category,
  XP_PER_LEVEL,
  XP_PER_TX,
} from '../theme';
import { todayString, yesterdayString } from '../utils/format';

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

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id'>>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number) => void;

  // Derived (computed on the fly — not stored)
  getTotals: () => { income: number; expenses: number; balance: number };
  getLevel: () => number;
  getXpInLevel: () => number;
  getCategoryBreakdown: () => [Category, number][];
  getLeaderboardWithMe: () => Array<LeaderboardEntry & { rank: number }>;
  getMonthlyTotals: () => { income: number; expenses: number; saved: number };
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
    (set, get) => ({
      transactions: [],
      xp: 0,
      streak: 0,
      lastLogDate: null,
      goals: DEFAULT_GOALS,

      // ── Actions ────────────────────────────────────────────

      addTransaction(tx) {
        const today = todayString();
        const newTx: Transaction = {
          ...tx,
          id: Date.now().toString(),
          date: new Date().toISOString(),
        };

        set(state => {
          let { streak, lastLogDate } = state;
          if (lastLogDate !== today) {
            streak = lastLogDate === yesterdayString() ? streak + 1 : 1;
          }
          return {
            transactions: [newTx, ...state.transactions],
            xp: state.xp + XP_PER_TX,
            streak,
            lastLogDate: today,
          };
        });
      },

      deleteTransaction(id) {
        set(state => ({
          transactions: state.transactions.filter(t => t.id !== id),
        }));
      },

      addGoal(goal) {
        const newGoal: Goal = { ...goal, id: Date.now().toString() };
        set(state => ({ goals: [...state.goals, newGoal] }));
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
        set(state => ({
          goals: state.goals.map(g =>
            g.id === goalId
              ? { ...g, saved: Math.min(g.target, g.saved + amount) }
              : g
          ),
        }));
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
    }),
    {
      name: 'finapp-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        transactions: state.transactions,
        xp: state.xp,
        streak: state.streak,
        lastLogDate: state.lastLogDate,
        goals: state.goals,
      }),
    }
  )
);
