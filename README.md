# Dastyar

Dastyar is a customized LibreChat fork that delivers a full-stack AI chat platform with multi-provider models, RAG over pgvector, Meilisearch search, flexible auth, and a configurable UI.

## Highlights
- Multi-provider AI: OpenAI/Assistants, Anthropic, Google Gemini/Vertex, AWS Bedrock, and custom endpoints via `librechat.yaml` (AvalAI included).
- Auth: local, LDAP, OIDC/SAML, and social (GitHub, Google, Discord, Facebook, Apple, etc.) with JWT/Passport.
- Product features: conversations, presets/prompts, tags, share links, roles/banners, user memories, optional agents/plugins, file/image upload with pluggable storage (local/S3/Firebase/Azure).
- Search/RAG: Meilisearch for text search; optional `rag_api` backed by PostgreSQL + pgvector for retrieval.
- Frontend: React 18 + Vite + TailwindCSS with Radix UI/Ariakit components, i18n, and PWA support.
- Ops: Docker/Compose, Helm charts, config scripts for users/balance/migrations, Jest unit tests, and Playwright E2E.

## Stack and Layout
- Backend: Node.js 20, Express, Passport, Mongoose, Redis (optional), LangChain/MCP services.
- Data: MongoDB, Meilisearch, PostgreSQL + pgvector (RAG), optional Redis cache/session.
- Frontend: `client/` (Vite app), shared packages in `packages/` (`api`, `data-provider`, `data-schemas`, `client` component library).
- Server code lives in `api/` (server, routes, models, strategies, scripts); ops utilities in `config/`; E2E configs in `e2e/`; deployment charts in `helm/`.

## Quickstart (local)
1) Copy environment file:
```bash
cp .env.example .env
# set secrets (JWT), database URLs, AI keys, RAG settings as needed
```
2) Install dependencies:
```bash
npm ci
```
3) Run in development (two terminals):
```bash
npm run backend:dev    # Express on PORT (default 3080)
npm run frontend:dev   # Vite dev server
```
4) Production-style local run:
```bash
npm run frontend   # builds packages + UI
npm run backend    # serves built assets
```

## Docker Compose
1) Build the image (Compose expects `dastyar`):
```bash
docker build -t dastyar .
```
2) Bring up the full stack (API + Mongo + Meili + pgvector + rag_api):
```bash
docker compose up -d
```
Services: `api` (PORT, default 3080), `mongodb` (`./data-node`), `meilisearch` (`./meili_data_v1.12`), `vectordb` (pgvector, volume `pgdata2`), `rag_api` (RAG_PORT, default 8000). `.env` and `librechat.yaml` are bind-mounted; adjust or override via `docker-compose.override.yml`.

RAG-only stack:
```bash
docker compose -f rag.yml up -d
```

Persistent paths: `./uploads`, `./logs`, `./data-node`, `./meili_data_v1.12`, Docker volume `pgdata2`.

## Configuration
- `.env`: primary runtime settings. Key entries: `HOST`/`PORT`, `DOMAIN_CLIENT`/`DOMAIN_SERVER`, `MONGO_URI`, `MEILI_HOST`/`MEILI_MASTER_KEY`, `RAG_PORT`/`RAG_API_URL`/`RAG_OPENAI_*`, `EMBEDDINGS_PROVIDER`, auth secrets (`JWT_*`), provider keys (OpenAI/Anthropic/Google/Bedrock/etc.), email (`EMAIL_*`), storage (`AWS_*`, `AZURE_STORAGE_*`, `FIREBASE_*`), and toggles like `SEARCH`, `ALLOW_SOCIAL_LOGIN`, `CONFIG_PATH`. See `.env.example` for the full list.
- `librechat.yaml`: UI/model/file-limit configuration. Includes welcome copy, privacy/TOS links, feature toggles, and a sample custom endpoint (`Dastyar` -> AvalAI). Mount or override this file in containerized deployments when customizing.

## Scripts and Testing
- Backend: `npm run backend` (prod) / `npm run backend:dev` (watch).
- Frontend: `npm run frontend` (build packages + UI) / `npm run frontend:dev`.
- Packages: `npm run build:packages` (builds all shared packages).
- Tests: `npm run test:api`, `npm run test:client`; E2E `npm run e2e` or `npm run e2e:headed`.
- Lint/format: `npm run lint`, `npm run format`.
- Maintenance: `config/*` scripts for user management, balances, migrations, Meili sync, and upgrades.

## Deployment Notes
- Set `DOMAIN_CLIENT` / `DOMAIN_SERVER` to your public URLs and configure `TRUST_PROXY` when behind a reverse proxy.
- Provide strong secrets for JWT and third-party providers; disable verbose debugging in production.
- Persist volumes for `uploads`, `logs`, `data-node`, `meili_data_v1.12`, and `pgdata2`.
- Use `docker-compose.override.yml` or `helm/` for environment-specific overrides; `client/nginx.conf` can guide reverse-proxy setup.

## Project Status
- Default RAG and pgvector credentials in Compose are for local development only; replace them before deploying.
- A `.env` file is present locally—ensure it stays out of version control and CI artifacts.
