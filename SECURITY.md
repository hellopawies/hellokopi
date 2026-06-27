# Security Policy

Hello Kopi is a small internal office tool. The source is public, so this
file explains how to report issues and what the intended security model is —
so a finding can be triaged against what's deliberate versus what's a bug.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Use GitHub's private vulnerability reporting:
**Repository → Security → Report a vulnerability**
(or the "Report a vulnerability" button under the Security tab).

We aim to acknowledge within a few days. There's no bounty — this is a
hobby/internal project — but credit is given on request.

## Intended security model (by design, not bugs)

Hello Kopi is built for a single trusted office. The following are
deliberate trade-offs, documented here and in the README so they're not
re-reported as vulnerabilities:

- **Row Level Security is permissive.** Every table allows anonymous
  select/insert/update/delete. Anyone with the public anon key (which ships
  in the static bundle, as anon keys are designed to) can read or modify
  rows. There is no per-user data isolation.
- **The admin page is a soft client-side gate.** It checks a password hash
  that is present in the bundle. It deters casual visitors; it is not an
  authentication boundary. Destructive Supabase operations can be performed
  directly with the anon key regardless of the gate.
- **No PII beyond first names and drink choices** is stored. Order rows
  carry a name, drink items, and a timestamp.

If the app is ever opened beyond the trusted office, the migration path is:
Supabase Auth + tightened RLS (anon-read where needed, authenticated-write,
admin-role-gated destructive ops). See the README "Threat model" section.

## What we do treat as a real vulnerability

- Leaked **service-role** key or any non-anon secret in the repo or bundle
- A way to read/write data from a **different Supabase project**
- Stored or reflected **XSS** (script execution from user-entered data)
- Supply-chain issues in dependencies that affect the **static export**
  (note: Next.js advisories that require a running Next *server* do not
  apply — this app is a static export served by GitHub Pages)
- Anything that lets a visitor exfiltrate data to a third-party origin

## Deployment notes

- Static export (`output: 'export'`) served by GitHub Pages — no server,
  no server-side rendering at request time, no API routes.
- A `Content-Security-Policy` is set via `<meta>` in the document head.
  GitHub Pages cannot set HTTP response headers, so header-only protections
  (`X-Frame-Options`, CSP `frame-ancestors`, HSTS) are not configurable from
  this repo; GitHub serves Pages over HTTPS with HSTS at the platform level.
