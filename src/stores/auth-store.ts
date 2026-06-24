'use client';

/**
 * GhestShop — Client auth/session UI store (Zustand).
 * ------------------------------------------------------------------
 * Lightweight front-end auth state for the header, auth modal, and role-based
 * dashboards. Persists to localStorage. (The real server session lives in the
 * Prisma `Session` model + Phase-5 server actions; this drives the UI layer.)
 */

import { create } from 'zustand';

export type AuthRole = 'buyer' | 'admin';

export interface AuthUser {
  readonly name: string;
  readonly role: AuthRole;
  readonly phone: string;
}

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  modalOpen: boolean;
  hydrate: () => void;
  login: (user: AuthUser) => void;
  logout: () => void;
  openModal: () => void;
  closeModal: () => void;
}

const STORAGE_KEY = 'ghestshop-auth';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  modalOpen: false,

  hydrate: () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      set({ user: raw ? (JSON.parse(raw) as AuthUser) : null, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  login: (user) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      /* storage unavailable — session stays in memory */
    }
    set({ user, modalOpen: false });
  },

  logout: () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    set({ user: null });
  },

  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),
}));

/** Dashboard route for a given role. */
export function dashboardHref(role: AuthRole): string {
  return role === 'admin' ? '/admin' : '/dashboard';
}
