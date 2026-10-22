# AGENTS.md

## Purpose

This repository is a browser-based 3D FPS built with Vite + Babylon.js and developed in VSCode with GitHub-based review. Implement features in small, playable increments. Prioritize runtime correctness first, then architecture quality.

## Primary goals

- Keep the game playable at the end of each meaningful milestone.
- Favor encapsulation, separation of concerns, design by contract, and side-effect isolation.
- Keep Babylon.js integration thin around gameplay rules.
- Make restart, hot reload, and disposal behavior explicit and safe.

## Non-goals

- Do not introduce broad framework changes without a concrete need.
- Do not optimize prematurely at the cost of clear ownership.
- Do not couple unrelated features through shared mutable state.

## Default stack

- Vite
- TypeScript
- Babylon.js
- GitHub for version control and review
- VSCode as the day-to-day editing environment

## Working style

1. Understand the smallest user-visible outcome.
2. Inspect the existing files before changing structure.
3. Propose a file plan for non-trivial changes.
4. Implement the minimum vertical slice that works.
5. Verify lifecycle, cleanup, and build impact.
6. Note follow-up work separately from the current patch.

Prefer incremental PR-sized changes over large rewrites.

## Architectural rules

### Encapsulation

- Each module owns its mutable state.
- Expose commands, queries, and result objects rather than writable internals.
- Avoid reaching into another module's Babylon nodes unless ownership explicitly requires it.

### Separation of concerns

Keep these separate:

- engine/bootstrap
- scene composition
- input capture
- player movement rules
- combat rules
- enemy logic
- UI rendering
- persistence/network concerns

Do not mix gameplay policy with scene setup in the same module unless the scope is truly tiny and temporary.

### Design by contract

Make assumptions explicit in code.

Examples:
- update methods require finite positive delta time
- fire methods return explicit result states
- damage application accepts validated hit data rather than raw scene lookups

Prefer narrow interfaces, explicit parameter objects, and discriminated unions where they improve correctness.

### Side-effect isolation

Confine side effects to boundary modules:

- Babylon engine, scene, meshes, materials, observables
- DOM and browser APIs
- pointer lock and input registration
- audio playback
- persistence and networking
- seeded or non-seeded randomness

Keep math and gameplay policy pure when possible.

## Recommended structure

```text
src/
  main.ts
  app/
    createGameApp.ts
  core/
    engine/
    scene/
    assets/
  features/
    player/
    combat/
    enemies/
    ui/
  shared/
    contracts/
    events/
    math/
    utils/
```

This is a guide, not a law. Preserve an existing coherent structure if one already exists.

## FPS feature sequencing

Build in roughly this order unless a task says otherwise:

1. engine bootstrap and deterministic cleanup
2. scene factory and environment
3. input adapter
4. player controller and camera rig
5. weapon fire flow
6. hit detection and damage resolution
7. health/HUD feedback
8. enemies and spawn rules
9. progression and polish

End each phase with a playable checkpoint.

## Babylon.js rules

- Create engine and scene through explicit factories.
- Avoid hidden global `scene` or `engine` access.
- Anything that registers callbacks or observables must be disposable.
- Be careful with HMR/remount duplication.
- Dispose meshes, materials, textures, sounds, and listeners from the owning module.
- Keep asset paths build-safe for Vite.

## Code generation rules for agents

When generating code:

- Prefer TypeScript.
- Prefer one public class or factory per feature runtime object.
- Inject dependencies through constructors or factory parameters.
- Add `dispose()` to long-lived modules that own subscriptions or resources.
- Keep placeholders obvious and localized.
- Do not generate dead abstractions with no immediate use.

## Review rules for agents

Review in this order:

1. runtime correctness
2. lifecycle and cleanup
3. architecture boundaries
4. contracts and ownership
5. performance hotspots
6. maintainability

Review comments should be concrete and tied to files, functions, and data flow.

## Patch hygiene

- Keep naming aligned with ownership and responsibility.
- Avoid mixing refactors with behavior changes unless necessary for safety.
- Prefer small commits with clear messages.
- If a follow-up is needed, state it explicitly instead of partially implementing it.

## Testing guidance

Prioritize tests for:

- movement math
- cooldown/reload rules
- damage resolution
- spawn rules
- pure helper logic

Use smoke or integration checks for:

- bootstrap
- scene creation
- asset loading
- pointer lock flow
- firing integration

## Decision heuristics

Choose the simpler design when both options are correct.

Choose the more modular design when:
- the feature will clearly grow
- ownership is ambiguous
- lifecycle bugs are likely
- multiple systems would otherwise share mutable state

## Output expectations for AI agents

For non-trivial work, provide:

1. target slice
2. file plan
3. implementation
4. verification notes
5. remaining risks or next steps
