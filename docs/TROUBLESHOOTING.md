# Troubleshooting Clean-Clone Setup

This page covers common setup problems when running Miniverto from a fresh clone.

## Check Node.js and npm versions

Miniverto expects Node.js 22 or newer and npm 11 or newer.

```bash
node --version
npm --version
```

If `npm ci` fails with an engine, lockfile, or dependency resolution error, install the current Node.js LTS release and retry from a clean checkout.

## Install or update Rust

The Tauri desktop app needs a stable Rust toolchain.

```bash
rustc --version
cargo --version
```

If either command is missing, install Rust with `rustup`, restart the terminal, and run the commands again. If Rust is present but old, update it:

```bash
rustup update stable
```

## Choose the right development command

Use `npm run dev` when you only need the browser-based Vite UI. This is the quickest way to inspect most React screens and frontend behavior.

Use `npm run tauri:dev` when you need desktop-only behavior, including SQLite storage, Tauri commands, or operating-system credential storage.

## Tauri dev startup issues

If `npm run tauri:dev` starts the frontend but the desktop window does not open:

1. Confirm dependencies were installed with `npm ci`.
2. Confirm Rust is available with `cargo --version`.
3. Run `npm run dev` separately to check whether the Vite frontend starts on its own.
4. Review the terminal output for missing platform dependencies or Rust compilation errors.

## Windows keyring and credential-store prompts

Miniverto stores API keys through the operating system credential store. On Windows, the first desktop run may trigger credential or security prompts. Accept the prompt only if it is for the local Miniverto/Tauri app you just started.

If key storage appears to fail, retry with `npm run tauri:dev` instead of `npm run dev`; the browser-only Vite command cannot exercise every desktop credential path.

## When checks fail

Run the full project check before opening a pull request:

```bash
npm run check
```

If a failure is platform-specific, include your OS, Node.js version, npm version, Rust version, and the failing command in the issue or pull request notes.
