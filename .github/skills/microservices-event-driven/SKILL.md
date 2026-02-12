---
name: microservices-event-driven
description: Guidelines for implementing event-driven microservices architecture with CQRS patterns
---

# Microservices Event-Driven Architecture

## Purpose
This skill provides guidelines for implementing event-driven microservices architecture with CQRS patterns, focusing on the Seats Reservation Platform's specific needs.

---

## When to Apply

- Designing communication between microservices
- Implementing command handlers (write operations)
- Building query services (read operations)
- Publishing domain events after state changes
- Consuming events from other services

---

## Core Principles

### 1. Event Naming Convention
Use **past tense** verbs to indicate something has happened:

```typescript
// ✅ Good - Past tense, domain-driven
'seat.held'
'seat.reserved'
'seat.released'
'stats.updated'

// ❌ Bad - Present tense or imperative
'seat.hold'
'reserve.seat'
'update.stats'
```

### 2. Event Schema Standard

All domain events follow this structure:

```typescript
interface DomainEvent<T = unknown> {
  eventType: string;      // Event identifier
  aggregateId: string;    // Entity ID (e.g., seatId)
  eventId: string;        // Unique event ID (UUID v4)
  timestamp: number;      // Unix timestamp in milliseconds
  version: number;        // Schema version (start with 1)
  payload: T;             // Event-specific data
  metadata?: {
    correlationId?: string;  // Track related events
    causationId?: string;    // Track event chains
    userId?: string;         // Originating user
  };
}

// Example: Seat Reserved Event
interface SeatReservedEventPayload {
  seatId: string;
  eventId: string;
  userId: string;
  sectionId: string;
  reservedAt: number;
}

const seatReservedEvent: DomainEvent<SeatReservedEventPayload> = {
  eventType: 'seat.reserved',
  aggregateId: 'seat-123',
  eventId: 'evt-uuid-v4',
  timestamp: Date.now(),
  version: 1,
  payload: {
    seatId: 'seat-123',
    eventId: 'event-456',
    userId: 'user-789',
    sectionId: 'section-A',
    reservedAt: Date.now()
  },
  metadata: {
    correlationId: 'correlation-id',
    userId: 'user-789'
  }
};
```

---

## Best Practices

### 1. Idempotent Event Handlers

Every event handler MUST be idempotent (safe to process the same event multiple times):

```typescript
class ReservationPersistenceService {
  async handleSeatReserved(event: DomainEvent<SeatReservedEventPayload>) {
    // Check if event already processed
    const existing = await this.repository.findByEventId(event.eventId);
    if (existing) {
      logger.info('Event already processed, skipping', {
        eventId: event.eventId,
        eventType: event.eventType
      });
      return; // Idempotent - safe to skip
    }
    
    // Process event
    await this.repository.saveReservation({
      seatId: event.payload.seatId,
      userId: event.payload.userId,
      eventId: event.eventId,
      reservedAt: new Date(event.payload.reservedAt)
    });
    
    logger.info('Reservation persisted', {
      eventId: event.eventId,
      seatId: event.payload.seatId
    });
  }
}
```

### 2. Event Publishing Pattern

Publish events AFTER successful state changes:

```typescript
class SeatReservationService {
  async reserveSeat(seatId: string, userId: string): Promise<void> {
    // 1. Validate
    const seat = await this.getSeat(seatId);
    if (seat.status !== SeatStatus.HELD) {
      throw new Error('Seat must be held before reserving');
    }
    
    // 2. Update state atomically
    await this.redis.multi()
      .hset(`seat:${seatId}`, 'status', SeatStatus.RESERVED)
      .hset(`seat:${seatId}`, 'userId', userId)
      .hset(`seat:${seatId}`, 'reservedAt', Date.now())
      .exec();
    
    // 3. Publish event AFTER successful state change
    const event: DomainEvent<SeatReservedEventPayload> = {
      eventType: 'seat.reserved',
      aggregateId: seatId,
      eventId: uuidv4(),
      timestamp: Date.now(),
      version: 1,
      payload: {
        seatId,
        eventId: seat.eventId,
        userId,
        sectionId: seat.sectionId,
        reservedAt: Date.now()
      },
      metadata: {
        correlationId: this.context.correlationId,
        userId
      }
    };
    
    await this.eventPublisher.publish('seat-events', event);
    
    logger.info('Seat reserved and event published', {
      seatId,
      eventId: event.eventId
    });
  }
}
```

