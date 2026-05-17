# Security Policy

Miniverto is an alpha local-first desktop app. Security-sensitive areas include local SQLite storage, OS credential storage, model-provider requests, material ingestion, and Tauri command boundaries.

## Supported Versions

Only the current `main` branch is maintained during alpha.

## Reporting a Vulnerability

Please do not open a public issue for suspected vulnerabilities.

Use GitHub private vulnerability reporting if it is enabled on the repository. If private reporting is not available yet, contact the maintainer through the preferred private channel listed on the repository owner profile.

Please include:

- Affected area.
- Reproduction steps.
- Expected impact.
- Whether credentials, local files, provider requests, or user materials are involved.

## Current Security Notes

- API keys are stored through the operating system credential store.
- Project, note, material, and assessment data are stored locally.
- Provider connection and cloud-model runtime behavior are still being hardened.
- Tauri CSP tightening is on the roadmap before a stable desktop release.

