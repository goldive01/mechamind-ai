# MechaMind AI API and Route Reference

This document describes every implemented HTTP API endpoint, server action, and browser-facing route in MechaMind AI.

## Conventions

- Local base URL: `http://localhost:3000`
- JSON endpoints use `Content-Type: application/json` unless otherwise stated.
- Image endpoints use `multipart/form-data`.
- Copilot streaming responses use newline-delimited JSON (`application/x-ndjson`).
- Validation errors use HTTP `422` with an `issues` array where supported.
- Error responses use the shape `{ "error": "Message" }`, sometimes with additional context.
- Dashboard routes return server-rendered HTML rather than JSON.

## Endpoint summary

### Protected APIs

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/ai/analyse` | Analyse an uploaded equipment image |
| `POST` | `/api/ai/save` | Persist an analysis as an inspection and AI report |
| `POST` | `/api/iot/readings` | Store sensor telemetry and evaluate alerts |
| `POST` | `/api/copilot/chat` | Chat, stream, or load an engineering Copilot conversation |

All API endpoints require a valid `mechamind_session` cookie and the endpoint-specific permission. Unauthenticated and unauthorized requests return `401` and `403` respectively.

> There is no `POST /api/copilot` route. The implemented Copilot endpoint is `POST /api/copilot/chat`.

### Dashboard routes

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/` | Public landing page |
| `GET` | `/dashboard` | Operations dashboard |
| `GET` | `/dashboard/alerts` | Searchable Alert Center |
| `GET` | `/dashboard/alerts/:alertId` | Alert detail, recommendation, health snapshot, and lifecycle |
| `GET` | `/dashboard/assets` | Searchable asset registry |
| `GET` | `/dashboard/assets/new` | Create-asset form |
| `GET` | `/dashboard/assets/:assetId` | Asset details and recent alerts |
| `GET` | `/dashboard/assets/:assetId/edit` | Edit-asset form |
| `GET` | `/dashboard/assets/:assetId/health` | Asset health analytics |
| `GET` | `/dashboard/assets/:assetId/timeline` | Engineering asset timeline |
| `GET` | `/dashboard/assistant` | AI assistant workspace |
| `GET` | `/dashboard/copilot` | Engineering Copilot workspace |
| `GET` | `/dashboard/devices` | Registered sensor devices |
| `GET` | `/dashboard/devices/new` | Register-device form |
| `GET` | `/dashboard/devices/:deviceId` | Sensor-device details |
| `GET` | `/dashboard/devices/:deviceId/edit` | Edit-device form |
| `GET` | `/dashboard/equipment` | Equipment overview |
| `GET` | `/dashboard/health` | Fleet health dashboard |
| `GET` | `/dashboard/inspections` | Inspection overview |
| `GET` | `/dashboard/iot` | Live sensor dashboard |
| `GET` | `/dashboard/reports` | Inspection and AI reports |
| `GET` | `/dashboard/scanner` | AI equipment scanner |
| `GET` | `/dashboard/settings` | Application settings |
| `GET` | `/dashboard/organisations` | Select or create an organisation |
| `GET` | `/dashboard/locations` | Manage sites, buildings, and areas in the active organisation |
| `GET` | `/dashboard/inventory` | Inventory balances, movements, transfers, adjustments, and work-order allocation |
| `GET` | `/dashboard/spare-parts` | Searchable spare-part catalogue and reorder status |
| `GET` | `/dashboard/warehouses` | Searchable warehouse management |
| `GET` | `/dashboard/suppliers` | Searchable supplier management |

## AI analysis

### `POST /api/ai/analyse`

Analyses an industrial equipment image using the configured OpenAI model and returns a validated structured assessment.

**Content type:** `multipart/form-data`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `image` | File | Yes | JPEG, PNG, or WebP image, maximum 10 MB |

Example:

```bash
curl -X POST http://localhost:3000/api/ai/analyse \
  -F "image=@./equipment.png"
```

Success response — `200 OK`:

```json
{
  "equipmentName": "Hydraulic Pump Unit 04",
  "manufacturer": "Northwind Manufacturing",
  "category": "Hydraulic",
  "confidence": 0.91,
  "summary": "Equipment condition summary.",
  "detectedComponents": ["Pressure valve", "Drive shaft"],
  "safetyHazards": ["Minor fluid seepage"],
  "possibleFaults": ["Early-stage seal degradation"],
  "maintenanceRecommendations": ["Inspect the seal assembly"],
  "estimatedCondition": "Good"
}
```

