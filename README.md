# seats-reservation (in-progress)
This project aims to explore:
- micro services (although we're gonna use a mono repo to make things easier to follow)
- scalability
- efficiency and performance
- parallelism/concurrency

## Stack used TODO: justify the use of each thing 
- React + Vite
- Socket.io + REST+ Typescript (Elixir or Go would prolly be a better fit for this in terms of efficiency)
- Reddis + Postgres
- REST APIs + Typescript (Elixir or Go would prolly be a better fit for this in terms of efficiency)
- Kafka
- Docker
- OTHERS

## Applications
### Reservation Service (write-side, command handler)
- Source of truth for seat changes (atomic ops in Redis).
- Emits events (seat.held, seat.reserved, seat.released).

### Reservation Persistence Service (final persistence)
- Subscribes only to seat.reserved events.
- Writes completed reservations into a dedicated Postgres table: reservation(id, event_id, user_id, seat_ids, timestamp)
- Purpose: historical record / downstream consumption (payments, reporting, exports, etc).
- Keeps the “golden truth” of what actually got sold.

### Seat State Read Service (query-side for seat map)
- Provides initial seat map when a client connects.
- Reads directly from Redis (since that’s where the freshest state is).
- Endpoint example: GET /events/{eventId}/seats → returns JSON of seat states.
- Gateway can call this service when a new client joins, before subscribing them to real-time updates.

### Stats Projector Service (worker)
- Subscribes to all seat-related events.
- Updates aggregates in Postgres (section-level stats, event-level stats).
- Can also keep a small Redis cache for hot stats (if needed).
- Publishes stats.updated events after recomputing.

### Stats Read Service
- Simple REST service that queries Postgres projections (or Redis cache if you optimize later).
- Endpoints like:
  - /stats/event/{eventId}
  - /stats/event/{eventId}/section/{sectionId}

### Gateway (Socket.IO + REST)
- Keeps zero business logic.
- For initial load: calls Seat State, Read and Stats services.
- For real-time: subscribes to seat.* and stats.updated events and broadcasts to clients.

Here's a simple view of how the micro services interact with each other / how data flows between our micro services - _ignoring infra-structure for better understanting on a base level, this will be addressed later_
