# Open Source Release Checklist

Use this checklist before pushing Miniverto to GitHub.

## Local Repository

- [ ] Run `npm ci`.
- [ ] Run `npm run check`.
- [ ] Confirm `git status --short` does not include build outputs.
- [ ] Confirm `dist/`, `node_modules/`, `src-tauri/target/`, `.worktrees/`, `.superpowers/`, and `release/` are not staged.
- [ ] Review README alpha limitations.
- [ ] Review LICENSE and package metadata.

## GitHub Repository

- [ ] Create a new public repository named `miniverto`.
- [ ] Add the short description from `docs/GITHUB_REPOSITORY_COPY.md`.
- [ ] Add the suggested topics from `docs/GITHUB_REPOSITORY_COPY.md`.
- [ ] Enable Issues.
- [ ] Enable private vulnerability reporting if available.
- [ ] Push the local public directory.
- [ ] Confirm the CI workflow runs.

## First Release

- [ ] Create a GitHub release named `v0.1.0-alpha`.
- [ ] Use the release summary from `docs/GITHUB_REPOSITORY_COPY.md`.
- [ ] Do not attach unsigned desktop installers unless the release notes clearly label them as experimental.

