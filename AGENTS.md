# Tired project instructions

## Purpose

Tired is a modern 2D browser game with a three-quarter (isometric-style) view
inspired by Diablo 1, developed through small daily warm-up experiments.
The first target is a desktop browser with keyboard and mouse; character
movement uses click-to-move.
The user's questions and decisions drive development; keep each change easy to
inspect and try.

The long-term vision is an open-source, persistent open world that grows
through community contributions. See `GAME_NOTES.md` and `CONTRIBUTING.md`.
This direction does not authorize persistence, online play, or world content
systems before the user selects a small step. The project uses the MIT license;
Mbeaulne alone merges contributions into the official GitHub `main` branch.

## Small changes are the default

- Work on one small, observable or otherwise verifiable result per step.
- Treat broad requests such as "build a level" as invitations to clarify and
  plan. Do not implement the whole feature from that request.
- When the user asks to plan, produce a plan and questions only. Planning does
  not authorize implementation.
- Ask as many questions as needed to define the smallest useful next change.
  Clarify the intended result, decisions that affect that result, and what the
  user should be able to do or see when it is finished.
- Ask questions in manageable batches. Keep them relevant to the current step;
  defer decisions about later features until they matter.
- Do not silently choose gameplay, camera, controls, or visual direction when
  those decisions are unclear and would change the result. Routine technical
  choices within an already clear step can be made independently.
- Once the user's request and answers define a clear small step, complete it
  without repeatedly asking for the same authorization.
- Implement only that step and its necessary supporting work. Do not bundle
  additional mechanics, content, speculative architecture, dependencies, or
  unrelated refactors.
- If a dependency or discovery would materially widen the step, explain it and
  ask about the revised scope before doing the expanded work.
- Verify the selected result, describe what changed and what was actually
  checked, and stop at that result. A next-step suggestion is not authorization
  to implement it.
- Larger changes are allowed only when the user explicitly requests that larger
  scope. A roadmap or to-do item alone is not that request.

For example, "I want to build a level" should lead to questions about one small
walkable zone. Choose its view and define a movement check before implementing
the zone. Add further content or mechanics in separately selected steps.

## Project notes and tasks

- Read `README.md` and `TODO.md` before project work, along with any future
  authoritative feature tracker.
- Keep `TODO.md` short and current at meaningful checkpoints and before a
  handoff. Track implementation and required verification separately.
- Record established decisions in the project notes. Label proposals and
  unanswered questions clearly.
- Do not invent a game design or backlog from an example or an open question.
- Preserve unrelated work. Follow the workspace deployment convention: a user
  request to deploy means commit the requested work and push to GitHub main.

## Technology decisions

The prototype uses Phaser, TypeScript, and Vite; see `README.md` for
versions and commands. Do not add dependencies solely because a future idea
may need them.

The floor must remain endless with bounded resources. Keep its rendering
surface tied to the viewport, reuse its repeating texture, and keep texture
offsets small. Do not allocate a growing map as the view travels. The current
experiment has a still view and a stationary humanoid placeholder. Preserve
its foot anchor and ground shadow. Character movement belongs to a later step
until the user selects and defines that change.

Depth markers use stable random placement, ground anchors, and ground-position
drawing order. Keep their sprite pool tied to the viewport; do not retain all
visited markers. The stone block style is provisional, and the current
markers are decorative depth cues on the flat floor.
