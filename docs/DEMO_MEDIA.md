# Demo Media

This directory contains lightweight demo assets for sharing Miniverto on GitHub, community forums, and launch posts.

## Primary Demo Loop

- File: `docs/assets/miniverto-demo.gif`
- Length: 30 seconds
- Purpose: quick visual explanation for README, Reddit, Product Hunt, and social posts
- Source images:
  - `docs/assets/hero-dashboard.png`
  - `docs/assets/project-detail.png`
  - `docs/assets/learning-workspace.png`

Regenerate the GIF after refreshing screenshots:

```bash
python scripts/create_demo_gif.py
```

The GIF is intentionally small and text-led. It is not meant to replace a real screen recording once the v0.2-alpha flow is ready.

## 45-Second Video Script

Use this when recording a future narrated or captioned demo.

1. 0-8 seconds: show the dashboard and explain that Miniverto starts from a learning goal, not a generic task list.
2. 8-18 seconds: open a project and show milestones, task outcomes, progress, and learner constraints.
3. 18-30 seconds: open the learning workspace and show task guidance, notes, and assessment loops.
4. 30-38 seconds: show settings or architecture notes and explain the local-first model: SQLite data, OS keyring secrets, explicit providers.
5. 38-45 seconds: close on the roadmap and invite feedback from people interested in local-first AI learning tools.

Suggested caption:

```text
Miniverto is an open-source local-first AI learning planner. It turns learning goals, materials, notes, and assessments into structured study plans while keeping project data on your machine.
```

