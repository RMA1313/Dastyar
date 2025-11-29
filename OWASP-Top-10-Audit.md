**OWASP Top 10 Security Audit — Findings & Recommendations**

**Executive Summary**  
Three concrete code-level findings emerged from the recent review: (1) the startup configuration endpoint leaks sensitive feature flags and environment-derived metadata without any authentication, (2) the global Express setup exposes overly permissive CORS and lacks modern security headers, and (3) the tool/file processing stack fetches arbitrary URLs returned by agent/tool outputs, opening a server-side request forgery (SSRF) vector. The remaining OWASP categories currently show no additional code paths requiring immediate remediation, but they should be monitored during the next audit cycle.

---

### Findings Table

| ID  | OWASP Category | Severity | Location | Description |
| --- | ------------- | -------- | -------- | ----------- |
| **F1** | **A1 – Broken Access Control** | High | `api/server/routes/config.js:33-193` | `GET /api/config` is completely public, returns cached startup payload, and exposes all environment-derived feature toggles, auth flags, and project identifiers to any unauthenticated caller. |
| **F2** | **A5 – Security Misconfiguration** | Medium | `api/server/index.js:83-110` | Global middleware calls `cors({ origin: true })`, removes only the `Feature-Policy` header and manually sets `Permissions-Policy`, but never enforces `Access-Control-Allow-Credentials`, CSP, HSTS, or other headers that stop credential leakage and clickjacking. |
| **F3** | **A10 – Server-Side Request Forgery (SSRF)** | High | `api/server/services/Files/process.js:283-311` + `api/server/services/Files/S3/crud.js:124-134` | `processFileURL` and the S3 strategy directly `fetch(URL)` from the caller before storing it. The URL is sourced from tool/artifact metadata (e.g., structured tool outputs), so a malicious agent can cause LibreChat to request internal services or metadata endpoints. |

---

## Detailed Findings

### A1 – Broken Access Control  
- **Finding**: `GET /api/config` (`api/server/routes/config.js:33-193`) is exposed on the public API without `requireJwtAuth`. It constructs a payload that includes environment-driven flags (`OPENID_*`, `SAML_*`, `EMAIL_*`, `SHAREPOINT_*`, `ANALYTICS_GTM_ID`, etc.), MCP server definitions, and feature toggles, then caches and returns that data to any caller.  
- **Why dangerous**: Attackers can enumerate enabled authentication providers, integration URLs, and feature flags. This leaks sensitive deployment topology (e.g., whether LDAP/OpenID/SAML is enabled) and support endpoints, which makes targeted attacks (especially on auth flows) easier.  
- **Remediation**: Protect `/api/config` with `requireJwtAuth` (or at least read-only admin roles) and limit the returned data to non-sensitive defaults. Alternatively, only expose filtered data to anonymous clients and keep secrets/config hidden behind authenticated/admin routes.

### A2 – Cryptographic Failures  
- **Observation**: No code-level weaknesses were identified in the crypto layer (JWT signing/refresh, secrets storage, or hashing). Secrets are sourced from env vars and the custom helpers (`signPayload`, `hashToken`) use Node crypto safely.  
- **Action**: Continue enforcing `JWT_SECRET`/`JWT_REFRESH_SECRET` presence and rotate secrets per policy. Consider enabling `REFRESH_TOKEN_EXPIRY` via safe config (avoid `eval` in production).

### A3 – Injection  
- **Observation**: No exploitable injection path was identified in the reviewed endpoints. Input is sanitized via Zod schemas or sanitized tools, and Mongo queries use parameterized filters or `express-mongo-sanitize`.  
- **Action**: Maintain strong schema validation and keep dependencies (e.g., Meilisearch) up to date.

### A4 – Insecure Design  
- **Observation**: The shared-link design allows anonymous consumers if `ALLOW_SHARED_LINKS_PUBLIC` is unset (defaults to true). While intentional, ensure public links are strictly scoped and have expiration controls.  
- **Action**: Add TTL/auto-revocation for public shares and consider per-link rate limits to prevent data harvesting.

