# ADR-003: Gateway Subscribes to Domain Events

## Context

When the Gateway emits command events (e.g., `seat.confirmationRequest`) to Kafka, the Reservation Service processes them and publishes domain events (e.g., `seat.reserved`). 

We need to decide: **Should the Gateway subscribe to these domain events?**

This might seem redundant since the Gateway initially received the client action, but there's an important question: How do all connected clients (not just the one who initiated the action) learn about seat state changes?

## Decision

**Yes, the Gateway MUST subscribe to domain events from the Reservation Service and broadcast them to all connected clients.**

Flow:
```
User A: Hold seat 5B
  ↓
Gateway receives socket event
  ↓
Publishes: seat.holdRequested
  ↓
Reservation Service: validates, updates Redis, publishes seat.held
  ↓
Gateway (subscribed to domain events): receives seat.held
  ↓
Broadcasts to ALL clients (A, B, C...) → Real-time UI update
```

Domain events the Gateway subscribes to:
- `seat.held`
- `seat.reserved`
- `seat.released`
- `stats.updated`

## Consequences

### Positive

- ✅ **Single source of truth**: Gateway broadcasts the authoritative result, not the client's intent
- ✅ **Real-time sync for all users**: Every connected client sees seat changes immediately
- ✅ **Command validation feedback**: Originating client learns if their command succeeded/failed
- ✅ **Consistency**: All clients see the same state (no optimistic UI without server confirmation)
- ✅ **Decoupling**: Gateway doesn't need to track which client initiated which command
- ✅ **Idempotency-friendly**: Can safely reprocess events (just re-broadcast)
- ✅ **Event-driven completeness**: Demonstrates full event-driven architecture

### Negative

- ❌ **Round-trip latency**: Client waits for command → process → event → broadcast cycle
- ❌ **Duplicate subscription topic**: Gateway subscribes to same topic as other services
- ❌ **Broadcast overhead**: All clients receive all events (mitigated by Socket.IO rooms per eventId)

## Why Gateway Can't Just Broadcast Client Intent

**Anti-pattern (DON'T DO THIS):**
```typescript
// ❌ BAD: Gateway broadcasts immediately
socket.on('seat:commit', (data) => {
  kafkaProducer.send({ topic: 'commands', value: data }); // send command
  io.to(eventId).emit('seat.updated', data); // broadcast BEFORE validation!
});
```

**Problems**:
- What if Reservation Service rejects the command (seat already taken, hold expired)?
- Other clients would see incorrect state
- No single source of truth

**Correct pattern (DO THIS):**
```typescript
// ✅ GOOD: Gateway only broadcasts domain events (facts)
socket.on('seat:commit', (data) => {
  kafkaProducer.send({ topic: 'commands', value: data }); // send command
  // DON'T broadcast here - wait for domain event
});

kafkaConsumer.on('seat.reserved', (event) => {
  // NOW broadcast the authoritative result
  io.to(event.eventId).emit('seat.updated', event);
});
```

## Alternatives Considered

### Option 1: Gateway Broadcasts Immediately (Optimistic)

**Description**: Gateway broadcasts to clients as soon as it receives Socket.IO event, before command processing.

**Rejected because**:
- Breaks single source of truth principle
- Clients see inconsistent state if command fails
- Requires rollback logic in client
- Reservation Service's decision is ignored

### Option 2: Reservation Service Calls Gateway API Directly

**Description**: After processing command, Reservation Service calls a REST endpoint on Gateway to trigger broadcast.

**Rejected because**:
- Tight coupling (Reservation Service depends on Gateway)
- Reservation Service shouldn't know about delivery mechanisms
- Not event-driven (synchronous call)
- Harder to add multiple consumers of domain events later

### Option 3: Separate Notification Service

**Description**: Create a dedicated Notification Service that subscribes to events and manages Socket.IO connections.

**Rejected for now because**:
- Over-engineered for current scale
- Gateway already manages Socket.IO connections
- Can refactor later if Gateway becomes too complex
- Would add another hop in the notification path

## Additional Notes

**Socket.IO Rooms Optimization:**
To avoid broadcasting events to clients viewing different events, use rooms:

```typescript
// Client joins room when connecting
socket.join(`event:${eventId}`);

// Broadcast only to relevant room
io.to(`event:${eventId}`).emit('seat-updated', event);
```

**Correlation for Client Feedback:**
To provide immediate feedback to the originating client:

```typescript
socket.on('seat:commit', (data) => {
  const correlationId = uuid();
  socket.set('correlationId', correlationId); // track client's request
  
  kafkaProducer.send({
    value: JSON.stringify({ ...data, correlationId })
  });
});

// When event arrives, can identify originating client
kafkaConsumer.on('seat.reserved', (event) => {
  io.to(`event:${eventId}`).emit('seat-updated', event); // broadcast to all
  
  // Optionally send acknowledgment to originating client
  const originatingSocket = findSocketByCorrelation(event.correlationId);
  originatingSocket?.emit('action-confirmed', { success: true });
});
```

## References

- [Event-Driven Architecture Best Practices](https://aws.amazon.com/blogs/architecture/best-practices-for-implementing-event-driven-architectures-in-your-organization/)
- [Gateway Pattern - Martin Fowler](https://martinfowler.com/articles/gateway-pattern.html) 
- [API Gateway](https://microservices.io/patterns/apigateway.html)
- [Socket.IO Rooms](https://socket.io/docs/v4/rooms/)
