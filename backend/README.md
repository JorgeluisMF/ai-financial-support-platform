# AI Agent Backend

FastAPI backend for the Financial Customer Support Agent.

## Tech Stack

- Python 3.12+
- FastAPI
- SQLAlchemy + asyncpg (PostgreSQL)
- Redis
- Provider integrations (Gemini, OpenAI, Groq)

## Project Structure

- `app/main.py`: app factory, middleware, and router mounting.
- `app/api/routers/`: API endpoints (`/auth`, `/health`, `/chat`, `/admin`, `/knowledge`).
- `tests/`: API contract and backend tests.
- `.env.example`: environment template.

## Prerequisites

- Python 3.12+
- PostgreSQL
- Redis
- `uv` installed (`pip install uv`) or standard Python virtualenv tooling

## Quick Start

1. Create and activate environment:

   - Windows PowerShell:
     - `python -m venv .venv`
     - `.venv\Scripts\Activate.ps1`

2. Install dependencies:

   - With `uv`:
     - `uv sync`
   - Or with pip:
     - `pip install -e .`

3. Configure environment variables:

   - Copy `.env.example` to `.env`
   - Fill real credentials (API keys, JWT secret, DB/Redis URLs)

4. Run the API:

   - `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`

5. Open docs:

   - Swagger UI: `http://127.0.0.1:8000/docs`

## Available Routes

- `GET /health/*`
- `POST /auth/*`
- `POST /chat/*`
- `GET/POST/DELETE /admin/*`
- `GET/POST/DELETE /knowledge/*`

## Running Tests

- `pytest`

## Notes for GitHub

- Never commit real secrets in `.env`.
- Keep `uv.lock` committed to preserve reproducible installs.
