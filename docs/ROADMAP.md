# Miniverto Roadmap

This roadmap describes the practical path from open-source alpha to a more reliable desktop learning planner.

## Now

- Keep the app runnable from a clean clone.
- Document alpha limitations clearly.
- Preserve local-first storage and keyring behavior.
- Keep frontend and Rust tests passing.

## Next

- P0: tighten Tauri CSP and provider request allowlists before broader distribution (#12).
- P1: wire cloud model calls and real provider health checks through the native runtime so stored API keys are never exposed to the frontend (#8).
- P1: validate the macOS desktop build and keyring behavior on real developer machines (#10).
- P2: add PDF and document ingestion beyond plain text and Markdown (#11).

The README screenshots and bilingual entry points are already in place for the first public alpha (#13).

## Later

- Add signed desktop releases.
- Add guided re-planning after failed assessments.
- Add spaced review and long-term memory workflows.
- Improve accessibility and keyboard-driven navigation.
- Add import/export for learning projects and notes.
- Add Linux platform validation once the macOS desktop baseline is stable.
- Explore plugin-style provider adapters for local and cloud models.
