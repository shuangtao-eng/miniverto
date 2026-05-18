# Open Source Maintenance Notes

This document captures the operating model for Miniverto as an open-source alpha.

## Current Positioning

Miniverto should be presented as an alpha project for builders, self-directed learners, and local-first AI tool enthusiasts. The project is public so others can inspect the direction, run it locally, and contribute to the core learning loop.

## Maintainer Priorities

1. Keep `main` buildable.
2. Keep README limitations honest.
3. Prefer small, reviewable pull requests.
4. Label beginner-friendly issues clearly.
5. Avoid promising stable installers until signing, updates, and platform validation are ready.
6. Keep README screenshots English-first; see [SCREENSHOTS.md](SCREENSHOTS.md).

## First Public Issues

The first issue set should show a healthy project roadmap:

- Native cloud model runtime through keyring.
- macOS validation.
- PDF and document ingestion.
- Tauri CSP hardening.
- README screenshots and demo data improvements.

## Commercial Direction

The recommended model is open-core:

- Keep the local-first desktop core open source.
- Monetize hosted sync, encrypted backup, signed installers, managed parsing, team workflows, and education/enterprise support.
- Keep AI provider choice open so users can bring their own keys, local models, or future hosted Miniverto services.
