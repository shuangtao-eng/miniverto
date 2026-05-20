# Miniverto Launch Kit

This document keeps launch copy, channel strategy, and metrics in one place. English is the main project language; Chinese copy is included for Chinese communities.

## Positioning

One-line description:

```text
Miniverto is an open-source local-first AI learning planner that turns learning goals, materials, notes, and assessments into structured study plans.
```

Short value proposition:

```text
Most learning tools start after you already know what to study. Miniverto starts earlier: it helps you shape a vague learning goal, connect it to your background and materials, then turn that context into a plan you can actually follow.
```

Repository:

```text
https://github.com/shuangtao-eng/miniverto
```

Primary demo asset:

```text
https://github.com/shuangtao-eng/miniverto/blob/main/docs/assets/miniverto-demo.gif
```

## Current Alpha Goal

The current goal is not a mass-market launch. It is to reach early users and contributors who care about:

- local-first software
- AI-assisted learning workflows
- Tauri, Rust, React, and SQLite desktop apps
- privacy-conscious productivity tools
- open-source contribution opportunities

Good outcome for the alpha:

- 5-20 people who genuinely understand the project.
- A few comments from learners or developers.
- One or two useful issues or pull requests.
- Clearer signal about which v0.2-alpha work matters most.

## Channels for the Alpha Stage

Start with smaller, feedback-oriented channels:

- GitHub README and topics.
- Reddit communities such as `r/opensource`, `r/SideProject`, `r/productivity`, `r/rust`, and `r/reactjs`.
- Tauri, Rust, React, and local-first Discord or community spaces.
- Dev.to, Hashnode, LinkedIn, and X.
- Chinese communities such as V2EX, Juejin, Zhihu, and Jike.

Avoid a major Product Hunt or Hacker News push until v0.2-alpha has stronger runtime, security, and platform validation.

## Reddit or Discord Post

```text
I am building Miniverto, an open-source local-first AI learning planner.

It helps turn learning goals, notes, materials, and assessments into structured study plans while keeping project data local by default. The app is built with Tauri, React, Rust, SQLite, and OS keyring storage.

It is still alpha, so I am mostly looking for feedback from people who care about learning workflows, local-first software, or AI tools that do not send everything to a hosted backend.

GitHub: https://github.com/shuangtao-eng/miniverto
Demo: https://github.com/shuangtao-eng/miniverto/blob/main/docs/assets/miniverto-demo.gif
```

## X or LinkedIn Post

```text
I open-sourced Miniverto, a local-first AI learning planner built with Tauri, React, Rust, and SQLite.

The idea: learning plans should start from your goal, background, materials, notes, and assessment results, not a generic syllabus.

Still alpha, and I am looking for feedback from people interested in local-first AI tools.

https://github.com/shuangtao-eng/miniverto
```

## Dev.to or Hashnode Intro

Use the article in `docs/articles/why-local-first-ai-learning-planner.md` as the first long-form post. Suggested title:

```text
Why I built Miniverto, a local-first AI learning planner with Tauri and Rust
```

Suggested tags:

```text
opensource, tauri, rust, react, ai
```

## Hacker News Draft for v0.2-alpha

Title:

```text
Show HN: Miniverto - a local-first AI learning planner built with Tauri
```

Post:

```text
Hi HN,

I built Miniverto, an open-source local-first AI learning planner. It turns learning goals, materials, notes, and assessments into structured study plans while keeping project data local by default.

The stack is Tauri 2, React, TypeScript, Rust, SQLite, and OS keyring storage. The project is still alpha, but it is runnable and the roadmap is public.

I am especially interested in feedback from people who care about local-first software, self-directed learning, and AI tools with explicit provider boundaries.

GitHub: https://github.com/shuangtao-eng/miniverto
```

Use this after the v0.2-alpha blockers are addressed or clearly scoped:

- Tauri CSP and provider request boundaries.
- Stored-key cloud model calls through the Tauri runtime.
- macOS desktop build and keyring validation.

## Product Hunt Draft for v0.2-alpha

Tagline:

```text
A local-first AI learning planner for turning goals and materials into structured study plans.
```

Description:

```text
Miniverto helps learners turn vague goals, notes, materials, and assessments into adaptive study plans. It is open source, desktop-first, and local-first by default, with project data stored locally and provider choices kept explicit.
```

First comment:

```text
Hi Product Hunt,

I built Miniverto because many learning tools assume you already know what to study. Miniverto starts earlier: it helps shape the goal, connect it to your background and materials, and turn that context into a plan you can follow.

It is built with Tauri, React, Rust, SQLite, and OS keyring storage. The project is open source and still alpha, so feedback is very welcome.
```

Do not ask for upvotes. Invite comments, feedback, and concrete use cases.

## Chinese Community Post

```text
我开源了 Miniverto，一个本地优先的 AI 学习规划器。

它的目标是帮助用户把模糊的学习目标、资料、笔记和评估结果整理成可执行的学习计划，同时尽量把项目数据保留在本机。技术栈是 Tauri、React、Rust、SQLite 和系统 keyring。

目前还是 alpha，更希望先收到真实反馈，尤其是对自学流程、local-first 软件、AI productivity 工具感兴趣的朋友。

GitHub: https://github.com/shuangtao-eng/miniverto
```

## Launch Checklist

Before posting to a new channel:

- Confirm `main` CI is green.
- Confirm open PR count is low or zero.
- Confirm no unresolved user comments are waiting for maintainer reply.
- Confirm README screenshots and `docs/assets/miniverto-demo.gif` still match the current app.
- Confirm known alpha limitations are visible in README.
- Track GitHub traffic for the next 14 days.

## Metrics to Track

Use GitHub Insights and repository notifications:

- Stars, forks, and watchers.
- Unique visitors and clones.
- Referrers from launch channels.
- New issues and comments.
- Contributor interest in `good first issue` tasks.
- Any confusion around installation, privacy, or alpha limitations.
