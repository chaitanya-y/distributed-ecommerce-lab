# Order Service

The Order Service owns customer orders.

Responsibilities:

- Create orders
- Store orders in PostgreSQL
- Use transactions for order creation
- Publish order events to RabbitMQ








POST /orders
  -> PostgreSQL transaction creates PENDING order
  -> RabbitMQ publishes order.created
  -> Order worker consumes event
  -> inventory row is locked with FOR UPDATE
  -> stock is reserved
  -> dummy payment is processed idempotently
  -> order becomes CONFIRMED