| Status | Meaning |
| --- | --- |
| `400` | Missing or empty image |
| `413` | Image exceeds 10 MB |
| `415` | Unsupported media type |
| `422` | AI response does not match the analysis DTO |
| `500` | Missing configuration or internal analysis failure |
| `502` | OpenAI provider failure |

## Save AI inspection

### `POST /api/ai/save`

Persists a validated analysis, uploaded image, inspection, asset association, and AI report. It automatically evaluates alerts after the inspection and report are saved.

**Content type:** `multipart/form-data`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `image` | File | Yes | JPEG, PNG, or WebP image, maximum 10 MB |
| `analysis` | JSON string | Yes | Object matching the analysis response schema |

Example:

```bash
curl -X POST http://localhost:3000/api/ai/save \
  -F "image=@./equipment.png" \
  -F 'analysis={"equipmentName":"Pump 04","manufacturer":"Mecha","category":"Pump","confidence":0.92,"summary":"Seal wear detected","detectedComponents":["Pump","Seal"],"safetyHazards":[],"possibleFaults":["Seal wear"],"maintenanceRecommendations":["Inspect seal"],"estimatedCondition":"Fair"}'
```

Success response — `200 OK`:

```json
{
  "success": true,
  "equipmentId": "equipment-id",
  "assetId": "MM-000001",
  "inspectionId": "inspection-id",
  "aiReportId": "report-id",
  "imagePath": "/uploads/2026/08/26/image-id.png"
}
```

| Status | Meaning |
| --- | --- |
| `400` | Missing image, missing analysis, or malformed analysis JSON |
| `413` | Image exceeds 10 MB |
| `415` | Unsupported media type |
| `422` | Analysis payload does not match the DTO |
| `500` | Persistence or upload failure |

## IoT readings

### `POST /api/iot/readings`

Stores telemetry for a registered sensor device. After persistence, automatic alert evaluation checks temperature, humidity, vibration, voltage, current, overall health, and failure probability.

**Content type:** `application/json`

At least one device identifier and one sensor value are required.

| Field | Type | Required | Range or format |
| --- | --- | --- | --- |
| `deviceId` | String | Conditional | Required when `macAddress` is absent |
| `macAddress` | String | Conditional | Required when `deviceId` is absent |
| `temperature` | Number | Conditional | `-100` to `250` |
| `humidity` | Number | Conditional | `0` to `100` |
| `vibration` | Number | Conditional | `0` to `1000` |
| `voltage` | Number | Conditional | `0` to `100000` |
| `current` | Number | Conditional | `0` to `10000` |
| `recordedAt` | ISO 8601 string | No | Date-time with timezone offset |

Example:

```bash
curl -X POST http://localhost:3000/api/iot/readings \
  -H "Content-Type: application/json" \
  -d '{
    "macAddress": "00:1A:2B:3C:4D:5E",
    "temperature": 86.4,
    "vibration": 7.8,
    "voltage": 230,
    "current": 72.1,
    "humidity": 61,
    "recordedAt": "2026-08-26T10:30:00+01:00"
  }'
```

Success response — `201 Created`:

```json
{
  "success": true,
  "reading": {
    "id": "reading-id",
    "sensorDeviceId": "device-id",
    "temperature": 86.4,
    "humidity": 61,
    "vibration": 7.8,
    "voltage": 230,
    "current": 72.1,
    "recordedAt": "2026-08-26T09:30:00.000Z"
  }
}
```

| Status | Meaning |
| --- | --- |
| `400` | Request body is not valid JSON |
| `404` | Sensor device is not registered |
| `422` | Missing identifiers, missing metrics, unknown fields, or unsupported values |
| `500` | Persistence failure |

## Engineering Copilot

### `POST /api/copilot/chat`

Supports three request modes through one endpoint:

1. Streaming conversation chat
2. Conversation loading
3. Legacy non-streaming chat

The endpoint requires `OPENAI_API_KEY` for generated Copilot responses.

### Streaming chat mode

Request:

```json
{
  "action": "chat",
  "conversationId": "optional-conversation-id",
  "message": "Explain the vibration trend and recommend next steps.",
  "assetIds": ["MM-000001"],
  "confirmations": []
}
```

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `action` | `"chat"` | No | Defaults to `chat` |
| `conversationId` | String | No | Continues an existing conversation |
| `message` | String | Yes | 1–8,000 characters |
| `assetIds` | String array | No | Maximum 8; format `MM-000000` |
| `confirmations` | Object array | No | Maximum 6 tool confirmation tokens |

Response — `200 OK`, `application/x-ndjson`:

