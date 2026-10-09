import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { CartItem, Product } from '@apptypes/domain';
import type { RootState } from '@store/store';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discount: number;
}

const initialState: CartState = { items: [], couponCode: null, discount: 0 };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<{ product: Product; quantity?: number }>) {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) existing.quantity += quantity;
      else state.items.push({ product, quantity });
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.product.id !== action.payload);
    },
    updateQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((i) => i.product.id === action.payload.productId);
      if (item) item.quantity = Math.max(0, action.payload.quantity);
      state.items = state.items.filter((i) => i.quantity > 0);
    },
    applyCoupon(state, action: PayloadAction<{ code: string; discount: number }>) {
      state.couponCode = action.payload.code;
      state.discount = action.payload.discount;
    },
    clearCart() {
      return initialState;
    },
  },
});

export const { addItem, removeItem, updateQuantity, applyCoupon, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCartItems = (s: RootState) => s.cart.items;
export const selectCartCount = createSelector(selectCartItems, (items) =>
  items.reduce((sum, i) => sum + i.quantity, 0)
);
export const selectCartSubtotal = createSelector(selectCartItems, (items) =>
  items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
);
export const selectCartTotal = createSelector(
  selectCartSubtotal,
  (s: RootState) => s.cart.discount,
  (subtotal, discount) => Math.max(0, subtotal - discount)
);
