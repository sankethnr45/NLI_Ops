# AGENTS.md

## Project Overview

This project is an AI-powered operational intelligence backend.

The system allows users to query industrial/operational data using natural language.

Users interact with the system through a chat-style interface.

The backend uses:

* Node.js
* Express
* TypeScript
* MongoDB
* OpenAI/Gemini APIs for reasoning
* MCP-style tool architecture

The project is NOT a generic chatbot.

The system acts as:

* an AI orchestration layer
* a natural language interface (NLI)
* a controlled operational data access system

The AI model performs:

* NLP
* reasoning
* tool selection
* summarization

The backend performs:

* orchestration
* tool execution
* MongoDB querying
* validation
* permissions
* response handling

The AI model MUST NEVER directly access MongoDB.

The backend exposes controlled MCP-style tools instead.

---

# Core Architecture

User
→ Express Backend
→ OpenAI/Gemini API
→ MCP-style tools
→ MongoDB

The backend is an orchestration server, not an AI model host.

---

# Primary Learning Goals

This repository prioritizes:

1. learning AI systems architecture
2. understanding MCP concepts
3. understanding tool-calling workflows
4. understanding orchestration patterns
5. clean backend engineering
6. maintainable system design

Learning and architectural clarity are more important than rapid feature generation.

Avoid overengineering.

---

# Current MVP Scope

The MVP supports:

* natural language operational queries
* AI tool calling
* MongoDB operational data retrieval
* structured operational responses

Initial examples:

* "Show compressors with critical vibration alerts"
* "Get maintenance history for asset 248K001B"
* "Which assets have overheating issues?"

The MVP DOES NOT include:

* authentication
* dashboards
* RAG
* LangChain
* vector databases
* memory systems
* distributed microservices
* local LLM hosting
* advanced analytics
* Kubernetes
* event streaming

Do not introduce unnecessary complexity.

---

# Domain Context

The domain is industrial operational intelligence.

Primary operational entities:

* compressors
* pumps
* turbines
* heat exchangers
* maintenance logs
* telemetry
* alerts
* operational anomalies

This is NOT generic CRUD software.

Operational realism matters.

---

# MongoDB Collections

## assets

Stores equipment metadata.

Example:
{
"asset_id": "248K001B",
"type": "compressor",
"unit": "Unit-3",
"status": "running",
"health": "warning"
}

## alerts

Stores operational alerts/anomalies.

Example:
{
"asset_id": "248K001B",
"alert_type": "high_vibration",
"severity": "critical",
"value": 9.3,
"timestamp": "2026-05-14T10:30:00"
}

## sensor_readings

Stores telemetry.

Example:
{
"asset_id": "248K001B",
"temperature": 92,
"vibration": 8.7,
"pressure": 44
}

## maintenance_logs

Stores maintenance history.

Example:
{
"asset_id": "248K001B",
"issue": "bearing wear",
"action": "bearing replaced"
}

---

# MCP-Style Tool Philosophy

The AI model must NEVER generate arbitrary MongoDB queries.

All database access must happen through explicit backend tools.

Example tools:

* getCriticalAlerts
* getAssetStatus
* getMaintenanceHistory
* getHighVibrationAssets

Tools must:

* be explicit
* be safe
* have clear schemas
* expose only required capabilities

Avoid raw query execution endpoints.

---

# Project Structure

Use this structure consistently.

src/
├── routes/
├── controllers/
├── services/
├── tools/
├── models/
├── prompts/
├── config/
├── utils/
└── server/

scripts/
└── seed-data.ts

Keep business logic separated cleanly.

---

# Backend Responsibilities

The backend is responsible for:

* API routes
* orchestration
* OpenAI/Gemini integration
* tool execution
* MongoDB access
* validation
* error handling
* logging

The backend is NOT responsible for:

* AI reasoning
* ML training
* local inference
* deep analytics

---

# AI Responsibilities

The AI model is responsible for:

* understanding user intent
* selecting tools
* extracting parameters
* generating summaries

The AI model is NOT responsible for:

* direct database access
* application state
* business validation
* permissions

---

# Coding Standards

Use:

* TypeScript
* async/await
* modular services
* explicit typing
* clear naming

Prefer:

* readable architecture
* small functions
* explicit responsibilities
* maintainable abstractions

Avoid:

* unnecessary abstractions
* premature optimization
* deeply nested logic
* magic values
* hidden side effects

---

# Error Handling

Prefer:

* failing loudly
* explicit validation
* meaningful logs

Do not silently swallow errors.

---

# MongoDB Guidelines

Use:

* clear collection naming
* indexed operational fields
* realistic schemas

Do not:

* store unrelated structures together
* create overly generic documents
* expose Mongo directly to AI

---

# Data Generation Strategy

Use synthetic operational data.

Generate realistic:

* telemetry
* alerts
* anomalies
* maintenance histories

Use programmatic seed scripts.

Do not manually insert large datasets.

---

# Tool Development Rules

Every tool must:

1. have a single responsibility
2. have typed inputs
3. validate parameters
4. return structured outputs
5. avoid hidden behavior

Prefer predictable tools over overly flexible tools.

---

# AI Tool Calling Flow

Expected flow:

User query
→ AI reasoning
→ tool selection
→ backend tool execution
→ MongoDB query
→ results
→ AI summarization
→ final response

Maintain this architecture consistently.

---

# Future Expansion Areas

Future phases may include:

* real MCP servers
* local LLM hosting
* RAG
* telemetry streaming
* predictive analytics
* operational dashboards

However:
DO NOT prematurely implement future architecture in MVP.

---

# Important Engineering Philosophy

This repository prioritizes:

* architectural clarity
* learning systems design
* understanding orchestration
* understanding MCP concepts

Do not optimize only for fast code generation.

Code should remain understandable to humans first.

The user values learning and architectural understanding more than rapid implementation.

---

# Commands

## Install dependencies

npm install

## Start development server

npm run dev

## Run TypeScript build

npm run build

## Seed MongoDB

npm run seed

---

# Agent Behavior Expectations

Before generating code:

* understand existing architecture
* preserve project structure
* avoid introducing unnecessary frameworks
* keep implementations incremental
* explain important architectural decisions clearly

When uncertain:
prefer simpler architecture.

Avoid overengineering.
