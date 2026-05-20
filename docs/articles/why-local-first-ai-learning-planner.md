# Why I Built Miniverto, a Local-First AI Learning Planner with Tauri and Rust

Most learning apps begin too late.

They assume you already know what to study, how to sequence it, which materials matter, and when you should test yourself. For many real learning goals, that is exactly the hard part. "Learn machine learning", "prepare for a product management interview", or "understand advanced React and TypeScript" are not tasks. They are messy projects with uncertain scope, uneven background knowledge, and a lot of context that changes as you learn.

Miniverto is my attempt to build a learning planner around that reality.

It is an open-source, local-first AI learning planner. The goal is to help people turn an ambitious learning goal into a structured plan, connect that plan to their materials and notes, and keep revising it as their understanding changes.

## Why Local-First Matters

Learning data can be surprisingly personal. A study plan might include career goals, weak areas, private notes, exam timelines, imported documents, and API keys for model providers. I wanted Miniverto to treat that context as something the user owns, not something a hosted app quietly absorbs.

That is why the project is local-first by default:

- Project data lives in a local SQLite database.
- API keys are stored through the operating system credential store.
- Materials stay local unless the user intentionally sends selected context to a configured model provider.
- The app can fall back to deterministic in-app planning when a live model endpoint is not available.

This does not mean Miniverto rejects cloud models. It means provider choice should be explicit, and the app should make the privacy boundary visible.

## Why Tauri, Rust, and React

Miniverto is a desktop app because the desktop is still where many serious learning workflows happen. People collect PDFs, notes, browser research, code snippets, course outlines, and local files. A browser-only app can work, but a desktop shell gives the project a better path toward local storage, keyring integration, filesystem-aware workflows, and offline-first behavior.

The current stack is:

- React, TypeScript, Vite, Tailwind CSS, TanStack Router, Zustand, and Vitest for the frontend.
- Tauri 2 for the desktop shell.
- Rust, rusqlite, and keyring for the native layer.
- SQLite plus OS keyring storage for local data and secrets.

This split keeps the product experience fast to iterate on while giving security-sensitive work a native boundary.

## What Miniverto Can Do Today

The current alpha can create structured learning projects, collect learner profile signals, generate deterministic learning plans, ingest plain text and Markdown materials, store notes and assessments locally, and run both frontend and Rust test suites.

It also includes provider configuration and OS keyring storage. The cloud model runtime path is still being hardened, and that is one of the main reasons the project is labeled alpha.

The most important current limitations are documented openly:

- Windows is the verified desktop development target today.
- macOS and Linux need platform-specific validation.
- Provider health checks are not fully real yet.
- Stored-key cloud model calls still need to be routed through the Tauri runtime.
- PDF and richer document ingestion are not fully implemented.
- Tauri CSP and provider request boundaries need hardening before a stable release.

These are not hidden footnotes. They are the roadmap.

## The Product Bet

The product thesis is simple: a good learning app should feel less like a static syllabus and more like a private tutor that remembers your context.

That means the plan cannot be generic. It needs to know the learner's goal, starting point, time budget, blockers, materials, and assessment results. It also needs to admit when the plan should change.

In practice, Miniverto is built around this loop:

1. Define the goal and current starting point.
2. Add learning materials or constraints.
3. Generate a practical plan with milestones and task-level outcomes.
4. Learn through focused task pages, notes, and assessments.
5. Re-plan when understanding changes.

The long-term opportunity is not just "AI writes a study plan." It is a private learning operating system that helps a person stay oriented while their understanding evolves.

## Where Contributors Can Help

Miniverto is intentionally public early. The best contributions right now are small, concrete, and easy to review:

- Validate macOS setup and keyring behavior.
- Improve onboarding, README clarity, and troubleshooting notes.
- Add focused tests around material ingestion and planning behavior.
- Help harden Tauri CSP and provider request boundaries.
- Improve accessibility and keyboard-driven workflows.

The project is still small enough that thoughtful feedback can shape the direction. If you care about local-first software, AI learning workflows, Tauri, Rust, React, or personal knowledge tools, Miniverto is a good place to look around.

Repository: https://github.com/shuangtao-eng/miniverto

