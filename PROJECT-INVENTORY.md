# PROJECT-INVENTORY — Security Edition

Project Inventory & Architecture Overview

Workspace Snapshot
| Area | Highlights |
| --- | --- |
| `api/` | Contains the Express/Mongoose backend: `api/server/index.js:78` wires health/health-check, middleware, passport, and route mount points defined in `api/server/routes/index.js:1`. Core controllers (e.g., `api/server/controllers/AuthController.js:1`, `api/server/controllers/UserController.js:1`) and services (`api/server/services/ActionService.js:1`, `api/server/services/PermissionService.js:1`, `api/server/services/MCP.js:1`) live here. |
| `client/` | Vite/React SPA: `client/src/main.jsx:2` bootstraps the DOM root and `<App />`, while `client/src/App.jsx:40` stacks the `QueryClient`, `RecoilRoot`, drag-and-drop, toast, theme, and router providers. Page routing is solved via `client/src/routes/index.tsx:1`, with the conversation view driven by `client/src/routes/ChatRoute.tsx:1` and `ChatView` under `client/src/components/Chat/ChatView.tsx:1`. |
| `packages/` | Shared libs for the monorepo. `packages/data-provider/src/request.ts:16` defines the Axios helpers (JSON/multipart/refresh logic) consumed by both client hooks (`client/src/data-provider/*`) and backend tests, while `packages/data-schemas/src/index.ts:1` exports the Mongoose schema factory used in `api/db/models.js`. `packages/client` collects reusable UI primitives (data kept in `packages/client/src`). |
| `config/` | CLI helpers for user/admin workflows (`config/update.js`, `config/create-user.js`, etc.), plus translation helpers, control the deployment lifecycle, and are referenced via root npm scripts. |
| Deployment manifests | `docker-compose.yml:4` spins up `api`, `mongodb`, `meilisearch`, `rag_api`, and storage mounts for uploads/logs, while `librechat.yaml` and `helm/` folders map Helm/K8s overlays and chart metadata for cloud deployment. |
| Support & infrastructure | `logs/`, `uploads/`, and `data-node/` (Mongo data) are persistent mounts used by the compose setup; `.github/`, `.devcontainer/`, `.husky/`, and `e2e/` hold automation, Git hooks, and end-to-end tests. |

Backend Landscape

Core server setup
`api/server/index.js` configures the Express app (`/health` at `api/server/index.js:78`), JSON parsing, Mongo sanitization (`api/server/index.js:84`), static caching, compression guard rails, and social/LDAP passsword strategies (`api/server/index.js:103`). It mounts every feature router (e.g., `/api/auth`, `/api/messages`, `/api/convos`, etc.) before falling back to the SPA index.

Routes & controllers
| Route group | Controller(s) | Supporting services/middleware | Notes |
| --- | --- | --- | --- |
| Authentication & users (`/api/auth`, `/api/user`, `/api/roles`) | `AuthController` + `UserController` (`api/server/controllers/AuthController.js:1`, `api/server/controllers/UserController.js:1`) | `AuthService`, `TwoFactorService`, passport strategies (`api/strategies/*.js`) with JWT/LDAP via `requireJwtAuth` (`api/server/middleware/requireJwtAuth.js:1`). | Handles login/refresh, MFA, registration, logout, invitations, and role enforcement. |
| Messaging (`/api/messages`) | Inline handlers in `api/server/routes/messages.js:1` | Conversation/message helpers from `~/models`, artifact tooling, and validation (`api/server/middleware/validateMessageReq.js:1`) | Supports cursored queries, artifact edits, token recomputation, feedback, and deletions with Meili-backed search when `search` query is present. |
| Conversations, prompts, categories (`/api/convos`, `/api/prompts`, `/api/categories`) | `Prompt`/`Conversation` route files | Services such as `PromptService`, `ConfigService`, `PermissionService`, and `Meili` sync; also uses `validateConvoAccess` middleware for scoped reads/writes (`api/server/middleware/validate/convoAccess.js`). |
| Assistants/MCP/Agents (`/api/agents`, `/api/assistants`, `/api/mcp`) | `AssistantService`, `MCP` routes (`api/server/services/AssistantService.js:1`, `api/server/services/MCP.js:1`) | Plugins/tools orchestrated via `ToolService`, `ActionService`, and `GraphApiService`, with OAuth/social login loaders (`api/server/services/initializeOAuthReconnectManager.js:1`). Enables multi-step assistants, tool calls, and referral flows. |
| Files/plugins/support (`/api/files`, `/api/plugins`, `/api/support`, `/api/balance`) | `FileController`, `PluginController` (`api/server/controllers/PluginController.js:1`) | `Files` services handle uploads (multer/sharp), plugin metadata, and support tickets; integrates Redis/Keyv caching, rate limiters (e.g., `api/server/middleware/limiters/loginLimiter.js:1`), and JWT guards. |

