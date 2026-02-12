# ADR-002: REST APIs for Initial Data Load

## Context

When a client connects to the Gateway via Socket.IO, they need initial data to render the seat map and statistics. We must decide how the Gateway should fetch this data from the read-side services (Seat State Read Service and Stats Read Service).

Options considered:
1. **Synchronous REST calls**: Gateway calls REST APIs on read services
2. **Event-driven queries**: Gateway publishes query events to Kafka and waits for responses
3. **Direct client access**: Clients call read services directly without going through Gateway

This decision impacts latency, complexity, and how well we separate concerns between queries (read-side) and commands/notifications (write-side).

## Decision

**Gateway will make synchronous REST calls to Seat State Read Service and Stats Read Service for initial data load.**

Flow:
```
Client connects → Gateway → HTTP GET /seats → Seat State Read Service
                         ├→ HTTP GET /stats → Stats Read Service
                         └→ Emit 'initial-load' event to client
```

Example:
```typescript
socket.on('connection', async (socket) => {
  const eventId = socket.handshake.query.eventId;
  
  const [seats, stats] = await Promise.all([
    axios.get(`http://seat-state-read:3001/events/${eventId}/seats`),
    axios.get(`http://stats-read:3002/stats/event/${eventId}`)
  ]);
  
  socket.emit('initial-load', { seats: seats.data, stats: stats.data });
});
```

## Consequences

### Positive

- ✅ **Immediate response**: Client receives data in a single request/response cycle
- ✅ **Simple error handling**: Standard HTTP status codes, timeouts, retries
- ✅ **Parallel aggregation**: Gateway can fetch from multiple services simultaneously
- ✅ **Type-safe contracts**: REST APIs with OpenAPI/Swagger documentation
- ✅ **Gateway as BFF**: Acts as Backend-for-Frontend, aggregating data sources
- ✅ **Lower latency**: Direct HTTP call faster than publish-subscribe-correlate pattern
- ✅ **Familiar pattern**: REST for queries is well-understood and documented
- ✅ **Easy caching**: Can add HTTP caching (ETag, Cache-Control) at gateway level

### Negative

- ❌ **Synchronous coupling**: Gateway must know about read service endpoints
- ❌ **Point-to-point calls**: Not as decoupled as event-driven approach
- ❌ **Service discovery**: Need mechanism to locate read services (env vars, DNS, service mesh)

## Alternatives Considered

### Option 1: Event-Driven Queries via Kafka

**Description**: Gateway publishes query events (e.g., `query.seats-requested`) and waits for response events with matching correlation IDs.

**Rejected because**:
- Over-engineered for simple request/response pattern
- Requires complex correlation logic and timeout handling
- Higher latency (publish → consume → process → publish → consume)
- Message brokers not designed for synchronous request/response
- Adds unnecessary complexity for queries (which are naturally synchronous)
- Would need to implement request/response pattern on top of Kafka (reinventing HTTP)

### Option 2: Direct Client Access to Read Services

**Description**: Client calls read services directly without going through Gateway.

**Rejected because**:
- Tight coupling: Clients know about internal service topology
- CORS complications across multiple services
- No aggregation layer: Client must orchestrate multiple calls
- Can't apply cross-cutting concerns (auth, rate limiting, logging) at Gateway
- Harder to add caching or response transformation
- Inconsistent with Socket.IO pattern (clients only connect to Gateway)

### Option 3: Hybrid - Client Calls REST, Gateway for Socket.IO Only

**Description**: Use Gateway only for real-time updates, not initial load.

**Rejected because**:
- Client needs to know about two different systems (Gateway + read services)
- Duplicates auth/CORS/rate-limiting logic across services
- Gateway can't enrich/transform data before sending to client
- Less cohesive client experience

## References

- [Backend for Frontend Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends)
- [CQRS Pattern - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [CQRS Pattern](https://microservices.io/patterns/data/cqrs.html)