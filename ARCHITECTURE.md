# Architecture

MechaMind uses a layered backend architecture while retaining the existing Next.js UI and public request/response contracts.

## Layers and responsibilities

- **Transport** (`src/app/api`, server `actions.ts`): reads HTTP/form input, selects status codes, revalidates or redirects, and delegates work.
- **DTOs** (`src/dto`): validates untrusted input and defines boundary-safe data shapes.
- **Services** (`src/services`): owns application use cases and business orchestration. `HealthEngine` is a stateless deterministic health-scoring service.
- **Domain** (`src/domain/entities`): framework- and persistence-independent business entities and value types.
- **Repositories** (`src/repositories`): persistence contracts consumed by services.
- **Infrastructure** (`src/infrastructure`): Prisma repository implementations, centralized logging, and API response construction.

## Folder structure

```text
src/
  app/                    Next.js pages, route handlers, server actions
  domain/entities/        Domain types
  dto/                    Input/output boundary schemas
  repositories/           Persistence interfaces
  services/               Application services and use cases
  infrastructure/
    http/                 Standard response helpers
    logging/              Central logger
    repositories/         Prisma adapters
  lib/                    Shared compatibility utilities and scoring algorithm
```

## Request flow

```text
Client -> Route handler / Server action -> DTO validation -> Service
       -> Repository interface -> Prisma adapter -> Database
       <- Standard response / redirect <- Service result
```

Routes contain transport-only concerns. Services can be unit tested with repository doubles, and repository implementations can change without changing domain or service code. API responses are built through the shared `apiSuccess` and `apiError` functions while preserving the pre-hardening JSON shapes used by the current UI.

### Authentication and RBAC

Authentication uses opaque, hashed, database-backed sessions. `AuthenticationService` owns credential verification, `SessionService` owns session lifecycle operations, and `AuthorizationService` evaluates permission codes from the authenticated user's role. User, role, permission, session, and audit persistence are exposed through repository contracts; Prisma remains confined to infrastructure adapters. Dashboard and mobile layouts validate sessions for reads, while Server Actions and route handlers repeat permission checks at the mutation boundary. Copilot receives the same authenticated principal and filters tool execution through its permissions.

### Multi-organisation boundaries

`Organisation` is the tenant root. Memberships grant users access to an organisation, while sites, buildings, and areas form its physical hierarchy. Tenant-aware repository adapters receive or validate an organisation identifier and include it in reads, writes, updates, and deletes. Copilot conversations and context are bound to the selected organisation, and engineering timelines expose organisation and location metadata without crossing that boundary.

### Copilot flow

`POST /api/copilot/chat` delegates history loading and persistence to `ConversationService`. `ContextBuilder` reads operational data through `CopilotContextRepository`, combines it with HealthEngine analytics and derived alerts, and passes structured context to `PromptBuilder`. The completed structured response is validated by `ResponseParser`, persisted, and emitted to the client as newline-delimited streaming events. Legacy non-streaming Copilot requests remain supported.

Copilot Phase 2 tool calls pass through `ToolRegistry` and `ToolExecutor`. The executor validates arguments, checks explicit permissions, emits progress/result events, and requires a signed short-lived confirmation token before destructive actions. Tool definitions invoke application services only; those services own repository access.

### Autonomous alerts

Sensor, inspection, AI-report, and health-recalculation services invoke `AlertService` after their primary operation. `AlertEngine` evaluates deterministic severity rules for telemetry, health trends, and failure probability. `RecommendationEngine` supplies metric-specific actions, and the AI explanation adapter enriches new or changed findings with a safe fallback. `AlertRepository` persists the current alert, source trigger identity, and immutable lifecycle history. Email, push, and SMS implement a shared notification interface and currently write structured log events. The Alert Center and detail route access persistence only through `AlertService`. Monitoring failures are isolated so existing workflows remain successful.

The v1.3 alert domain foundation defines persistence-independent severity, category, and lifecycle enums plus validated create/update boundary DTOs. `AlertService` owns lifecycle rules and structured created, acknowledged, and resolved events; it has no Prisma dependency. `AlertRepository` exposes CRUD, active/asset lookup, and text search contracts, while `PrismaAlertRepository` maps public asset identifiers to database relations and implements those contracts. The additive alert search index migration preserves and requires no backfill of existing alert rows.

### Automatic alert evaluation

`AlertEvaluationService` is the application boundary for automatic evaluation. Sensor persistence invokes it with the saved reading identity; the atomic inspection/AI-report save invokes it once for each persisted record; and health recalculation invokes it after producing the latest score. Evaluation covers temperature, vibration, voltage, current, humidity, overall health, and failure probability. Stable per-asset metric fingerprints make active findings idempotent, while conditions absent from the latest finding set are resolved automatically. Every attempt emits structured start/completion logs, including missing-asset and resolution outcomes. Workflow services isolate evaluation failures so their primary persistence operations remain unchanged.

### Engineering timeline intelligence

`TimelineService` aggregates inspections, sensor readings, derived health history, alerts, structured recommendations, and maintenance records through `TimelineRepository`. It produces a validated, reverse-chronological asset timeline and deterministic trend explanation. An optional AI summarizer may refine that explanation, but failures fall back to the deterministic result. The asset timeline route consumes only the service and DTO boundary; Prisma access remains isolated in infrastructure.

### Intelligent notifications and escalation

`NotificationEngine` converts changed alerts into validated notification DTOs using severity plans from `EscalationEngine`. `NotificationQueue` separates scheduling from dispatch: critical and high alerts dispatch immediately, critical alerts retain delayed escalation jobs until acknowledged or resolved, medium alerts wait for the daily summary window, and low alerts are logged only. `NotificationService` dispatches due jobs through a provider abstraction. Email, push, SMS, Teams, Slack, and webhook providers are intentionally log-only in v1.3; external delivery and durable queue infrastructure remain future adapter concerns.

### Engineering memory

Engineering Memory sits behind `MemoryRepository`. `MemoryIngestionService` converts operational outcomes into validated, tenant-scoped memories, while search and deterministic ranking combine recency, lexical similarity, confidence, successful outcome, and frequency. Every Copilot provider request retrieves ranked experience and injects stable `[Memory:<id>]` citations into prompt context.

### Engineering knowledge graph

`KnowledgeBuilder` deterministically converts each normalized Engineering Memory into categorised nodes, directed edges, and supporting facts. `KnowledgeGraph` persists validated graph mutations through `KnowledgeRepository`, while `KnowledgeSearch` and `KnowledgeEngine` provide organisation-scoped text search and bounded traversal. Copilot retrieves both ranked memories and their related graph context, using stable `[Knowledge:<id>]` node citations.