```jsonl
{"type":"conversation","conversationId":"conversation-id"}
{"type":"tool_progress","tool":"getAssetHealth","message":"Loading asset health"}
{"type":"tool_result","result":{"tool":"getAssetHealth","status":"success","data":{},"message":"Health loaded"}}
{"type":"delta","content":"The "}
{"type":"delta","content":"asset "}
{"type":"complete","messageId":"message-id","response":{"answer":"The asset health is declining.","severity":"high","recommendations":["Inspect bearings"],"evidence":[],"followUpQuestions":[],"toolCalls":[]}}
```

Stream failures are emitted as an NDJSON event:

```json
{"type":"error","error":"The engineering copilot is temporarily unavailable."}
```

### Load conversation mode

Request:

```json
{
  "action": "load",
  "conversationId": "conversation-id"
}
```

Success response — `200 OK`:

```json
{
  "conversation": {
    "id": "conversation-id",
    "title": "Engineering conversation",
    "assetIds": ["MM-000001"],
    "messages": []
  }
}
```

### Legacy chat mode

Request:

```json
{
  "messages": [
    { "role": "user", "content": "What is the current failure risk?" }
  ],
  "assetIds": ["MM-000001"]
}
```

The request accepts 1–20 messages and requires the final message to have role `user`.

Success response — `200 OK`:

```json
{
  "response": {
    "answer": "The current failure risk is elevated.",
    "severity": "high",
    "recommendations": ["Inspect the bearing assembly"],
    "evidence": [
      { "assetId": "MM-000001", "source": "health", "detail": "Failure probability is elevated." }
    ],
    "followUpQuestions": [],
    "toolCalls": []
  }
}
```

| Status | Meaning |
| --- | --- |
| `400` | Request body is not valid JSON |
| `404` | Conversation does not exist |
| `422` | Request does not match a supported Copilot mode |
| `500` | Unexpected internal error |
| `502` | OpenAI provider failure |
| `503` | Copilot is not configured |

## Copilot tools

Tool requests are generated and executed through the chat endpoint; they are not standalone HTTP endpoints.

| Tool | Purpose | Confirmation |
| --- | --- | --- |
| `searchAssets` | Search registered assets | No |
| `getAssetHealth` | Load health for an asset | No |
| `compareAssets` | Compare selected asset health | No |
| `calculateHealth` | Recalculate health | No |
| `generateInspectionReport` | Generate an inspection report | No |
| `createMaintenance` | Create a maintenance record | Yes |

Tool results can have `success`, `confirmation_required`, `forbidden`, `invalid`, or `error` status.

## Server actions

Server actions are framework-generated POST requests used by dashboard forms. Their internal action URLs are not stable public API contracts; callers should use the rendered forms.

### Asset actions

#### `createAsset(formData)`

Creates an equipment record and its asset, refreshes `/dashboard/assets`, then redirects to the new asset.

#### `updateAsset(assetId, formData)`

Updates the asset and linked equipment, refreshes affected pages, then redirects to asset details.

Asset form fields:

| Field | Required |
| --- | --- |
| `name` | Yes |
| `manufacturer` | Yes |
| `model` | Yes |
| `serialNumber` | Yes |
| `category` | Yes |
| `location` | No |
| `description` | No |
| `status` | Yes: `Active`, `Needs Attention`, or `Inactive` |
| `primaryImage` | No |

### Device actions

#### `createDevice(formData)`

Registers a sensor device and redirects to its detail page.

#### `updateDevice(deviceId, formData)`

Updates a registered device and refreshes the device and IoT dashboards.

Device form fields: `assetId`, `deviceName`, `sensorType`, `macAddress`, and `firmwareVersion`. All are required.

### Alert actions

#### `acknowledgeAlert(formData)`

Acknowledges an open alert through `AlertService` and cancels pending escalation notifications.

#### `resolveAlert(formData)`

Resolves an active alert through `AlertService` and cancels pending notifications.

Alert action fields:

| Field | Required | Notes |
| --- | --- | --- |
| `alertId` | Yes | Alert database identifier |
| `actor` | No | Defaults to `Operations Team` |
| `note` | No | Maximum 1,000 characters |

## Dashboard route details

### General routes

#### `GET /`

Public MechaMind AI landing page.

#### `GET /dashboard`

Operations overview and entry point to dashboard modules.

#### `GET /dashboard/assistant`

General AI assistant interface.

#### `GET /dashboard/settings`

Application settings interface.

### Asset routes

#### `GET /dashboard/assets`

Asset registry with optional query parameters:

| Parameter | Description |
| --- | --- |
| `query` | Searches public asset ID, equipment name, manufacturer, model, or serial number |
| `status` | Filters by asset status |
| `category` | Filters by equipment category |

