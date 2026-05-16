"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { cartHydrated, cartSelectors } from "@/features/cart/cartSlice";

const CART_STORAGE_KEY = "orderflow_cart";

export function StorePersistence() {
  const dispatch = useDispatch();
  const cartItems = useSelector(cartSelectors.selectAll);
  const hasHydrated = useRef(false);

  useEffect(() => {
    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (savedCart) {
      dispatch(cartHydrated(JSON.parse(savedCart)));
    }

    hasHydrated.current = true;
  }, [dispatch]);

  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  return null;
}