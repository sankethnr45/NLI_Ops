# NLI Ops Assistant Project Progress

Last updated: 2026-06-02

## 1. Project Purpose

This project is an AI-powered operational intelligence backend.

It lets a user ask natural language questions about industrial equipment and operational data, such as:

- "Show compressors with critical vibration alerts"
- "Get maintenance history for asset 248K001B"
- "Which assets have overheating issues?"
- "Correlate critical vibration alerts with maintenance history"

The backend is not a generic chatbot. It is an orchestration server that connects:

```txt
User request
-> Express backend
-> LLM reasoning and tool selection
-> controlled backend tools
-> MongoDB
-> LLM summarization
-> operational response
```

The key architectural rule is:

```txt
The AI model never directly accesses MongoDB.
```

The model can choose from explicit backend tools, but all database access stays inside backend-owned TypeScript functions.

## 2. Engineering Philosophy

The project intentionally prioritizes learning and architectural clarity over enterprise abstractions.

We are avoiding:

- LangChain
- agents
- repositories
- dependency injection containers
- workflow engines
- plugin systems
- distributed architecture
- complex middleware stacks

We are preferring:

- explicit async/await code
- readable request flow
- small service boundaries
- typed tool inputs and outputs
- controlled MongoDB access
- beginner-friendly orchestration logic

The goal is to understand AI orchestration deeply, not to hide it behind a framework.

## 3. Current Technology Stack

- Node.js
- Express
- TypeScript
- MongoDB
- Gemini API as the initial LLM provider
- Native Gemini function/tool calling
- Server-Sent Events for streaming
- Pino for structured logs
- Node's built-in test runner through `tsx`

## 4. Current Folder Structure

```txt
src/
├── config/
│   └── env.ts
├── controllers/
│   ├── chat.controller.ts
│   └── operational.controller.ts
├── models/
│   └── operational.models.ts
├── routes/
│   ├── chat.routes.ts
│   └── operational.routes.ts
├── server/
│   ├── app.ts
│   └── index.ts
├── services/
│   ├── llm/
│   │   ├── gemini.service.ts
│   │   ├── llm.service.ts
│   │   └── openai.service.ts
│   ├── mongo.service.ts
│   ├── operational.service.ts
│   └── orchestration.service.ts
├── tools/
│   ├── alerts.tool.ts
│   ├── assets.tool.ts
│   ├── maintenance.tool.ts
│   └── tool-registry.ts
├── types/
│   └── cors.d.ts
└── utils/
    ├── logger.ts
    └── timing.ts

scripts/
└── seed-data.ts

tests/
├── operational-tools.test.ts
└── orchestration.test.ts
```

## 5. Backend Foundation Completed

The Express backend foundation is implemented.

Completed pieces:

- Express app bootstrap
- JSON request parsing
- CORS
- health endpoint
- route/controller/service separation
- MongoDB connection service
- environment config
- operational models
- explicit operational tool layer
- TypeScript build setup
- test setup

Important files:

- `src/server/app.ts`
- `src/server/index.ts`
- `src/config/env.ts`
- `src/services/mongo.service.ts`
- `src/models/operational.models.ts`

## 6. MongoDB Operational Data Model

The backend expects these collections:

### assets

Stores equipment metadata.

Fields include:

- `asset_id`
- `type`
- `unit`
- `status`
- `health`

Example:

```json
{
  "asset_id": "248K001B",
  "type": "compressor",
  "unit": "Unit-3",
  "status": "running",
  "health": "warning"
}
```

### alerts

Stores operational alerts and anomalies.

Fields include:

- `asset_id`
- `alert_type`
- `severity`
- `value`
- `timestamp`

Example:

```json
{
  "asset_id": "248K001B",
  "alert_type": "high_vibration",
  "severity": "critical",
  "value": 9.3,
  "timestamp": "2026-05-14T10:30:00"
}
```

### sensor_readings

Stores telemetry.

Fields include:

- `asset_id`
- `temperature`
- `vibration`
- `pressure`
- `timestamp`

### maintenance_logs

Stores maintenance history.

Fields include:

- `asset_id`
- `issue`
- `action`
- `timestamp`

## 7. Operational Tools Completed

The project has four backend tools:

### getCriticalAlerts

Purpose:

Returns critical operational alerts.

Supports optional filters:

