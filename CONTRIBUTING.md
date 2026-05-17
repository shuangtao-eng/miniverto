# Contributing to Miniverto

Thanks for taking a look at Miniverto. The project is in alpha, so thoughtful issues, small fixes, and clear product feedback are especially valuable.

## Development Setup

Install dependencies:

```bash
npm ci
```

Run the web app:

```bash
npm run dev
```

Run the Tauri app:

```bash
npm run tauri:dev
```

Run all local checks:

```bash
npm run check
```

The `check` script runs frontend tests, frontend build, and Rust tests.

## Pull Request Guidelines

- Keep pull requests focused on one behavior or cleanup area.
- Include tests when changing planning logic, storage behavior, provider runtime behavior, or assessment logic.
- Update README or docs when user-facing behavior changes.
- Avoid committing generated output such as `dist/`, `target/`, release archives, or local databases.
- Be explicit when a change affects privacy, model-provider behavior, or local storage.

## Product Principles

- Local-first is the default.
- The app should make learning plans more specific, not just prettier.
- AI behavior should be transparent about what context it uses.
- Deterministic fallbacks are useful, but they must not pretend to be live model calls.
- The desktop app should feel calm, focused, and efficient for repeated study sessions.

## Code Style

Follow the existing project style:

- TypeScript with narrow, explicit service helpers.
- React components that keep product flows readable.
- Rust stores with focused unit tests around persistence behavior.
- Small comments only where they clarify non-obvious choices.

## Reporting Issues

Use GitHub issues for bugs, product feedback, and small feature proposals. For suspected security problems, follow [SECURITY.md](SECURITY.md).

