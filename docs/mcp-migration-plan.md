# MCP Migration Plan

## 1. Current Architecture

The project currently has an Express backend that acts as the AI orchestration host.

Current request flow:

```txt
Client
-> Express backend
-> Gemini orchestration
-> tool registry
-> MCP client or local tool
-> MongoDB
-> Gemini summary
-> response
```

Current MCP state:

- `alerts-mcp-server` exists.
- `getCriticalAlerts` is exposed as an MCP tool.
- `getHighVibrationAssets` is exposed as an MCP tool.
- Express acts as an MCP host/client over stdio.
- Gemini still receives one unified set of tool schemas.

Current split before Phase 4:

```txt
Alerts tools      -> MCP server
Asset tools       -> local backend tool
Maintenance tools -> local backend tool
```

After Phase 4, all operational tools are routed through MCP servers.

## 2. Target Architecture

Target request flow:

```txt
Client
-> Express backend
-> Gemini orchestration
-> tool registry
-> MCP host/client layer
-> domain MCP server
-> MongoDB
-> structured tool result
-> Gemini summary
-> response
```

Target MCP server layout:

```txt
alerts-mcp-server
asset-mcp-server
maintenance-mcp-server
```

The Express backend remains the host:

- receives HTTP requests
- asks Gemini to select tools
- discovers MCP tools
- calls MCP tools
- aggregates results
- asks Gemini to summarize

The MCP servers own operational data access for their domain.

Current implemented layout:

```txt
Alerts MCP Server      -> getCriticalAlerts, getHighVibrationAssets
Asset MCP Server       -> getAssetStatus
Maintenance MCP Server -> getMaintenanceHistory
```

## 3. MCP Server Ownership Boundaries

### Alerts MCP Server

Responsibilities:

- alert retrieval
- alert filtering
- vibration telemetry retrieval
- alert and telemetry enrichment with asset metadata
- operational anomaly data access

MongoDB collections used:

- `alerts`
- `sensor_readings`
- `assets`

Current tools:

- `getCriticalAlerts`
- `getHighVibrationAssets`

Future tools:

- `getOverheatingAlerts`
- `getAlertsByAsset`
- `getRecentAlertsByUnit`
- `getRecurringAlertAssets`
- `getAlertTrendForAsset`

### Asset MCP Server

Responsibilities:

- asset metadata lookup
- asset status lookup
- asset health lookup
- asset inventory-style queries

MongoDB collections used:

- `assets`

Current tools:

- `getAssetStatus`

Future tools:

- `getAssetsByType`
- `getAssetsByHealth`
- `getAssetsByUnit`
- `getRunningAssets`
- `getAssetsInMaintenance`

### Maintenance MCP Server

Responsibilities:

- maintenance history lookup
- maintenance issue correlation
- maintenance action retrieval
- asset maintenance context

MongoDB collections used:

- `maintenance_logs`

Current tools:

- `getMaintenanceHistory`

Future tools:

- `getMaintenanceByIssue`
- `getRecentMaintenanceActions`
- `getMaintenanceHistoryByUnit`
- `getAssetsWithRepeatedMaintenance`
- `getMaintenanceCorrelationForAlert`

## 4. Migration Steps

### Phase 1: MCP Foundation

Completed:

- installed official MCP SDK
- created `alerts-mcp-server`
- connected Express host to alerts MCP server over stdio
- verified tool discovery with `listTools`
- verified remote execution with `callTool`

### Phase 2: Complete Operational MCP Migration

Completed:

- created `asset-mcp-server`
- moved `getAssetStatus` execution behind MCP
- created `maintenance-mcp-server`
- moved `getMaintenanceHistory` execution behind MCP
- updated the host tool registry to call MCP clients for all operational tools
- kept Gemini orchestration unchanged

### Phase 3: Documentation and Examples

Planned:

- document each server's tools
- add example MCP calls
- add example natural language queries and expected tool routes

### Phase 4: Refinement

Planned:

- add consistent MCP client shutdown handling
- improve MCP error messages
- add basic MCP smoke tests
- add tool result size limits

## 5. Risks and Considerations

### Process lifecycle

Stdio MCP servers are child processes. The host should avoid spawning a new server for every tool call.

Current approach:

- cache one MCP client per domain server
- reuse the stdio transport after discovery

### Error visibility

MCP adds a transport boundary. Errors can now happen in:

- host orchestration
- MCP client
- stdio transport
- MCP server
- MongoDB query

Logs should clearly say which layer failed.

### Tool schema drift

Gemini receives tool schemas from the host. MCP servers also register tool schemas.

Risk:

- host schema and MCP server schema could drift.

Near-term mitigation:

- keep schemas simple
- update host and server together

Future mitigation:

- derive Gemini-facing schemas from MCP discovery where practical

### Over-abstraction

The goal is learning. Avoid turning MCP migration into an enterprise platform.

Keep:

- one simple server per domain
- one simple client service per server
- explicit tool routing

Avoid:

- plugin registries
- service meshes
- Docker-only development
- distributed deployments

## 6. Future MCP Expansion Roadmap

Recommended order:

1. Add simple automated MCP smoke tests.
2. Add example query documentation showing which MCP server is used.
3. Add tool result limits for large operational datasets.
4. Add error categories for MCP failures.
5. Add optional request IDs to MCP call logs.
6. Add OpenAI provider while keeping MCP tool execution unchanged.
7. Experiment with deriving Gemini-facing schemas from MCP discovery.
8. Consider HTTP transport only after stdio is well understood.
9. Add more domain tools inside existing MCP servers.
10. Consider a real deployment model only after the local architecture is stable.

The important mental model:

```txt
Gemini selects tools.
Express hosts orchestration.
MCP servers own tool execution.
MongoDB remains protected behind controlled tools.
```