Services & middleware
- **Services**: `ActionService` (`api/server/services/ActionService.js:1`) manages background tool/external API calls; `PermissionService` enforces UI/agent permissions; `GraphApiService` handles Microsoft Graph tokens; `ToolService` mediates plugins; `initializeMCPs`/`initializeOAuthReconnectManager` start long-running flows tied to agents.
- **Middleware**: Authentication via `requireJwtAuth` (`api/server/middleware/requireJwtAuth.js:1`), request validation with `validateMessageReq` (`api/server/middleware/validateMessageReq.js:1`), and ban/domain checks. Rate limiting is enforced by the limiter modules (e.g., `api/server/middleware/limiters/loginLimiter.js:1`), while `abortMiddleware` and `abortRun` protect streaming flows.

Data models & persistence
- Mongo models are constructed by `packages/data-schemas/src/index.ts:1` and wired through `api/db/models.js`.
- `connectDb` (`api/db/connect.js:43`) centralizes connection pooling with env-driven options.
- `indexSync` (`api/db/indexSync.js:2`) keeps Meilisearch in sync for conversation/message documents and exposes cleanup routines.
- Additional storage includes Redis (via `connect-redis`/`memorystore` pulls), local uploads, and `cache/` helpers for in‑memory rate-limit tracking.

Frontend Landscape

Entry & routing
- **Boot**: `client/src/main.jsx:2` creates the React root and renders `<App />`.
- **Layout**: `client/src/App.jsx:40` wraps the tree with `QueryClientProvider`, `RecoilRoot`, theming, drag‑and‑drop, toast, and router context.
- **Routing**: `client/src/routes/index.tsx:1` defines the browser router, authentication layout (login/registration/2FA), dashboard paths, `/c/:conversationId`, `/search`, and `/agents`.
- **Chat Route**: `client/src/routes/ChatRoute.tsx:1` wires startup config, model/endpoint queries, conversation initialization, and renders `ChatView`.

Key pages & components
- `/c/:conversationId` uses `ChatView` (`client/src/components/Chat/ChatView.tsx:1`) plus nested components for messages, input, tool panels, sidebars, and artifacts.
- Dashboard/prompt management lives under `client/src/components/Prompts` with forms/editors; share, agents, support, files, plugins, and MCP panels each have dedicated directories under `client/src/components`.
- Shared UI primitives, icons, and helpers are stored in `client/src/components/ui` and `~/common` (type maps, selectors, etc.).

State & data management
- Recoil atoms (e.g., `client/src/store/prompts.ts:2`) capture filters, editor mode, UI state, and localStorage-backed preferences via `atomWithLocalStorage` (`client/src/store/utils.ts:1`).
- `safeStorage` (`client/src/utils/safeStorage.ts:1`) guards localStorage writes/remove to avoid quota errors and supports versioned migrations (called in `client/src/App.jsx` via `installStorageGuards`).
- Provider contexts (e.g., `client/src/Providers/ChatContext.tsx:1`) expose hooks to chat helpers, agents, artifacts, prompts, search, and bookmarks.

Data providers & networking
- `client/src/data-provider/*` re-exports React Query hooks backed by the shared `librechat-data-provider` package; `client/src/data-provider/connection.ts:1` orchestrates health checks and interaction-triggered invalidations.
- `packages/data-provider/src/request.ts:16` defines Axios helpers with JSON/multipart wrappers, fallback TTS uploads, and an interceptor that auto-refreshes tokens (`packages/data-provider/src/request.ts:87`) via the `/api/auth/refresh` flow.
- Queries/mutations (`client/src/data-provider/queries.ts`, `mutations.ts`, `messages.ts`, etc.) hit `/api/*` endpoints with proper headers and cache keys, while `librechat-data-provider` types ensure consistent payload shapes across front/back.

Utilities & environment
- Theme/font initialization and toast/announce utilities live in `client/src/hooks` and `client/src/utils`.
- Static assets under `client/public` (served via `api/server/staticCache`), plus `scripts/` and `mobile.css` support legacy entry points.

