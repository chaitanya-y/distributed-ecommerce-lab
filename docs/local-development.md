# Local Development

## Infrastructure

Start infrastructure:

```bash
cd infra
docker compose up -d

cd infra
docker compose down

cd infra
docker compose ps

cd backend/product-service
npm run dev
http://localhost:4001


cd backend/order-service
npm run dev
http://localhost:4002

cd backend/order-service
npm run worker:dev

cd backend/notification-worker
npm run dev

cd backend/scheduler
npm run dev

Nginx gateway
http://localhost:8080

Useful URLs
API Gateway: http://localhost:8080
Product Service: http://localhost:4001
Order Service: http://localhost:4002
Elasticsearch: http://localhost:9200
RabbitMQ UI: http://localhost:15672
username: guest
password: guest

Smoke Tests
Gateway health:

curl http://localhost:8080/health
List products:

curl http://localhost:8080/api/products/
Search products:

curl "http://localhost:8080/api/products/search?q=keyboard"

Create order:

curl -X POST http://localhost:8080/api/orders/ \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: local-test-1" \
  -d '{
    "customerEmail": "test@example.com",
    "items": [
      {
        "productId": "PRODUCT_ID_HERE",
        "productName": "Mechanical Keyboard",
        "quantity": 1,
        "unitPrice": 89.99
      }
    ]
  }'
Check order:

curl http://localhost:8080/api/orders/ORDER_ID_HERE
