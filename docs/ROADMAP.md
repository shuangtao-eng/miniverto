# Miniverto Roadmap

This roadmap describes the practical path from open-source alpha to a more reliable desktop learning planner.

## Now

- Keep the app runnable from a clean clone.
- Document alpha limitations clearly.
- Preserve local-first storage and keyring behavior.
- Keep frontend and Rust tests passing.

## Next

- Wire cloud model calls through the native runtime so stored API keys are never exposed to the frontend.
- Replace simulated provider connection checks with real health checks.
- Add platform validation for macOS and Linux.
- Add PDF and document ingestion beyond plain text and Markdown.
- Tighten Tauri CSP and provider request allowlists.
- Add screenshots and short demo assets to the README.

## Later

- Add signed desktop releases.
- Add guided re-planning after failed assessments.
- Add spaced review and long-term memory workflows.
- Improve accessibility and keyboard-driven navigation.
- Add import/export for learning projects and notes.
- Explore plugin-style provider adapters for local and cloud models.

