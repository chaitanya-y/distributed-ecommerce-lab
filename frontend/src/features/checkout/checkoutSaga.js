import { call, put, select, takeLatest } from "redux-saga/effects";
import { createOrder } from "@/lib/api";
import { cartCleared, cartSelectors } from "@/features/cart/cartSlice";
import {
  checkoutFailed,
  checkoutRequested,
  checkoutSucceeded,
} from "./checkoutSlice";

function buildOrderPayload(cartItems) {
  return {
    customerEmail: "test@example.com",
    items: cartItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
}

function* handleCheckoutRequested() {
  try {
    const cartItems = yield select(cartSelectors.selectAll);

    if (cartItems.length === 0) {
      yield put(
        checkoutFailed({
          message: "Cart is empty",
        })
      );
      return;
    }

    const idempotencyKey = crypto.randomUUID();
    const payload = buildOrderPayload(cartItems);

    const result = yield call(createOrder, payload, idempotencyKey);

    yield put(
      checkoutSucceeded({
        orderId: result.order.id,
      })
    );

    yield put(cartCleared());
  } catch (error) {
    yield put(
      checkoutFailed({
        message: error.message || "Checkout failed",
      })
    );
  }
}

export function* checkoutSaga() {
  yield takeLatest(checkoutRequested.type, handleCheckoutRequested);
}