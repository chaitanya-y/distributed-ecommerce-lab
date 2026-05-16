import { all } from "redux-saga/effects";
import { checkoutSaga } from "@/features/checkout/checkoutSaga";

export function* rootSaga() {
  yield all([checkoutSaga()]);
}