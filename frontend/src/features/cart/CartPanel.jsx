"use client";

import { useDispatch, useSelector } from "react-redux";
import {
    cartSelectors,
    itemQuantityChanged,
    itemRemovedFromCart,
} from "./cartSlice";
import { checkoutRequested } from "@/features/checkout/checkoutSlice";
import { useOrder } from "@/features/orders/orderQueries";


function OrderStatusBadge({ status }) {
    const normalizedStatus = status || "UNKNOWN";

    return (
        <span className={`status-badge status-${normalizedStatus.toLowerCase()}`}>
            {normalizedStatus}
        </span>
    );
}


export function CartPanel() {
    const dispatch = useDispatch();
    const items = useSelector(cartSelectors.selectAll);
    const checkout = useSelector((state) => state.checkout);
    const orderQuery = useOrder(checkout.orderId);
    const currentOrderStatus = orderQuery.data?.order?.status;

    const total = items.reduce((sum, item) => {
        return sum + item.quantity * item.unitPrice;
    }, 0);

    if (items.length === 0 && !checkout.orderId) {
        return (
            <aside className="cart-panel">
                <h2>Cart</h2>
                <p className="muted">Your cart is empty.</p>
            </aside>
        );
    }

    return (
        <aside className="cart-panel">
            <h2>Cart</h2>

            {items.length > 0 && (<> <div className="cart-items">
                {items.map((item) => (
                    <div key={item.productId} className="cart-item">
                        <div>
                            <strong>{item.productName}</strong>
                            <p className="muted">${Number(item.unitPrice).toFixed(2)}</p>
                        </div>

                        <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(event) => {
                                dispatch(
                                    itemQuantityChanged({
                                        productId: item.productId,
                                        quantity: Number(event.target.value),
                                    })
                                );
                            }}
                        />

                        <button
                            type="button"
                            onClick={() => {
                                dispatch(itemRemovedFromCart({ productId: item.productId }));
                            }}
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>

                <div className="cart-total">
                    <span>Total</span>
                    <strong>${total.toFixed(2)}</strong>
                </div> </>
            )}
            {items.length > 0 && (
                <button
                    type="button"
                    className="checkout-button"
                    disabled={checkout.status === "submitting"}
                    onClick={() => dispatch(checkoutRequested())}
                >
                    {checkout.status === "submitting" ? "Placing order..." : "Checkout"}
                </button>
            )}

            {checkout.status === "failed" && (
                <p className="error-message">{checkout.error}</p>
            )}

            {checkout.orderId && (
                <div className="order-status">
                    <p className="muted">
                        Order: <strong>{checkout.orderId}</strong>
                    </p>

                    <div className="status-row">
                        <span>Status:</span>
                        <OrderStatusBadge
                            status={orderQuery.isLoading ? "Loading" : currentOrderStatus}
                        />
                    </div>
                </div>
            )}
        </aside>
    );
}