import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: "idle",
  orderId: null,
  error: null,
};

export const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    checkoutRequested(state) {
      state.status = "submitting";
      state.error = null;
    },
    checkoutSucceeded(state, action) {
      state.status = "succeeded";
      state.orderId = action.payload.orderId;
      state.error = null;
    },
    checkoutFailed(state, action) {
      state.status = "failed";
      state.error = action.payload.message;
    },
    checkoutReset(state) {
      state.status = "idle";
      state.orderId = null;
      state.error = null;
    },
  },
});

export const {
  checkoutRequested,
  checkoutSucceeded,
  checkoutFailed,
  checkoutReset,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;