### A5 – Security Misconfiguration  
- **Finding**: The middleware stack in `api/server/index.js:83-110` configures `cors({ allowedHeaders: [...], origin: true })`, but never restricts origins, never sets `Access-Control-Allow-Credentials`, CSP, HSTS, or Referrer-Policy, and only manually injects a permissive `Permissions-Policy`.  
- **Why dangerous**: Any website can now make requests to your API from the user’s browser (with credentials if the client opts-in), increasing CSRF/XSRF exposure, and the missing security headers leave browser-based threats (clickjacking, MIME sniffing) unchecked.  
- **Remediation**: Replace the CORS config with an explicit origin whitelist (or `process.env.DOMAIN_CLIENT`), enable `credentials: true` only when necessary, and inject headers such as `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, and `X-Content-Type-Options` (e.g., via `helmet()`).

### A6 – Vulnerable & Outdated Components  
- **Observation**: No obsolete dependency versions are exploited in runtime code. Libraries such as `express`, `mongoose`, and `axios` are recent. However, this repo references many third-party packages; keep `npm audit`/`pnpm audit` as part of CI.  
- **Action**: Regularly run dependency audits and watch for CVEs in packages like `passport`, `axios`, `sharp`, and OAuth clients.

### A7 – Identification & Authentication Failures  
- **Finding**: `refreshController` (`api/server/controllers/AuthController.js:53-151`) accepts the refresh token cookie without any CSRF token or double-submit protection, and it immediately returns `200` (not `401`) when no token is sent.  
- **Why dangerous**: If the refresh cookie ever gets exposed (e.g., via XSS), an attacker can trigger the `/api/auth/refresh` endpoint from any origin and obtain a new access token; the endpoint lacks explicit CSRF protections or nonce checks beyond SameSite.  
- **Remediation**: Add CSRF synchronization (double-submit cookie or custom header) for refresh requests, enforce `SameSite=Strict/Lax` (already set to `strict` but confirm browsers send cookies), and treat missing/invalid tokens as `401` instead of `200` for clearer auditing.

### A8 – Software & Data Integrity Failures  
- **Observation**: No direct data integrity failures were observed. Tool execution and agent orchestration go through properly signed actions (MCP, permission service). Continue to validate third-party tool outputs before acting on them.  
- **Action**: Keep verifying integrity of tool responses (e.g., validate tool signatures or tool metadata before running actions).

### A9 – Security Logging & Monitoring Failures  
- **Finding**: On errors (`api/server/routes/config.js:190-193` and many `catch` blocks), the API echoes `error.message` directly back to the caller (e.g., `res.status(500).send({ error: err.message });`).  
- **Why dangerous**: These messages can leak stack traces, schema names, or secret-related text (if thrown) to unauthenticated clients. Attackers can use this to fingerprint the stack and escalate subsequent attacks.  
- **Remediation**: Normalize error responses (e.g., `res.status(500).json({ error: 'Internal server error - reference XYZ' })`) and log the real message on the server.

### A10 – Server-Side Request Forgery (SSRF)  
- **Finding**: The tool/file processing pipeline exposes `processFileURL` (`api/server/services/Files/process.js:283-311`) which calls storage-specific `saveURL` helpers such as `saveURLToS3` (`api/server/services/Files/S3/crud.js:124-191`). Those helpers `fetch(URL)` without any allowlist or network boundary checks. `processFileURL` is invoked for tool artifacts (`ToolService`/`controllers/tools.js`) where the tool output controls the URL.  
- **Why dangerous**: A malicious tool or crafted agent response can force the server to fetch internal resources (`http://localhost:8080/metadata`, `http://169.254.169.254/latest/meta-data/`), leading to SSRF/data exfiltration.  
- **Remediation**: Implement an allowlist or safe resolver for URLs before fetching (e.g., only fetch HTTPS domains, restrict to trusted providers, or proxy through a secure service). Validate that the caller is permitted to request off-platform resources and enforce outbound network controls (e.g., deny `127.0.0.1`/`169.254.*`). Consider forcing multipart uploads only or sanitizing URLs to remove control characters.

---

## Next Steps

1. **Protect sensitive endpoints** – Add `requireJwtAuth`/role gating to `/api/config` or serve a slimmed-down anonymous view.  
2. **Harden the HTTP surface** – Lock down CORS and add security headers in the main Express middleware (consider `helmet()` or similar).  
3. **Mitigate SSRF** – Apply URL validation and egress filtering for `processFileURL`/storage helpers before fetching third-party resources.  
4. **Error handling hygiene** – Return generic error IDs to clients while logging the specifics to the server.  
5. **Periodic review** – Continue auditing the remaining OWASP categories (A2–A4, A6–A8) as code and deps evolve, ensuring new features don’t reintroduce the identified vectors.
