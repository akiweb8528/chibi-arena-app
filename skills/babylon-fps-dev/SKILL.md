---
name: babylon-fps-dev
description: implement and review a browser-based 3d fps built with vite and babylon.js. use when chatgpt needs to incrementally build fps features, generate babylon.js scaffolds for player movement, shooting, hit detection, camera control, and scene setup, review code for architecture and correctness, or propose fixes for vite and babylon.js integration issues in a vscode full-scratch workflow backed by github. prioritize encapsulation, separation of concerns, design by contract, and side-effect isolation unless a simpler implementation is clearly required for correct runtime behavior.
---

# Babylon FPS Dev

Use this skill to work on a Vite + Babylon.js 3D FPS project from scratch in VSCode.

## Core workflow

Follow this order unless the user explicitly asks for a narrower task.

1. Identify the requested slice: scaffold, implement, review, debug, or refactor.
2. Inspect the current project structure before proposing changes.
3. Restate the smallest playable outcome for the current step.
4. Implement or recommend changes in thin vertical slices.
5. Verify compile/runtime impact, not just type shape.
6. End with remaining risks and the next highest-leverage step.

Prefer small, reviewable commits over broad rewrites.

## Task routing

### 1. Implementing FPS features

Use this path for movement, aiming, shooting, hit detection, health, simple AI, pickups, stage loading, HUD, and input.

- Start from the minimum playable slice.
- Keep rendering, domain logic, input, and scene wiring in separate modules.
- Create contracts first: types, invariants, ownership, lifecycle.
- Add side effects only at composition boundaries.
- Do not couple gameplay rules directly to Babylon mesh instances when a domain model can own the rule.
- When introducing a new system, define:
  - purpose
  - inputs and outputs
  - owned state
  - update cadence
  - cleanup requirements

Default build order for a new FPS:

1. engine bootstrap and render loop
2. scene factory and environment
3. input adapter
4. player controller and camera rig
5. weapon fire request flow
6. hit resolution pipeline
7. health and damage domain model
8. HUD and feedback
9. enemies and spawn rules
10. save/load or meta systems

### 2. Generating scaffolds

When asked for a starter implementation, generate code that is runnable and easy to extend.

Prefer modules like these:

- `src/core/engine/` for engine bootstrap and lifecycle
- `src/core/scene/` for scene creation and asset wiring
- `src/features/player/` for controller, input mapping, and camera rig
- `src/features/combat/` for weapon flow, raycasts, damage, and effects
- `src/features/enemies/` for enemy state and behaviors
- `src/features/ui/` for HUD and menu
- `src/shared/` for math helpers, events, result types, and contracts

Generated scaffolds must:

- keep Babylon-specific code behind feature or infrastructure modules
- expose explicit constructor arguments rather than hidden singletons
- provide `update()` and `dispose()` on long-lived runtime objects when relevant
- prefer pure helpers for calculations such as recoil, spread, cooldown, and damage falloff
- mark placeholder logic clearly

### 3. Reviewing Babylon.js code

Use the review checklist in `references/review-checklist.md`.

Always review in this order:

1. runtime correctness
2. architecture boundaries
3. state ownership and contracts
4. Babylon lifecycle safety
5. performance hotspots
6. readability and extension cost

When reviewing, report findings in this structure:

#### Summary
One paragraph on overall health and main risks.

#### Critical issues
Only issues that can cause incorrect behavior, leaks, broken gameplay, or unsafe lifecycle.

#### Design issues
Boundary leaks, hidden dependencies, weak contracts, mixed responsibilities.

#### Suggested refactor order
Smallest safe sequence of changes.

Be concrete. Point to modules, functions, and data flows rather than giving generic style advice.

### 4. Fixing Vite + Babylon.js integration issues

Use this path for asset loading, hot reload side effects, canvas ownership, input registration, TypeScript config, build issues, and deployment readiness.

Check these first:

- duplicate engine or scene creation during hot reload
- missing disposal on event listeners, observables, textures, and meshes
- asset path assumptions that break after build
- DOM ownership of the canvas element
- resize handling
- pointer lock setup and escape flow
- async loading races during scene transitions

Prefer patterns that survive HMR and remounts cleanly.

## Project rules

Apply these rules by default.

### Encapsulation

- Keep mutable state inside the module that owns the behavior.
- Expose commands and queries, not raw writable state.
- Avoid letting unrelated features mutate Babylon nodes directly.

### Separation of concerns

- Scene composition is not gameplay logic.
- Input capture is not player decision logic.
- Raycast execution is not damage policy.
- UI display is not authoritative game state.

### Design by contract

Before implementation, make assumptions explicit.

Examples:

- `PlayerController.update(dt)` requires `dt > 0`.
- `Weapon.tryFire(time)` returns a result object and does not mutate unrelated systems.
- `Damageable.applyHit()` accepts validated hit data, not raw mesh references.

Prefer narrow interfaces and discriminated unions for results.

### Side-effect isolation

Confine these to boundary modules:

- Babylon engine and scene creation
- DOM and browser APIs
- network and persistence
- audio playback
- randomness that must be seeded or replayable

Keep pure calculations separate so they can be tested without Babylon.

## Implementation defaults

Unless the repository already has a stronger pattern, prefer:

- TypeScript
- one public runtime class or factory per feature module
- constructor injection for dependencies
- explicit `dispose()` for anything registering Babylon or DOM callbacks
- composition root near `main.ts`
- feature-local types before global shared types

Prefer factories when lifetime is short or closure-based composition is clearer. Prefer classes when lifecycle, state, and cleanup are central.

## Output expectations

When you implement or propose changes:

- explain the target slice in one or two sentences
- show the file plan first for non-trivial changes
- keep edits localized
- mention invariants and lifecycle assumptions
- note any follow-up verification needed

When the user asks for a roadmap, provide phased milestones with a playable checkpoint at the end of each phase.

## References

- For architecture guidance, read `references/architecture-guide.md`.
- For delivery sequencing, read `references/fps-roadmap.md`.
- For review work, read `references/review-checklist.md`.
