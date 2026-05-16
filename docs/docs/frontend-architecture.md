# Frontend Architecture

## Overview

The frontend uses Next.js and React.

It talks only to the Nginx API Gateway:

```txt
http://localhost:8080

State Management
The frontend separates server state and client state.

Server State: TanStack Query
TanStack Query owns data fetched from backend APIs:

product list
product search results
order status
It provides:

caching
loading states
error states
retries
polling
query keys
Query key examples:

["products"]
["products", "search", "keyboard"]
["orders", orderId]
Client State: Redux Toolkit
Redux Toolkit owns browser/client state:

cart items
checkout UI state
current order ID
The cart uses createEntityAdapter to normalize cart items by product ID.

This makes cart updates easier because each product exists once in the cart state.

Async Workflow: Redux Saga
Redux Saga handles checkout orchestration.

Flow:

checkoutRequested
  -> read cart from Redux
  -> generate Idempotency-Key
  -> call POST /api/orders/
  -> store returned order ID
  -> clear cart
Order Polling
After checkout, the frontend uses TanStack Query to poll:

GET /api/orders/:id
Polling stops when order status becomes:

CONFIRMED
FAILED
EXPIRED
Important Design Choice
Cart is frontend-only in this version.

A production system might use:

local cart for guest users
backend Redis cart for logged-in users
hybrid cart merge after login