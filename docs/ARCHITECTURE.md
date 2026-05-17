# Architecture

Miniverto is a Tauri desktop app with a React frontend and a Rust native layer.

## Frontend

The frontend lives in `src/`.

- `src/pages/` contains the main product surfaces.
- `src/components/` contains reusable layout, dialog, assessment, shared, and project UI.
- `src/services/` contains planning, provider, assessment, material, note, and persistence adapters.
- `src/stores/` contains local UI and project state.
- `src/data/` contains provider, model, learning method, and input configuration.
- `src/i18n/` contains English and Simplified Chinese UI strings.

## Native Layer

The Tauri layer lives in `src-tauri/`.

- `src-tauri/src/lib.rs` registers app commands.
- `db.rs` owns material storage and schema initialization.
- `project_store.rs`, `note_store.rs`, `assessment_store.rs`, and `provider_store.rs` own focused SQLite persistence behavior.
- `api_key_store.rs` bridges API key storage to the OS credential store.
- `material_parser.rs` and `material_service.rs` classify and ingest supported material types.

## Data Flow

1. The React UI collects learner goals, profile details, materials, and provider preferences.
2. Frontend services build structured planning payloads.
3. If a frontend-accessible no-key provider is configured, the app can call an OpenAI-compatible endpoint directly.
4. Otherwise, the app uses deterministic local generation for alpha planning flows.
5. Projects, tasks, materials, notes, provider settings, and assessments are persisted locally through Tauri commands.
6. API keys are stored through the OS credential store and are not persisted in SQLite.

## Important Alpha Boundary

The preferred future architecture is for all key-protected provider calls to go through the Rust/Tauri layer. This keeps secrets out of the browser context and gives the app one place to enforce endpoint validation, timeouts, request logging policy, and error handling.

