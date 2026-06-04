# Security Policy

## Supported Versions

Security updates are handled on the `main` branch of this repository.

## Reporting a Vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

To report a vulnerability, email the maintainer at `umair.aziz025@gmail.com` with:

- A clear description of the issue.
- Steps to reproduce it.
- Affected files, routes, or configuration when known.
- Any proof-of-concept details that help confirm impact.

You can expect an initial response within a reasonable timeframe. Please allow time for validation and remediation before public disclosure.

## Secret Handling

Do not commit real credentials, tokens, connection strings, private keys, or API keys. Use `.env` locally and secure environment variables in deployment platforms.

Required secret:

- `JWT_SECRET`

Common deployment secrets:

- `DATABASE_URL`
- `OPENAI_API_KEY`

If a secret is accidentally committed, rotate it immediately and remove it from Git history before publishing a release.
