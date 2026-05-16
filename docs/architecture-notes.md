# Architecture Notes

## Database Choices

### Product Service: MongoDB

The Product Service uses MongoDB because product data is flexible and document-shaped.

Different product categories can have different attributes. For example, a shirt may have size and material, while a laptop may have RAM and storage.

MongoDB lets us store these product documents naturally without creating many category-specific SQL tables or many nullable columns.

MongoDB is also useful for learning NoSQL modeling and later database sharding concepts.

### Order Service: PostgreSQL

The Order Service uses PostgreSQL because orders need strong consistency.

Creating an order requires multiple related writes:

- create the order
- create order items
- calculate/store totals
- maintain order status

These writes should succeed or fail together. PostgreSQL transactions help us preserve ACID properties.

### Elasticsearch

Elasticsearch is used for product search.

MongoDB remains the source of truth. Elasticsearch is a search index optimized for full-text search and filtering.

If MongoDB and Elasticsearch disagree, MongoDB wins.

### Redis

Redis is used for caching.

Product lists and search results can be cached in Redis to reduce repeated database/search calls.

Redis is fast because it stores data in memory.