### 3. Event Consumer Pattern

Use consumer groups for parallel processing:

```typescript
class EventConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  
  async start() {
    this.consumer = this.kafka.consumer({
      groupId: 'reservation-persistence-service',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });
    
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: 'seat-events',
      fromBeginning: false // Start from latest
    });
    
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          
          // Route to appropriate handler
          switch (event.eventType) {
            case 'seat.reserved':
              await this.handleSeatReserved(event);
              break;
            case 'seat.released':
              await this.handleSeatReleased(event);
              break;
            default:
              logger.warn('Unknown event type', { 
                eventType: event.eventType 
              });
          }
        } catch (error) {
          logger.error('Error processing event', {
            error: error.message,
            topic,
            partition,
            offset: message.offset
          });
          
          // Don't commit offset on error - will retry
          throw error;
        }
      }
    });
  }
}
```

### 4. Correlation IDs for Tracing

Always propagate correlation IDs through event chains:

```typescript
// Initial request
app.post('/seats/:seatId/hold', async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  
  // Add to context
  const context = { correlationId, userId: req.user.id };
  
  await seatService.holdSeat(req.params.seatId, context);
  
  res.json({ success: true, correlationId });
});

// Event handler propagates correlation ID
async handleSeatHeld(event: DomainEvent) {
  logger.info('Processing seat.held event', {
    correlationId: event.metadata.correlationId, // Propagate!
    eventId: event.eventId
  });
  
  // When publishing new events, include correlation ID
  const statsEvent = {
    eventType: 'stats.updated',
    // ... other fields
    metadata: {
      correlationId: event.metadata.correlationId, // Maintain trace
      causationId: event.eventId // Track event causality
    }
  };
}
```

---

## CQRS Pattern Implementation

### Write Side (Command Handler)

```typescript
// Reservation Service - Write operations
class ReservationCommandService {
  async holdSeat(command: HoldSeatCommand): Promise<void> {
    // Business logic + state change
    const seat = await this.validateAndLock(command.seatId);
    
    await this.redis.multi()
      .hset(`seat:${command.seatId}`, 'status', SeatStatus.HELD)
      .hset(`seat:${command.seatId}`, 'heldBy', command.userId)
      .hset(`seat:${command.seatId}`, 'heldAt', Date.now())
      .expire(`seat:${command.seatId}:hold`, 300) // 5 min TTL
      .exec();
    
    // Publish domain event
    await this.publishSeatHeldEvent(command);
  }
}
```

### Read Side (Query Service)

```typescript
// Seat State Read Service - Query operations
class SeatStateQueryService {
  async getSeatsByEvent(eventId: string): Promise<Seat[]> {
    // Read from optimized read model
    const seatKeys = await this.redis.keys(`seat:*`);
    const seats = await Promise.all(
      seatKeys.map(key => this.redis.hgetall(key))
    );
    
    return seats
      .filter(seat => seat.eventId === eventId)
      .map(seat => this.mapToSeatDto(seat));
  }
  
  async getSeatById(seatId: string): Promise<Seat> {
    const seat = await this.redis.hgetall(`seat:${seatId}`);
    if (!seat) throw new Error('Seat not found');
    return this.mapToSeatDto(seat);
  }
}
```

---

## Anti-Patterns

### ❌ DON'T: Synchronous Service-to-Service Calls

```typescript
// ❌ Bad - Creates tight coupling
async reserveSeat(seatId: string, userId: string) {
  await this.reservationService.reserve(seatId);
  await this.paymentService.charge(userId); // Synchronous call!
  await this.notificationService.sendEmail(userId); // Another sync call!
}
```

