# ai-financial-support-platform

Production-oriented full-stack AI support platform for financial operations. It combines RAG-powered chat, admin observability, and a closed feedback loop to continuously improve answer quality.

## Overview

This system delivers grounded AI assistance using internal knowledge sources (documents, URLs, manual text) and operational controls for reliability in real workflows.

### What it does
- Answers user questions with RAG (retrieval + context-aware generation)
- Stores and detects unresolved responses for continuous improvement
- Lets admins ingest and curate knowledge sources
- Provides admin metrics, unresolved queue, and conversation visibility
- Secures access with JWT auth and Google OAuth
- Applies Redis caching and rate limiting for resilience

## Key Features

- **RAG Pipeline**: embeddings + vector retrieval (`pgvector`) + prompt construction
- **Feedback Loop**: unresolved detection -> admin resolution -> re-ingestion
- **Admin Control Plane**: metrics, unresolved management, knowledge operations
- **Multi-Provider AI**: Gemini/OpenAI/Groq support with fallback strategy
- **Production-Oriented Ops**: structured logs, request IDs, caching, rate limits

## Architecture

```text
React + Vite (frontend)
    |
    | HTTP/JWT
    v
FastAPI (backend)
    |-- Auth + OAuth
    |-- ChatService (RAG orchestration)
    |-- Admin/Knowledge workflows
    |
    +--> PostgreSQL + pgvector (knowledge + logs + unresolved)
    +--> Redis (cache + rate limiting)
    +--> LLM/Embedding providers (Gemini/OpenAI/Groq)
```

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy (async), PostgreSQL, pgvector, Redis
- **Frontend**: React (Vite), TypeScript, Zustand, React Query, RHF + Zod
- **AI**: RAG, embeddings, multi-provider LLM integration
- **Ops**: Docker Compose, structured logging, health checks, rate limiting

## Run Locally (Docker Compose)

### 1) Clone

```bash
git clone <your-repo-url>
cd ai-financial-support-platform
```

### 2) Create environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

On Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

### 3) Start all services

```bash
docker-compose up --build
```

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **OpenAPI Docs**: http://localhost:8000/docs

## API Quick Test (`/chat`)

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "session_id": "demo-session",
    "user_id": "demo-user",
    "message": "What are the requirements for opening a checking account?",
    "channel": "web",
    "locale": "en-US",
    "metadata": {}
  }'
```

Example response:

```json
{
  "conversation_id": "123",
  "answer": "To open a checking account, you typically need...",
  "sources": [
    {
      "source_ref": "knowledge/doc-42",
      "score": 0.87
    }
  ],
  "warnings": [],
  "latency_ms": 412
}
```

## Why This Project Is Relevant

This project demonstrates practical skills expected in AI/backend-focused roles:

- End-to-end system design across frontend, backend, data, and AI layers
- Real-world RAG implementation with observability and feedback loops
- Operational engineering (rate limiting, caching, logging, Dockerized DX)
- Secure auth architecture with JWT lifecycle and OAuth integration
- Maintainable, typed frontend and API contracts for scalable collaboration

## Demo and Screenshots

- Add architecture screenshot: `docs/screenshots/architecture.png`
- Add admin dashboard screenshot: `docs/screenshots/admin-dashboard.png`
- Add chat UI screenshot: `docs/screenshots/chat-ui.png`

## Notes

- Keep real credentials out of version control.
- `docs/` and `bd/` are excluded from GitHub publication by `.gitignore` per project publication rules.
