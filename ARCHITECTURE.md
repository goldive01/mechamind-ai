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

### Copilot flow

`POST /api/copilot/chat` delegates history loading and persistence to `ConversationService`. `ContextBuilder` reads operational data through `CopilotContextRepository`, combines it with HealthEngine analytics and derived alerts, and passes structured context to `PromptBuilder`. The completed structured response is validated by `ResponseParser`, persisted, and emitted to the client as newline-delimited streaming events. Legacy non-streaming Copilot requests remain supported.

Copilot Phase 2 tool calls pass through `ToolRegistry` and `ToolExecutor`. The executor validates arguments, checks explicit permissions, emits progress/result events, and requires a signed short-lived confirmation token before destructive actions. Tool definitions invoke application services only; those services own repository access.

### Autonomous alerts

Sensor, inspection, AI-report, and health-recalculation services invoke `AlertService` after their primary operation. `AlertEngine` evaluates deterministic severity rules for telemetry, health trends, and failure probability. `RecommendationEngine` supplies metric-specific actions, and the AI explanation adapter enriches new or changed findings with a safe fallback. `AlertRepository` persists the current alert, source trigger identity, and immutable lifecycle history. Email, push, and SMS implement a shared notification interface and currently write structured log events. The Alert Center and detail route access persistence only through `AlertService`. Monitoring failures are isolated so existing workflows remain successful.
