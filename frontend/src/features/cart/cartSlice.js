import {
  createEntityAdapter,
  createSlice,
} from "@reduxjs/toolkit";

const cartAdapter = createEntityAdapter({
  selectId: (item) => item.productId,
});

const initialState = cartAdapter.getInitialState();

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    itemAddedToCart(state, action) {
      const product = action.payload;
      const existingItem = state.entities[product.productId];

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cartAdapter.addOne(state, {
          productId: product.productId,
          productName: product.productName,
          unitPrice: product.unitPrice,
          imageUrl: product.imageUrl,
          quantity: 1,
        });
      }
    },

    itemRemovedFromCart(state, action) {
      cartAdapter.removeOne(state, action.payload.productId);
    },

    itemQuantityChanged(state, action) {
      const { productId, quantity } = action.payload;

      if (quantity <= 0) {
        cartAdapter.removeOne(state, productId);
        return;
      }

      cartAdapter.updateOne(state, {
        id: productId,
        changes: {
          quantity,
        },
      });
    },

    cartCleared(state) {
      cartAdapter.removeAll(state);
    },
    cartHydrated(state, action) {
      cartAdapter.setAll(state, action.payload);
    },
  },
});

export const {
  itemAddedToCart,
  itemRemovedFromCart,
  itemQuantityChanged,
  cartCleared,
  cartHydrated
} = cartSlice.actions;

export const cartSelectors = cartAdapter.getSelectors(
  (state) => state.cart
);

export default cartSlice.reducer;