- `assetType`
- `alertType`

This tool enriches alerts with matching asset metadata, so the AI can know whether an alert belongs to a compressor, pump, turbine, or heat exchanger.

### getAssetStatus

Purpose:

Returns metadata, status, and health for one asset.

Input:

- `assetId`

### getMaintenanceHistory

Purpose:

Returns maintenance history for one asset.

Input:

- `assetId`

### getHighVibrationAssets

Purpose:

Returns sensor readings where vibration is above a threshold.

Supports optional filters:

- `minimumVibration`
- `assetType`

This tool also enriches readings with asset metadata.

## 8. Tool Registry

The tool registry lives in:

```txt
src/tools/tool-registry.ts
```

It provides two important things:

1. Tool schemas for the LLM
2. A backend executor that maps tool names to TypeScript functions

The LLM receives structured tool schemas. It can choose a tool and provide arguments, but it cannot run arbitrary database queries.

Example tool call selected by Gemini:

```json
{
  "name": "getCriticalAlerts",
  "args": {
    "assetType": "compressor",
    "alertType": "high_vibration"
  }
}
```

The backend then executes:

```txt
executeOperationalTool("getCriticalAlerts", args)
```

That function calls the real backend tool, which queries MongoDB safely.

## 9. REST Endpoints

### Health

```txt
GET /health
```

Returns a simple service health response.

### Operational REST Endpoints

These are direct REST access points to operational tools:

```txt
GET /api/alerts/critical
GET /api/assets/high-vibration?minimumVibration=7
GET /api/assets/:assetId/status
GET /api/assets/:assetId/maintenance
```

These endpoints are useful for testing the backend tools without involving the LLM.

### Chat Endpoint

```txt
POST /chat
```

Request:

```json
{
  "message": "Show compressors with critical vibration alerts"
}
```

Response:

```json
{
  "response": "248K001B shows critical vibration anomalies..."
}
```

### Streaming Chat Endpoint

```txt
POST /chat/stream
```

This endpoint uses Server-Sent Events.

It streams events such as:

- `status`
- `tool_start`
- `tool_done`
- `token`
- `done`

Example:

```bash
curl -N -X POST http://localhost:5000/chat/stream \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Correlate critical vibration alerts with maintenance history\"}"
```

On Windows CMD:

```cmd
curl -N -X POST http://localhost:5000/chat/stream ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"Correlate critical vibration alerts with maintenance history\"}"
```

## 10. LLM Provider Layer

The LLM provider layer lives in:

```txt
src/services/llm/
```

Current files:

- `llm.service.ts`
- `gemini.service.ts`
- `openai.service.ts`

Gemini is the active provider.

Provider selection is controlled by:

```txt
LLM_PROVIDER=gemini
```

The architecture is provider-agnostic at the orchestration boundary. The orchestration service talks to a small `LlmService` interface instead of directly calling Gemini everywhere.

Current provider methods:

- `generateToolPlan`
- `generateFollowUpToolPlan`
- `summarizeWithToolResults`
- `streamSummaryWithToolResults`

This keeps future provider support possible without changing the whole orchestration flow.

## 11. Gemini Integration

Gemini integration is implemented in:

```txt
src/services/llm/gemini.service.ts
```

Current Gemini capabilities:

- native function/tool calling
- structured tool schemas
- follow-up tool planning
- operational summarization
- streaming final summaries with `streamGenerateContent`

Important environment variables:

```txt
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

We fixed a previous issue where `gemini-1.5-flash` was rejected by the API. The current default is:

```txt
gemini-2.5-flash
```

## 12. Current POST /chat Lifecycle

The current non-streaming lifecycle is:

```txt
Client
-> POST /chat
-> chat.routes.ts
-> chat.controller.ts
-> orchestration.service.ts
-> llm.service.ts
-> gemini.service.ts
-> Gemini tool selection
-> tool-registry.ts
-> backend operational tool
-> MongoDB
-> optional follow-up tool planning
-> more backend tools if needed
-> Gemini summary
-> JSON response
```

Detailed flow:

1. Client sends a natural language message.
2. Controller validates that `message` is a string.
3. Controller calls `runOperationalChat`.
4. Orchestration validates the message.
5. Orchestration asks Gemini to choose tools.
6. Gemini returns zero or more tool calls.
7. Backend executes selected tools.
8. Tool results are collected.
9. Orchestration asks Gemini whether follow-up tools are useful.
10. Backend executes follow-up tools if selected.
11. All tool results are aggregated.
12. Gemini summarizes the operational meaning.
13. Controller returns `{ response }`.

## 13. Current POST /chat/stream Lifecycle

The streaming lifecycle is similar, but the client receives progress events.

```txt
Client
-> POST /chat/stream
-> chat controller sets SSE headers
-> orchestration planning
-> status event
-> tool_start event
-> tool_done event
-> follow-up planning
-> streaming Gemini summary
-> token events
-> done event
```

The streaming route is intentionally simple. It uses SSE instead of WebSockets because the server only needs to push one-way progress and response text to the client.

## 14. Multi-Step Orchestration Completed

The orchestration service now supports a simple two-stage reasoning flow:

### Stage 1: Initial tool plan

Gemini receives the user query and available tool schemas.

Example:

```txt
User: Correlate critical vibration alerts with maintenance history
```

Gemini may choose:

```json
[
  {
    "name": "getCriticalAlerts",
    "args": {
      "alertType": "high_vibration"
    }
  }
]
```

### Stage 2: Follow-up tool plan

After the backend returns critical vibration alerts, Gemini sees the tool results and can request more data.

Example follow-up:

```json
[
  {
    "name": "getMaintenanceHistory",
    "args": {
      "assetId": "248K001B"
    }
  }
]
```

This enables maintenance correlation without introducing agents or workflow frameworks.

## 15. Operational Summarization Improvements

The summarization prompt now asks Gemini to focus on:

- anomaly interpretation
- repeated asset IDs
- recurring alert types
- high telemetry values
- asset health/status
- maintenance issues
- correlation between alerts and maintenance logs
- practical next checks

Instead of a weak response like:

```txt
3 alerts found.
```

The target response is more like:

```txt
248K001B shows recurring critical vibration anomalies. Its maintenance history includes bearing wear, so the vibration pattern may be linked to rotating equipment degradation or incomplete bearing recovery. Prioritize inspection of bearings, alignment, and vibration trend history.
```

The AI is still instructed not to invent facts. It should only infer from tool results.

## 16. Observability Completed

The project now includes structured logs for:

- incoming orchestration requests
- initial Gemini tool planning
- selected tools
- tool execution start
- tool execution completion
- tool execution timing
- MongoDB query start
- MongoDB query completion
- MongoDB query timing
- follow-up tool planning
- Gemini summary timing
- total orchestration timing

Logging files:

- `src/utils/logger.ts`
- `src/utils/timing.ts`

Example log metadata:

```json
{
  "category": "tool",
  "operation": "execute_complete",
  "toolName": "getCriticalAlerts",
  "durationMs": 12
}
```

## 17. Tests Completed

Test files:

```txt
tests/operational-tools.test.ts
tests/orchestration.test.ts
```

Current test coverage includes:

- critical alert retrieval
- asset type enrichment
- alert type filtering
- asset status retrieval
- maintenance history retrieval
- high vibration retrieval
- vibration filtering by asset type
- initial tool orchestration
- direct LLM response with no tools
- follow-up tool orchestration for maintenance correlation

Current verification commands:

```txt
cmd /c npm test
cmd /c npm run build
```

The `cmd /c` prefix is useful on this Windows machine because PowerShell blocks `npm.ps1`.

## 18. Important Problems We Solved

### Problem: Gemini model 404

The app originally used:

```txt
gemini-1.5-flash
```

Gemini returned a 404 because that model was not supported for the requested API route.

Fix:

```txt
GEMINI_MODEL=gemini-2.5-flash
```

### Problem: AI said asset type was unavailable

The high vibration tool originally returned only sensor readings.

Sensor readings had:

```txt
asset_id
temperature
vibration
pressure
```

They did not include:

```txt
type
unit
status
health
```

Fix:

Both alert and vibration tools now join against the `assets` collection and return enriched results.

### Problem: Summaries were too shallow

The original summarization behavior could produce count-style responses.

Fix:

The summary prompt now asks for operational interpretation and maintenance correlation.

### Problem: Single-step orchestration was limited

The backend could execute multiple tools if Gemini selected them upfront, but it did not support a second reasoning pass after seeing results.

Fix:

The orchestration service now supports one explicit follow-up tool planning step.

## 19. Current Limitations

These are known and acceptable for the current learning-focused stage:

- No authentication
- No authorization
- No dashboard/frontend
- No real MCP server protocol yet
- No OpenAI provider implementation yet
- No Ollama provider implementation yet
- No persistent chat history
- No RAG/vector database
- No production-grade streaming client
- No retry/backoff around Gemini calls
- No rate limit handling
- No request cancellation propagation to Gemini/Mongo yet
- No advanced analytics or prediction

These should not be added casually. Each should be introduced only when it teaches a clear architectural concept.

## 20. Recommended Next Steps

### Step 1: Add a Simple README

Create a beginner-friendly `README.md` explaining:

- what the project does
- how to install dependencies
- how to configure `.env`
- how to seed MongoDB
- how to run the dev server
- how to test `/chat`
- how to test `/chat/stream`

This is the most useful next step for usability.

### Step 2: Add Example Requests

Create:

```txt
docs/example-queries.md
```

Include examples like:

- "Show compressors with critical vibration alerts"
- "Correlate critical vibration alerts with maintenance history"
- "Get maintenance history for asset 248K001B"
- "Which pumps have overheating issues?"
- "Show assets with vibration above 8"

For each example, document:

- expected tools
- expected data flow
- expected response style

This will make the orchestration behavior easier to learn.

### Step 3: Improve Seed Data for Correlation

The current architecture supports correlation, but the quality depends on the data.

Improve seed data so there are deliberate patterns:

- compressor with repeated high vibration alerts
- same compressor with bearing wear maintenance
- pump with overheating alerts
- turbine with pressure anomaly
- asset with normal readings for contrast

This will make AI summaries more meaningful.

### Step 4: Add Tool Result Size Limits

Add simple limits so tools do not return too much data to Gemini.

Example:

```txt
Return top 10 critical alerts by timestamp or severity.
```

This keeps prompts smaller and summaries more focused.

### Step 5: Add OpenAI Provider

Implement:

```txt
src/services/llm/openai.service.ts
```

Keep the same `LlmService` interface.

Do not change orchestration logic unless absolutely necessary.

This will test whether the provider abstraction is actually useful.

### Step 6: Add Request IDs to HTTP Responses

Logs already include request IDs internally.

Next improvement:

- include request ID in `/chat` response
- include request ID in SSE events
- maybe add `X-Request-Id` header

This would make debugging easier.

### Step 7: Add Basic Error Categories

Currently errors are returned as:

```json
{
  "error": {
    "message": "..."
  }
}
```

Add simple categories:

- validation_error
- llm_error
- tool_error
- database_error

Avoid complex error frameworks.

### Step 8: Add Streaming Client Example

Create a tiny HTML file or script that calls `/chat/stream`.

This would help visualize SSE without needing a frontend framework.

### Step 9: Add Real MCP Server Later

Only after the current MCP-style architecture is well understood, consider implementing a real MCP server.

Current project already teaches the core idea:

```txt
AI chooses controlled tools.
Backend executes tools.
Data access stays protected.
```

A real MCP server can come later as a comparison point.

### Step 10: Add Evaluation Cases

Create a small manual evaluation checklist:

- Did the AI choose the right tool?
- Did it avoid inventing facts?
- Did it cite asset IDs?
- Did it correlate maintenance only when evidence exists?
- Did it explain operational significance?

This is more useful than generic unit tests for AI behavior.

## 21. Suggested Development Order

Recommended sequence:

```txt
1. README
2. Example query documentation
3. Better seed data
4. Tool result limits
5. Request IDs in responses
6. Error categories
7. Streaming client example
8. OpenAI provider
9. Real MCP server experiment
10. Evaluation checklist
```

This order keeps the project educational and avoids jumping too quickly into advanced architecture.

## 22. Mental Model to Remember

This project has three separate responsibilities:

### Express Backend

Owns:

- HTTP routes
- request validation
- orchestration
- tool execution
- MongoDB access
- error handling
- logging

### LLM

Owns:

- language understanding
- tool selection
- argument extraction
- summarization
- operational explanation

### Tools

Own:

- safe database access
- typed inputs
- structured outputs
- predictable operational capabilities

The model reasons, but the backend acts.

That is the core architecture of this project.
