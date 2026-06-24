/**
 * GhestShop — Cart Finance State (Zustand)
 * ------------------------------------------------------------------
 * The storefront's first pure client-side state machine. Per the locked
 * architecture, financing is SINGLE-ITEM: one selected device → one
 * LoanApplication/InstallmentPlan, so the cart holds at most one `activeItem`
 * (no basket, no schema changes). This store owns only UI/selection state —
 * the authoritative installment math lives in `installment-engine` and is
 * re-minted server-side at approval.
 */

import { create } from 'zustand';
import type { ProductCardVM } from '@/lib/store/types';

/** The fully-configured device the user intends to finance. */
export interface ActiveCartItem {
  readonly product: ProductCardVM;
  readonly color: string;
  readonly storage: string;
  /** Chosen repayment term in months (validated against ALLOWED_MONTHS upstream). */
  readonly months: number;
  /** Chosen up-front payment, Toman. */
  readonly downPayment: number;
  /** Annual rate (bps) used to quote this item — kept so the cart recomputes
   * the EXACT monthly the customer saw on the product page. */
  readonly annualRateBps: number;
}

export interface CartState {
  /** The single financed selection, or null when the cart is empty. */
  activeItem: ActiveCartItem | null;
  /** Controls the slide-over quick-review sheet. */
  isOpen: boolean;

  /** Select a configured device and open the review sheet. */
  addItem: (
    product: ProductCardVM,
    color: string,
    storage: string,
    months: number,
    downPayment: number,
    annualRateBps: number,
  ) => void;
  /** Clear the selection and close the sheet. */
  removeItem: () => void;
  /** Toggle (or explicitly set) the slide-over sheet. */
  toggleSheet: (open?: boolean) => void;
}

export const useCartStore = create<CartState>((set) => ({
  activeItem: null,
  isOpen: false,

  addItem: (product, color, storage, months, downPayment, annualRateBps) =>
    set({
      activeItem: { product, color, storage, months, downPayment, annualRateBps },
      isOpen: true,
    }),

  removeItem: () => set({ activeItem: null, isOpen: false }),

  toggleSheet: (open) =>
    set((state) => ({ isOpen: typeof open === 'boolean' ? open : !state.isOpen })),
}));

// --- Lightweight selectors (stable references; avoid re-renders on unrelated changes) ---

/** True when a device is currently selected for financing. */
export const selectHasItem = (state: CartState): boolean => state.activeItem !== null;

/** Financed principal of the active item (cashPrice − downPayment), or 0. */
export const selectFinancedPrincipal = (state: CartState): number =>
  state.activeItem ? Math.max(0, state.activeItem.product.cashPrice - state.activeItem.downPayment) : 0;
