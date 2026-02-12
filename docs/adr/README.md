# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records (ADRs) for the Seats Reservation Platform.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences. This helps us remember why we made certain choices and provides guidance for future decisions.

## Format

Each ADR follows this structure:
- **Context**: What is the issue we're facing?
- **Decision**: What did we decide to do?
- **Consequences**: What are the positive and negative outcomes?

## Index

| ADR | Title | 
|-----|-------|
| [ADR-001](001-event-driven-commands-pattern.md) | Event-Driven Commands Pattern | 
| [ADR-002](002-rest-for-initial-load.md) | REST APIs for Initial Data Load | 
| [ADR-003](003-gateway-event-subscription.md) | Gateway Subscribes to Domain Events | 

## Creating a New ADR

1. Copy the template: `cp 000-template.md 00X-your-title.md`
2. Fill in the sections
3. Update this README index
4. Reference it in the main README if applicable