Data Flow

```mermaid
graph LR
  UI[React Router + ChatView<br/>(client/src/routes/ChatRoute.tsx:1)] --> Queries[React Query Hooks<br/>(client/src/data-provider/queries.ts)]
  Queries --> Axios["Axios wrapper<br/>(packages/data-provider/src/request.ts:16)"]
  Axios --> Express["Express routes<br/>(api/server/routes/index.js:1)"]
  Express --> Controllers["Controllers & inline handlers<br/>(api/server/routes/messages.js:1)"]
  Controllers --> Services["Services (Action / MCP / File / Auth)<br/>(api/server/services/*.js)"]
  Services --> Models["Mongoose models<br/>(api/models/*.js)"]
  Models --> Mongo[MongoDB via connectDb<br/>(api/db/connect.js:43)]
  Models --> Meili[Meilisearch sync<br/>(api/db/indexSync.js:2)]
  Services --> Cache[Redis / Keyv caches]
```

The UI state (Recoil + contexts) drives `librechat-data-provider` queries going through the Axios interceptor (`packages/data-provider/src/request.ts:87`). Express applies sanitizers, passport, and JWT guards before invoking services, which in turn update Mongo models or trigger MCP/tool runs with Meilisearch sync.

Dependencies & Security Notes
| Dependency | Scope | Security relevance & safeguards |
| --- | --- | --- |
| `express`, `passport`, `express-mongo-sanitize`, `express-rate-limit` (`api/package.json:36`, `api/package.json:68`, `api/package.json:69`) | Server | Sanitization + rate-limit middleware (`api/server/index.js:84`, `api/server/middleware/limiters/loginLimiter.js:1`) defend against injection/DDoS, while `passport` strategies allow JWT/LDAP/social login (`api/server/middleware/requireJwtAuth.js:1`). |
| `mongoose`, `@librechat/data-schemas`, `MeiliSearch` (`api/package.json:91`, `packages/data-schemas/src/index.ts:1`) | Persistence | Typed models + `connectDb` pooling (`api/db/connect.js:43`) plus `indexSync` (`api/db/indexSync.js:2`) ensure structured storage and searchable consumption. |
| `axios`/`librechat-data-provider` (`packages/data-provider/src/request.ts:16`) | Shared API client | Axios interceptors refresh tokens on 401, emit events, and centralize JSON/multipart handling (`packages/data-provider/src/request.ts:87`). |
| `@tanstack/react-query`, `recoil`, `react-router-dom` (`client/package.json:60`, `client/package.json:97`, `client/package.json:102`) | Frontend | Query caching + Recoil atoms allow optimistic UI updates while router guards keep auth flows centralized. |
| `safeStorage`, `atomWithLocalStorage`, `localStorage guards` (`client/src/utils/safeStorage.ts:1`, `client/src/store/utils.ts:1`) | Client persistence | Limits large payloads, automatically resets stale keys, and avoids quota errors across browsers. |

Architectural Overview
LibreChat is a monorepo with backend (`api/`), frontend (`client/`), and shared packages (`packages/{api,client,data-provider,data-schemas}`). The backend exposes Express routes that delegate to service layers, while the frontend relies on React Router, Recoil, and React Query for navigation, state, and side effects (`client/src/App.jsx:40`). Shared `librechat-data-provider` hooks the frontend to `/api/*` endpoints, keeping request/response typings consistent across both realms. Deployments rely on Docker Compose (`docker-compose.yml:4`) and Helm overlays for production, with local `config/` scripts supporting admin tasks.

Next Steps
- Keep this inventory in sync whenever new routes/services/components are added or the dependency matrix changes (particularly around security-critical packages).
- Consider documenting any new MCC/agent pipelines in the same format so cross‑team contributors can map controllers → services → models at a glance.
- Verify diagrams after significant refactors (e.g., API surface changes, new state partitions) to ensure the data-flow narrative still matches runtime behavior.

---
## Security Edition Addendum

### Route-Level Security Mapping

The backend exposes the route surface mounted in `api/server/index.js`. Each of the following rows summarizes the HTTP methods, required authentication/authorization, active middleware, accepted inputs, outputs, and key OWASP risks for later audit reference.

