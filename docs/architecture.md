# MechaMind AI Architecture

This document describes the high-level architecture and principal runtime workflows in MechaMind AI. The application follows a layered design that separates transport, validation, orchestration, domain logic, persistence contracts, and infrastructure adapters.

## Overall architecture

```mermaid
flowchart TB
    subgraph Clients[Clients and data sources]
        Browser[Dashboard browser]
        Devices[IoT sensor devices]
    end

    subgraph Transport[Transport layer]
        Pages[Next.js pages]
        Routes[API route handlers]
        Actions[Server actions]
    end

    subgraph Application[Application layer]
        DTOs[Zod DTO validation]
        Services[Application services]
        Engines[Engineering and AI engines]
    end

    subgraph Domain[Domain layer]
        Entities[Domain entities]
        Rules[Deterministic business rules]
    end

    subgraph Persistence[Persistence boundary]
        Contracts[Repository contracts]
        Adapters[Prisma repository adapters]
        Database[(SQLite database)]
    end

    subgraph Integrations[Optional integrations]
        OpenAI[OpenAI Responses API]
        Providers[Notification providers]
    end

    Browser --> Pages
    Browser --> Routes
    Browser --> Actions
    Devices --> Routes
    Routes --> DTOs
    Actions --> DTOs
    Pages --> Services
    DTOs --> Services
    Services --> Engines
    Engines --> Rules
    Services --> Entities
    Services --> Contracts
    Contracts --> Adapters
    Adapters --> Database
    Engines -. optional enhancement .-> OpenAI
    Services --> Providers
```

### Layer responsibilities

| Layer | Responsibility |
| --- | --- |
| Transport | HTTP handling, form processing, routing, status codes, redirects, and cache revalidation |
| DTO | Validation and type-safe boundary contracts |
| Services | Use-case orchestration and application workflows |
| Domain | Framework-independent entities, state, and deterministic rules |
| Repositories | Persistence interfaces consumed by services |
| Infrastructure | Prisma implementations, database access, logging, and provider adapters |

## Request flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Next.js UI
    participant Route as Route or Server Action
    participant DTO as Zod DTO
    participant Service as Application Service
    participant Repository as Repository Contract
    participant Prisma as Prisma Adapter
    participant DB as SQLite

    User->>UI: Submit request
    UI->>Route: HTTP request or form action
    Route->>DTO: Parse and validate input
    alt Invalid input
        DTO-->>Route: Validation issues
        Route-->>UI: Typed error response
    else Valid input
        DTO-->>Route: Validated DTO
        Route->>Service: Execute use case
        Service->>Repository: Read or mutate domain data
        Repository->>Prisma: Invoke implementation
        Prisma->>DB: Query or transaction
        DB-->>Prisma: Persisted records
        Prisma-->>Repository: Domain-safe result
        Repository-->>Service: Result
        Service-->>Route: Use-case response
        Route-->>UI: Response, redirect, or refreshed view
    end
```

Routes and server actions remain thin. They validate untrusted input and delegate business behavior to services.

## Repository pattern

```mermaid
classDiagram
    direction LR

    class ApplicationService {
        +execute(dto)
    }

    class RepositoryContract {
        <<interface>>
        +find(...)
        +create(...)
        +update(...)
    }

    class PrismaRepository {
        +find(...)
        +create(...)
        +update(...)
    }

    class PrismaClient {
        +query()
        +transaction()
    }

    class SQLite {
        <<database>>
    }

    ApplicationService --> RepositoryContract : depends on
    PrismaRepository ..|> RepositoryContract : implements
    PrismaRepository --> PrismaClient : uses
    PrismaClient --> SQLite : persists