### ✅ DO: Async Event-Driven Flow

```typescript
// ✅ Good - Loosely coupled via events
async reserveSeat(seatId: string, userId: string) {
  await this.updateSeatStatus(seatId, SeatStatus.RESERVED);
  
  // Publish event - other services react independently
  await this.publishEvent('seat.reserved', { seatId, userId });
}

// Payment service reacts to event
class PaymentService {
  async handleSeatReserved(event) {
    await this.chargeUser(event.payload.userId);
    await this.publishEvent('payment.completed', { ... });
  }
}
```

### ❌ DON'T: Large Event Payloads

```typescript
// ❌ Bad - Including unnecessary data
const event = {
  eventType: 'seat.reserved',
  payload: {
    seat: { /* entire seat object */ },
    user: { /* entire user object */ },
    event: { /* entire event object */ }
  }
};
```

### ✅ DO: Minimal Event Payloads with IDs

```typescript
// ✅ Good - Only essential data, use IDs for references
const event = {
  eventType: 'seat.reserved',
  payload: {
    seatId: 'seat-123',
    userId: 'user-456',
    eventId: 'event-789',
    reservedAt: Date.now()
  }
};

// Consumers query for additional data if needed
async handleSeatReserved(event) {
  const userDetails = await this.userService.getById(event.payload.userId);
  // ...
}
```

### ❌ DON'T: Shared Databases Between Services

```typescript
// ❌ Bad - Multiple services writing to same DB
// Reservation Service writes to 'reservations' table
// Stats Service writes to 'reservations' table
// Creates tight coupling and data consistency issues
```

### ✅ DO: Database per Service

```typescript
// ✅ Good - Each service owns its data
// Reservation Service: Redis for current state
// Reservation Persistence: Postgres for reservations
// Stats Service: Postgres for aggregates

// Services communicate via events, not shared DB
```

---

## Testing Event-Driven Systems

### Unit Test: Event Publishing

```typescript
describe('SeatReservationService', () => {
  it('should publish seat.reserved event after successful reservation', async () => {
    const mockPublisher = jest.fn();
    const service = new SeatReservationService(mockPublisher);
    
    await service.reserveSeat('seat-123', 'user-456');
    
    expect(mockPublisher).toHaveBeenCalledWith(
      'seat-events',
      expect.objectContaining({
        eventType: 'seat.reserved',
        aggregateId: 'seat-123'
      })
    );
  });
});
```

### Integration Test: Event Flow

```typescript
describe('Seat Reservation Flow', () => {
  it('should persist reservation when seat.reserved event is published', async () => {
    // Arrange
    const reservationService = container.get(ReservationService);
    const persistenceService = container.get(PersistenceService);
    
    // Act
    await reservationService.reserveSeat('seat-123', 'user-456');
    
    // Wait for event to be consumed
    await delay(1000);
    
    // Assert
    const reservation = await persistenceService.findBySeatId('seat-123');
    expect(reservation).toBeDefined();
    expect(reservation.userId).toBe('user-456');
  });
});
```

---

## Resources

- [CQRS Pattern - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Microservices.io Patterns](https://microservices.io/patterns/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)

---

## Quick Reference

### Event Checklist
- [ ] Event name in past tense
- [ ] Follows DomainEvent schema
- [ ] Unique eventId (UUID v4)
- [ ] Includes correlationId in metadata
- [ ] Minimal payload (IDs, not full objects)
- [ ] Published AFTER state change
- [ ] Handler is idempotent
- [ ] Error handling with logging
- [ ] Unit and integration tests

### Common Event Types
- `{entity}.created` - Entity created
- `{entity}.updated` - Entity modified
- `{entity}.deleted` - Entity removed
- `{entity}.{action}` - Domain-specific action (e.g., seat.held)
- `{aggregate}.{status}` - Status change (e.g., order.completed)

---

**Remember:** Events represent facts that have happened. They are immutable and should never be modified after publication.
