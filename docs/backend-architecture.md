# Backend Architecture

## Overview

OrderFlow Lite is a small microservices-style backend for learning full-stack and distributed systems concepts.

The backend uses:

- Nginx as API Gateway
- Product Service for catalog APIs
- Order Service for order APIs
- Order Worker for async order processing
- Notification Worker for async email simulation
- Scheduler for recurring background jobs
- RabbitMQ for async events
- MongoDB for product catalog data
- PostgreSQL for orders, inventory, payments, and idempotency
- Redis for product cache
- Elasticsearch for product search

## Request Flow

### Product Listing

```txt
Client
  -> Nginx /api/products/
  -> Product Service /products
  -> Redis cache
  -> MongoDB if cache miss

### Checkout and Inventory

The checkout request contains only product IDs and quantities. Order Service calls
Product Service's internal `POST /products/verify` endpoint and persists the
catalog's current name and price, never client-supplied values. In the same
PostgreSQL transaction it atomically increments `inventory.reserved` only when
`stock - reserved` can cover every requested quantity.

Product Service publishes `product.upserted` events whenever a catalog product
is created or changed. The order worker consumes those events to create/update
the PostgreSQL inventory projection; product events containing a stock value
update stock, while metadata-only updates do not overwrite stock reduced by
completed orders. This means the order worker must be running before creating
catalog products (or the projection must be backfilled) before they can be
ordered.
