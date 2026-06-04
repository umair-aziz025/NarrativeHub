# Contributing

Thanks for considering a contribution to NarrativeHub.

## How to Contribute

1. Fork the repository.
2. Create a focused branch from `main`.
3. Install dependencies with `npm install`.
4. Copy `.env.example` to `.env` and add local-only values.
5. Run `npm run check` before opening a pull request.
6. Open a pull request with a clear summary and any testing notes.

## Development Guidelines

- Keep changes focused and easy to review.
- Follow the existing React, Express, TypeScript, Tailwind, and Drizzle patterns.
- Do not commit `.env` files, API keys, database URLs, generated logs, or local platform files.
- Update the README when a user-facing setup step, feature, route, or script changes.
- Include screenshots or short recordings for meaningful UI changes when possible.

## Commit Style

Use short, descriptive commit messages, for example:

```text
Add room member role filters
Fix story chain ordering
Document OpenAI setup
```

## Code of Conduct

All contributors are expected to follow `CODE_OF_CONDUCT.md`.
