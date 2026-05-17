# macOS and Linux Notes

Miniverto uses Tauri, React, Rust, SQLite, and OS credential storage. The architecture is intended to be cross-platform, but the current alpha has been verified on Windows first.

## Current Status

- Windows development and local desktop build are verified.
- macOS and Linux need validation from a clean clone.
- The Rust `keyring` dependency is currently configured with a Windows-native feature. Cross-platform keyring support should be reviewed before claiming stable macOS or Linux support.

## What Needs Testing

- `npm ci`
- `npm run dev`
- `npm run build`
- `cd src-tauri && cargo test`
- `npm run tauri:dev`
- API key save, existence check, and delete behavior.
- Local SQLite project, material, note, and assessment persistence.

