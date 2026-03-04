# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.5.x   | ✅ Active |
| < 0.5   | ❌ No     |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email: **security@aeonark.com**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within **48 hours** and provide a resolution timeline within **5 business days**.

## Security Measures

AeonRFP implements the following security controls:

- **Row-Level Security (RLS)** — all database tables scoped by `tenant_id`
- **Server-side authentication** — API routes validate Supabase sessions
- **Environment isolation** — secrets never exposed to client-side code
- **Dependency auditing** — automated `npm audit` in CI pipeline
- **Secret scanning** — CI checks for accidentally committed API keys
- **Plan enforcement** — rate limiting prevents abuse
- **Token budgets** — per-request cost controls limit AI spending

## Responsible Disclosure

We appreciate responsible disclosure and will credit security researchers (with permission) in our release notes.