```

Examples include `AlertRepository`, `AssetRepository`, `SensorRepository`, `InspectionRepository`, `CopilotContextRepository`, and `TimelineRepository`. Services depend on these interfaces rather than importing Prisma directly, enabling isolated unit tests and replaceable persistence adapters.

## AI Copilot workflow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant API as POST /api/copilot/chat
    participant Conversation as ConversationService
    participant Context as ContextBuilder
    participant ContextRepo as CopilotContextRepository
    participant Health as HealthEngine
    participant Prompt as PromptBuilder
    participant Copilot as CopilotService
    participant OpenAI as OpenAI Responses API
    participant Parser as ResponseParser
    participant Tools as ToolRegistry and ToolExecutor

    User->>API: Message, conversation ID, asset IDs
    API->>Conversation: Load conversation history
    API->>Context: Build selected asset context
    Context->>ContextRepo: Load assets and operational records
    ContextRepo-->>Context: Equipment, sensors, inspections, alerts
    Context->>Health: Calculate health and failure risk
    Health-->>Context: Health context
    Context-->>API: Grounded asset context
    API->>Prompt: Build guarded engineering prompt
    Prompt-->>Copilot: System prompt, history, and context
    Copilot->>OpenAI: Stream structured response
    OpenAI-->>Copilot: Response events
    Copilot->>Parser: Validate structured output

    opt Tool calls requested
        Parser->>Tools: Validate and execute requested tools
        Tools-->>Copilot: Progress and results
        Copilot->>OpenAI: Continue with tool evidence
        OpenAI-->>Copilot: Final response
    end

    Copilot->>Conversation: Persist user and assistant messages
    Copilot-->>User: Stream response and evidence
```

Destructive Copilot tools require permission checks and a signed, short-lived confirmation token. Context and conversation text are treated as data rather than executable instructions.

## Alert workflow

```mermaid
flowchart TD
    Sensor[Sensor reading saved]
    Inspection[Inspection created]
    Report[AI report saved]
    Health[Health recalculated]

    Evaluation[AlertEvaluationService]
    Data[AlertRepository evaluation data]
    HealthEngine[HealthEngine]
    AlertEngine[AlertEngine]
    Rules{Threshold exceeded?}
    Existing{Active fingerprint exists?}
    Recommendation[RecommendationEngine]
    Explanation[AI explanation with deterministic fallback]
    Upsert[Upsert alert and history]
    Resolve[Resolve missing active fingerprints]
    Notify[NotificationService]

    Sensor --> Evaluation
    Inspection --> Evaluation
    Report --> Evaluation
    Health --> Evaluation
    Evaluation --> Data
    Data --> HealthEngine
    HealthEngine --> AlertEngine
    Data --> AlertEngine
    AlertEngine --> Rules
    Rules -- Yes --> Existing
    Existing -- Yes --> Recommendation
    Existing -- No --> Explanation
    Explanation --> Recommendation
    Recommendation --> Upsert
    Upsert --> Notify
    Rules -- No --> Resolve
    Upsert --> Resolve
```

The alert engine evaluates temperature, vibration, voltage, current, humidity, overall health, and failure probability. Stable asset-and-metric fingerprints prevent duplicate active alerts. Conditions that return to normal are resolved automatically.

## Notification workflow

```mermaid
flowchart TD
    Alert[New or materially changed alert]
    Service[NotificationService]
    NotificationEngine[NotificationEngine]
    EscalationEngine[EscalationEngine]
    Severity{Severity}
    Queue[NotificationQueue]
    Due[Dispatch due notifications]
    Provider{Provider channel}
    Logs[(Structured logs)]
    Cancel[Acknowledge or resolve alert]

    Alert --> Service
    Service --> NotificationEngine
    NotificationEngine --> EscalationEngine
    EscalationEngine --> Severity

    Severity -- Critical --> Critical[Immediate jobs and timed escalation]
    Severity -- High --> High[Immediate jobs]
    Severity -- Medium --> Medium[Daily summary jobs]
    Severity -- Low --> Low[Log-only job]

    Critical --> Queue
    High --> Queue
    Medium --> Queue
    Low --> Queue
    Queue --> Due
    Due --> Provider

    Provider -- Email --> Logs
    Provider -- Push --> Logs
    Provider -- SMS --> Logs
    Provider -- Teams --> Logs
    Provider -- Slack --> Logs
    Provider -- Webhook --> Logs
    Provider -- Log only --> Logs

    Cancel --> Service
    Service -->|Cancel pending jobs| Queue
```

All providers are log-only in v1.3. The provider abstraction establishes the integration boundary for future external email, push, SMS, Microsoft Teams, Slack, and webhook adapters. The current queue is process-local and non-durable.

## Design principles

- Deterministic engineering logic remains available when optional AI services fail.
- Services own orchestration; transport code does not contain business rules.
- Persistence and provider integrations remain behind interfaces.
- DTO validation protects every external or serialized boundary.
- Alert, recommendation, timeline, and notification workflows are independently testable.
- AI output augments engineering judgment and does not replace qualified inspection.