| Route | Method(s) | Auth | Middleware | Inputs | Output | Risk Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/auth` | `POST /login`, `/POST /refresh`, `/POST /logout`, `/GET /me` | Public for login/refresh, JWT for /me, optional 2FA enforcement | `express.json`, `express-mongo-sanitize`, rate limiters such as `loginLimiter`, passport JWT/2FA strategies | body: `email`, `password`, `code`, refresh token cookies | JWT response, refresh token set via cookies | Brute force, enumeration, insufficient rate limiting on shared login paths |
| `/api/actions` | `POST` | JWT | `requireJwtAuth`, payload validators, rate limiters | action definition (assistant, inputs) | action execution result | Injection via unvalidated tool inputs, replay if no nonce, large payloads |
| `/api/keys` | `GET`, `POST`, `DELETE` | JWT (admin-like) | `requireJwtAuth`, permissions middleware | key metadata, query parameters | API key list or creation result | Persistence of plaintext keys, improper filtering of user scope |
| `/api/user` | `GET`, `PATCH` | JWT | `requireJwtAuth`, `validateConvoAccess` for nested | profile fields, patch body | user profile | Mass assignment if body not whitelisted |
| `/api/search` | `GET` | JWT | `requireJwtAuth`, `meiliSearch` sanitization | query string `q`, pagination cursor | search results | Injection via search terms if not sanitized, enumeration of indexed data |
| `/api/edit` | `POST` | JWT | `requireJwtAuth`, input sanitizers | conversation edits, prompt IDs | update confirmation | High risk from arbitrary text updates |
| `/api/messages` | `GET`, `POST`, `PUT`, `DELETE` | JWT | `requireJwtAuth`, `validateMessageReq`, `validateMessageReq`, `express-mongo-sanitize`, rate limiters | query params (conversationId, messageId, cursor), body message struct | message payloads, cursor | Conversation enumeration if IDs guessed; missing rate limits on fetch |
| `/api/convos` | `GET`, `POST`, `PUT`, `DELETE` | JWT | `requireJwtAuth`, `validateConvoAccess`, `countTokens`, `express-mongo-sanitize` | conversation metadata, prompts | convo list/details | Incomplete access checks if conversationId not validated |
| `/api/presets` | `GET`, `POST`, `PUT`, `DELETE` | JWT | `requireJwtAuth` | preset payloads | preset list | Stored XSS in metadata |
| `/api/prompts` | `GET`, `POST`, `PUT`, `DELETE` | JWT | `requireJwtAuth`, `moderateText`, `express-mongo-sanitize` | prompt text, category | prompt list | Prompt manipulation and injection |
| `/api/categories` | `GET` | JWT | `requireJwtAuth` | none | categories array | Unauthorized exposure if categories linked to other users |
| `/api/tokenizer` | `POST` | JWT | `requireJwtAuth` | text | token counts | abuse of tokenizer to measure secret payloads |
| `/api/endpoints` | `GET`, `POST` | JWT | `requireJwtAuth`, `validateEndpoint` | endpoint config, model specs | endpoint list | Misconfigured endpoints enabling unauthorized provider access |
| `/api/balance` | `GET`, `POST` | JWT | `requireJwtAuth`, `requireLdapAuth` (if configured) | balance adjustments | balance info | Integer overflow or manipulation if role checks absent |
| `/api/models` | `GET` | JWT | `requireJwtAuth` | filters | model metadata | Attackers learning available models |
| `/api/plugins` | `GET`, `POST`, `PUT`, `DELETE` | JWT | `requireJwtAuth`, `validate` middleware | plugin metadata | plugin status | Server-side template injection via plugin callbacks |
| `/api/config` | `GET`, `PATCH` | JWT (admin roles) | `requireJwtAuth`, `checkDomainAllowed`, `checkBan` | config settings | configuration document | Configuration leakage if not scoped |
| `/api/assistants` | `GET`, `POST`, `PATCH`, `DELETE` | JWT | `requireJwtAuth`, `ActionService` | assistant definition | assistant metadata | User-supplied automation may trigger SSRF |
| `/api/agents` | `GET`, `POST` | JWT | `requireJwtAuth`, `ToolService` | agent payload | agent summary | Data exfiltration through agent responses |
| `/api/referrals` | `POST` | JWT | `requireJwtAuth` | referral codes | referral status | Replay/referral abuse |
| `/api/support` | `POST`, `GET` | JWT | `requireJwtAuth` | ticket content | support ticket record | Stored sensitive user data |
| `/api/files` | `POST` (uploads), `GET` (list/download) | JWT | `requireJwtAuth`, `multer`, `validateImageRequest` | multipart/formdata | file metadata or download | Path traversal, MIME spoofing, missing virus scan |
| `/api/share` | `GET` | share token schema | cookie/passport optional | shareId | shared conversation | Token leakage and replayable share links |
| `/api/roles` | `GET`, `PATCH` | JWT (admin) | `requireJwtAuth`, role checks | role payloads | role assignments | Over-privileging if roles not validated |
| `/api/banner` | `GET`, `PATCH`, `DELETE` | JWT | `requireJwtAuth` | banner text | banner details | Stored XSS if HTML not sanitized |
| `/api/memories` | `GET`, `POST`, `DELETE` | JWT | `requireJwtAuth`, `validate` | memory payloads | memory records | Sensitive data retained without TTL |
| `/api/permissions` | `GET`, `PATCH` | JWT | `requireJwtAuth`, `PermissionService` | permission matrix | permissions list | Elevation of privilege |
| `/api/tags` | `GET`, `POST`, `DELETE` | JWT | `requireJwtAuth` | tag metadata | tag list | Tag-based user tracking |
| `/api/mcp` | `GET`, `POST` | JWT | `requireJwtAuth`, `MCP Service` | model-control payloads | run status | Abuse through tool chaining |
| `/oauth/*` | `GET` | Public | `passport` strategies, `oauth` route | provider parameters | redirect or token | Redirect URI abuse, open redirect risk |
| `/images/*` | `GET` | None | `validateImageRequest`, caching | image params | binary asset | Cache poisoning, ACL bypass on signed URLs |

### Validation Coverage Analysis

- **Strong validation with schemas**: `/api/messages` uses `validateMessageReq.js:1` to verify conversations belong to the caller (`User → Conversation`), `/api/auth` enforces credential shape via passport validators, `/api/prompts`/`/api/categories` sanitize text via `moderateText` middleware, `/api/files` enforces `validateImageRequest` plus `multer` limits.
- **Partial validation**: `/api/actions`, `/api/convos`, `/api/assistants`, and `/api/mcp` accept complex JSON payloads (tool flows, agent specs) but rely on service-level helpers; missing explicit schemas means nested fields (e.g., tool call arguments, receiver IDs) currently bypass structure checks, raising OWASP A5/A3/A8 risks.
- **No validation**: Some admin paths (`/api/banner`, `/api/referrals`, `/api/roles`) lack formal validation schemas beyond basic passport guards; this leaves stored XSS and mass assignment exposures. `/api/search` relies on raw query strings; Meili sanitization is implicit but not schema-enforced, so `cursor`/`sort` parameters may be tampered with.
- **Missing schema definitions**: There is no `zod`/`Joi` schema referenced for `/api/share`, `/api/support`, or `/api/plugins`, which accept HTML/text without sanitization and may leak internal data (OWASP A1).
- **Unvalidated fields**: Multipart uploads accept filenames without normalization; `agent`/`assistant` `config` sections accept arbitrary objects.
- **Recommended fixes**:
  - Introduce explicit validation middlewares (Zod/Joi) for endpoints with nested payloads, ensuring all user-controlled fields have defined types and constraints.
  - Expand existing moderateText checks to cover plugin/agent descriptions to mitigate stored XSS (OWASP A1).
  - Reject requests lacking required fields early in shared middleware to guard enumeration/replay vectors.

### Authentication & Session Flow

- **Login flow**: `/api/auth/login` uses `passport-local` or social strategies and issues JWTs plus refresh tokens stored in secure cookies. Rate limiters (e.g., `loginLimiter`) throttle repeated attempts.
- **Token issuance**: Tokens are created via `jwtStrategy`(/`Passport`) and include `userId` claims. `refreshToken` route issues new tokens when presented with a valid refresh cookie; the frontend Axios interceptor (`packages/data-provider/src/request.ts:87`) transparently refreshes access tokens upon 401.
- **Token expiration**: Access tokens expire per JWT settings; refresh tokens use long-lived cookies but routed through `refreshToken` endpoint for rotation. Specific expiration is configured via env variables (not enumerated here).
- **Rotation/refresh**: Axios interceptor queues failing requests and replays after refresh; the backend rotates the token by returning a new JWT in the response body and setting cookies as needed, reducing replay windows.
- **CSRF behavior**: API is designed as SPA with JWT in Authorization header and refresh tokens in httpOnly cookies. CSRF risk is limited to refresh endpoints (they accept cookies) and should be mitigated by verifying SameSite=lax/strict on refresh cookies; explicit CSRF tokens are absent.
- **Logout logic**: `/api/auth/logout` clears tokens via `passport` and, if configured, invalidates refresh tokens via stored sessions/cookies. There is no server-side revocation list, so leaked tokens remain valid until expiration.
- **Security assumptions**: JWTs live in memory/localStorage via `setTokenHeader`, while refresh tokens stay in httpOnly cookies (`librechat-data-provider`). Assumes TLS, host header validation, and sanitized token providers.
- **Weak points**:
  - Access/jwt tokens stored in localStorage may be exfiltrated via XSS.
  - No transparent token revocation after logout (OWASP A2).
  - Refresh endpoint accessible via cookies is vulnerable to CSRF if SameSite not enforced.
  - Social login reuse via `OPENID_REUSE_TOKENS` adds complexity and might skip refresh token validation.

### Error Handling Behavior

- **Centralized handlers**: `ErrorController` (`api/server/index.js:146`) standardizes error responses; uncaught exceptions are caught at the process level to log sensitive stacks but often return `500` with sanitized messages.
- **Stack trace leakage**: Logger warnings reference stack traces (e.g., Google/agents) but responses omit stacks. However, `logger.error` calls inside routes may occasionally propagate `err.message` directly into JSON, risking enumeration (particularly `/api/messages` and `/api/files`).
- **Unhandled promise rejections**: `process.on('uncaughtException')` covers synchronous errors; unhandled promise rejections should bubble to Express error handler, but some async `catch` blocks (especially inside streaming tool operations) log and ignore errors, hindering visibility.
- **Error response exposure**: Some controllers return `error: 'Internal server error'`, but others propagate sanitized messages (e.g., `res.status(404).json({ error: 'Conversation not found' })`). No stack data is returned, so risk level is medium if thrown errors are sanitized.
- **Best-practice fixes**:
  - Ensure all controllers catch service rejections and pass them through `next(err)` to the centralized handler.
  - Avoid returning raw `err.message` unless sanitized; replace with telemetry-friendly IDs.
  - Implement `Helmet`-style headers to prevent leak via `X-Powered-By` (already disabled) and include `X-Content-Type-Options`.

### File Upload / Download Security

- **Upload endpoint**: `/api/files` is guarded by JWT, `multer` middleware, and `validateImageRequest`. Uploads are stored under `uploads/` and configured with `initializeFileStorage`.
- **MIME checks**: `validateImageRequest` ensures allowed image types and prevents extension spoofing; `multer` restricts file types through `fileFilter` (implied).
- **Size limits**: `express.json` and upload middleware cap request sizes (~3MB) and `multer` enforces file size constraints.
- **Virus scanning**: None visible; consider integrating antivirus on upload pipeline.
- **Path traversal**: Filenames normalized by storage helper; downloads go through `staticCache` with sanitized paths to prevent directory escape.
- **Public access**: `/images/*` exposes cached assets; signed URLs are generated with `createValidateImageRequest`, but shared links can leak if tokens not rotated.
- **Temp file behavior**: `uploads/` is a persistent volume; files are not auto-deleted, so metadata retention must be audited.
- **Persistent serving risks**: Uploaded files served via `/images/`, so sanitize metadata and disable execution to prevent malicious payloads.

### CORS, Security Headers, and Server Configuration

- **CORS**: `cors()` is applied globally with default policy (allows all origins). No origin whitelist is configured, so cross-site access is fully open, relying on token auth for protection—this exposes the API to CSRF-like requests.
- **Credentials**: Cookies used for refresh tokens rely on custom logic but CORS allows credentials; best practice would be `cors({ origin: CLIENT_URL, credentials: true })`.
- **Missing headers**: No explicit CSP/HSTS/Referrer-Policy/X-Frame-Options headers are added server-side. Static assets served via `express-static-gzip` may inherit headers from reverse proxy (Nginx/Traefik) defined in `client/nginx.conf` or `docker-compose` environment.
- **Proxy behavior**: Compose service trusts `trust proxy` (default 1). If deployed behind Traefik/Nginx, ensure `X-Forwarded-Proto` and host headers are validated to avoid redirect loops.
- **Risk assessment**: Open CORS is medium-high risk. Adding `helmet()` or custom headers and restricting allowed origins would reduce exposure.

### Secrets & Environment Variables

- **Required env vars**: `MONGO_URI`, `MEILI_HOST`, `MEILI_MASTER_KEY`, `PORT`, `HOST`, `DOMAIN_CLIENT`, `RAG_API_URL`, `LDAP_URL`, `LDAP_USER_SEARCH_BASE`, `OPENID_REUSE_TOKENS`, `JWT_SECRET`, `SESSION_SECRET`, API keys for providers (`GOOGLE`, `AZURE`, etc.).
- **Sensitive env vars**: Database URIs, Meili keys, OAuth client secrets, AWS/Azure credentials, JWT secrets, `SESSION_SECRET`, `MEILI_MASTER_KEY`.
- **Never public**: `.env.example` should include placeholders and not real secrets; ensure `.env` is excluded from git (already in `.gitignore`).
- **Hardcoded risk**: Search for values in code (e.g., default port 3080). Avoid shipping credentials in Dockerfiles or `deploy-compose`.
- **Secrets leaking in builds**: Docker Compose mounts `.env` into the container (`docker-compose.yml`); avoid copying `.env` into build layers to prevent leakage via image history.
- **Recommendations**:
  - Use Vault or secret manager to inject env vars at runtime.
  - Ensure CI/CD redacts secrets (GitHub Actions secrets, helm charts).
  - Document `.env.example` with required keys and safe defaults.

### Database Security Mapping

- **Models**: `packages/data-schemas` defines `User`, `Conversation`, `Message`, `Agent`, `Assistant`, `Preset`, `Prompt`, `File`, `Role`, etc.; these are instantiated via `createModels` and wired in `api/db/models.js`.
- **Sensitive fields**: `User.password`, `Conversation.token`, `Message.payload`, `Agent.secret`, `File.path`.
- **Indexes**: `indexSync` ensures text indexes on `Message` and `Conversation` for Meili. Mongo indexes exist per schema (not shown), but any schema lacking `unique` may allow duplication.
- **Query patterns**: Most routes query by `conversationId`, `messageId`, `user`; unvalidated IDs may allow enumeration. `getMessages` uses filters with `$gt/$lt` by sort fields; sanitized via `express-mongo-sanitize`.
- **Injection risk**: Mongo queries are sanitized globally, but user-supplied `sortBy`/`sortDirection`, `cursor`, or `search` strings can still impact logic.
- **Missing normalization**: Some text fields stored without trimming (e.g., `Prompt.text`), so consider normalization to prevent duplicates or whitespace-based bypass.

### High-Level Threat Surfaces

1. **API endpoints**: All `/api/*` routes accept JSON; primary risk is insufficient validation/auth middleware, rate limiting, and dependency chain injection (Tool/Agent services). High-risk targets include `/api/messages`, `/api/actions`, `/api/assistants`, `/api/files`.
2. **Web UI**: Frontend served from `/` and `/images`; attacks include XSS via stored prompts or banners, CSRF on refresh cookies, XSRF on open CORS.
3. **Uploads**: `/api/files` and `/images/` allow binary data; attackers could upload malware or trigger SSRF (if file metadata results in requests).
4. **Auth**: `/api/auth` and `/oauth` flows rely on third-party providers; risk of open redirect, token replay, or leaked refresh tokens due to missing SameSite/Lax settings.
5. **Integrations**: Agents/tools (`/api/agents`, `/api/mcp`) execute third-party code; they are high-risk for data exfiltration and SSRF/SSRF-like tool chains.

### Residual Risk Summary

- **Highest risk areas**:
  1. Open CORS combined with cookie-based refresh tokens (CSRF/credential leakage).
  2. Agent/tool execution surfaces (`/api/actions`, `/api/mcp`, `/api/assistants`) lacking strict input validation.
  3. File uploads without antivirus scanning.
- **Known missing controls**:
  - Explicit request validation schemas for numerous endpoints.
  - CSP/HSTS/secure header enforcement for the API.
  - Token revocation list after logout.
  - Antivirus/SCANNING pipeline for uploaded content.
- **OWASP audit priorities**:
  1. Validate all JSON payloads—introduce Zod/Joi schemas covering nested fields.
  2. Harden CORS and CSRF defenses (restrict origins, add tokens, apply SameSite cookies).
  3. Monitor and log agent/tool execution flows to detect injection/exfiltration attempts.
  4. Implement secrets management to keep credentials out of build artifacts.