Example: `/dashboard/assets?query=pump&status=Active&category=Hydraulic`

#### `GET /dashboard/assets/new`

Create-asset form.

#### `GET /dashboard/assets/:assetId`

Asset details, equipment information, latest inspection, AI report, maintenance history, and recent alerts. Returns the application not-found page when the public asset ID is unknown.

#### `GET /dashboard/assets/:assetId/edit`

Edit form for an existing asset.

#### `GET /dashboard/assets/:assetId/health`

Detailed deterministic health scores, failure probability, trends, and maintenance guidance.

#### `GET /dashboard/assets/:assetId/timeline`

Reverse-chronological engineering timeline aggregating inspections, telemetry, health history, alerts, recommendations, and maintenance.

### Alert routes

#### `GET /dashboard/alerts`

Alert Center with optional query parameters:

| Parameter | Values or purpose |
| --- | --- |
| `search` | Searches alert text |
| `severity` | `Critical`, `High`, `Medium`, `Low` |
| `status` | `Open`, `Acknowledged`, `Resolved` |
| `category` | Alert category |
| `assetId` | Public asset identifier |
| `sort` | `newest`, `oldest`, `severity`, or `asset` |
| `alertId` | Selects an alert for the inline lifecycle timeline |

#### `GET /dashboard/alerts/:alertId`

Alert detail with trigger source, observed and threshold values, health snapshot, structured engineering recommendation, actions, and lifecycle history.

### IoT and device routes

#### `GET /dashboard/iot`

Live telemetry charts. The optional `deviceId` query parameter limits readings to one registered device.

#### `GET /dashboard/devices`

Registered sensor-device list.

#### `GET /dashboard/devices/new`

Device registration form.

#### `GET /dashboard/devices/:deviceId`

Device details and associated asset information.

#### `GET /dashboard/devices/:deviceId/edit`

Edit form for an existing device.

### Engineering and reporting routes

#### `GET /dashboard/health`

Fleet health, safety, failure risk, maintenance priority, and historical trends.

#### `GET /dashboard/scanner`

AI image-analysis workflow backed by `/api/ai/analyse` and `/api/ai/save`.

#### `GET /dashboard/copilot`

Context-aware engineering chat interface backed by `/api/copilot/chat`.

#### `GET /dashboard/reports`

Saved inspection and AI-report viewer.

#### `GET /dashboard/inspections`

Inspection module overview.

#### `GET /dashboard/equipment`

Equipment module overview.

## Authentication

`GET /login` renders the credential form. Successful authentication creates an opaque, HTTP-only, SameSite=Lax database session cookie. Dashboard routes validate that session in the shared layout. Dashboard mutations and API handlers repeat authorization checks at their server boundary. Copilot receives the authenticated role and permissions and only executes tools covered by those permissions.

Seeded development accounts use `SEED_USER_PASSWORD`, or `MechaMind123!` when the environment variable is absent. Production deployments must set a unique value and rotate seeded credentials.

Administrative pages require `system:admin`:

- `GET /dashboard/users` creates users and assigns roles.
- `GET /dashboard/roles` creates roles and grants or revokes permissions.
- `GET /dashboard/permissions` creates permission definitions.

The field routes under `/mobile` require an authenticated session. Every field mutation additionally requires `dashboard:write`.

## Production considerations

### Inventory routes

Inventory dashboard routes support server-rendered search and pagination-ready query contracts. Inventory actions validate all form data before calling `WarehouseService`, `SupplierService`, `InventoryService`, or `StockMovementService`. Movement actions cover receipts, issues, returns, transfers, adjustments, and automatic work-order consumption.

Completing a work order consumes reserved parts once, creates asset-linked stock movements, and exposes those movements to the asset timeline and Copilot context.

Before internet-facing deployment:
- Apply request-rate limits, especially to AI and telemetry endpoints.
- Protect uploaded files and validate access to asset data.
- Use a production database and durable notification queue.
- Store secrets only in protected environment variables.

## Engineering Memory in Copilot

`POST /api/copilot/chat` searches and ranks organisation-scoped Engineering Memory before each provider request. Up to eight ranked memories are injected into protected prompt context. Responses may use `memory` as an evidence source and cite `[Memory:<id>]`.

The same request searches the organisation-scoped Engineering Knowledge Graph and traverses related nodes up to a bounded depth. Relevant nodes, directed relationships, and supporting facts are injected alongside memory context. Responses may use `knowledge` as an evidence source and cite `[Knowledge:<id>]`.
