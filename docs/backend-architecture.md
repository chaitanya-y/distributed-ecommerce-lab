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
