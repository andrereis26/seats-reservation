# ADR-001: Event-Driven Commands Pattern

## Context

The Gateway service receives client actions (hold seat, commit reservation, release seat) via Socket.IO. We need to decide how the Gateway should communicate these write operations to the Reservation Service.

Two main approaches were considered:
1. **Synchronous REST calls**: Gateway directly calls Reservation Service APIs
2. **Event-driven commands**: Gateway emits command events to Kafka, which Reservation Service consumes

The decision impacts system decoupling, scalability, resilience.

## Decision

**Gateway will emit command events to Kafka instead of making synchronous REST calls to the Reservation Service.**

Flow:
```
Client → Gateway (Socket.IO) → Kafka (command event) → Reservation Service → Kafka (domain event) → Gateway (subscribes) → Broadcast to clients
```

Command events include:
- `seat.holdRequest`
- `seat.confirmationRequest`
- `seat.releaseRequest`

These are **intents** (commands), distinct from domain events which represent **facts** (e.g., `seat.reserved`).

## Consequences

### Positive

- ✅ **True decoupling**: Gateway doesn't depend on Reservation Service availability or location
- ✅ **Single source of truth**: Only Reservation Service validates and executes business rules
- ✅ **Horizontal scalability**: Multiple Reservation Service instances can compete for commands using Kafka consumer groups
- ✅ **Resilience**: Commands queue in Kafka if Reservation Service is temporarily down
- ✅ **Demonstrates CQRS**: Clear separation between commands (write-side) and queries (read-side)
- ✅ **Event sourcing ready**: Easy to add event store in the future
- ✅ **Audit trail**: All commands are persisted in Kafka

### Negative

- ❌ **Eventual consistency**: Client doesn't get immediate response (must wait for domain event)
- ❌ **Complexity**: More moving parts compared to synchronous REST
- ❌ **Error handling**: Requires correlation IDs to match commands to results
- ❌ **Kafka dependency**: Adds operational overhead (monitoring, scaling Kafka)

## Alternatives Considered

### Option 1: Synchronous REST API

**Description**: Gateway directly calls `POST /seats/{seatId}/reserve` on Reservation Service.

**Rejected because**:
- Tight coupling between Gateway and Reservation Service
- Gateway must know about Reservation Service's location and API contract
- Harder to scale independently
- Doesn't demonstrate event-driven architecture (primary learning goal)
- Gateway would need retry/timeout logic for service failures

### Option 2: Hybrid Approach (REST + Events)

**Description**: Use REST for commands but publish domain events for notifications.

**Rejected because**:
- Inconsistent patterns (some writes via REST, some via events)
- Doesn't fully decouple services
- Loses benefits of command queuing and competing consumers

## References

- [CQRS Pattern - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [CQRS Pattern](https://microservices.io/patterns/data/cqrs.html)
