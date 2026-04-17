# Architecture Guide

## Goals

Build a browser FPS that stays easy to extend under frequent iteration.

Optimize for:

1. correctness during constant feature additions
2. local reasoning about bugs
3. clean cleanup and restart behavior in the browser
4. thin Babylon bindings around richer gameplay modules

## Recommended top-level structure

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
    progression/
  shared/
    contracts/
    events/
    math/
    utils/
```

## Ownership model

### Composition root

Own wiring only.

Responsibilities:
- create engine and canvas bindings
- create scene
- instantiate feature modules
- schedule update order
- dispose everything in reverse order

Do not store gameplay rules here.

### Core layer

Own engine-facing primitives.

Examples:
- engine bootstrap
- render loop
- scene factory
- asset loading service
- collision query adapter

Core may depend on Babylon heavily. Features may depend on core abstractions, but avoid coupling features to all of Babylon.

### Feature layer

Own gameplay behavior.

Examples:
- player movement state machine
- weapon cooldown and ammo policy
- enemy state and spawn rules
- HUD projection of game state

A feature can hold references to Babylon nodes it owns, but keep rules expressed in feature terms instead of raw engine terms whenever possible.

### Shared layer

Own reusable contracts and pure helpers.

Examples:
- result types
- ids
- vectors or math adapters when engine-neutral math is useful
- event payload definitions

## Contracts to define early

Define these before adding many mechanics:

### Update contract

```ts
interface Updatable {
  update(dt: number): void;
}
```

Invariant: `dt` is finite and positive.

### Disposable contract

```ts
interface Disposable {
  dispose(): void;
}
```

Every module that subscribes to observables, browser events, or owns Babylon resources must either implement this or return cleanup from a factory.

### Fire request contract

```ts
interface FireRequest {
  origin: Vector3Like;
  direction: Vector3Like;
  timestampMs: number;
}
```

This should not expose scene internals or mesh handles.

### Hit resolution contract

```ts
interface ResolvedHit {
  targetId: string;
  point: Vector3Like;
  normal: Vector3Like;
  distance: number;
}
```

Separate hit detection from damage application.

## FPS-specific module boundaries

### Player

Split into:
- input mapping
- movement controller
- camera rig
- player state

Avoid combining all of these in a single large class.

### Combat

Split into:
- weapon policy
- fire orchestration
- hit query adapter
- damage application
- feedback effects

Weapon policy should be testable without Babylon.

### Enemies

Split into:
- spawn service
- enemy controller
- perception or targeting
- enemy presentation bindings

### UI

Read authoritative state from features. Do not make UI the owner of gameplay truth.

## Babylon.js guardrails

- Centralize scene creation.
- Prefer explicit ownership of meshes, materials, sounds, and observables.
- Dispose resources deterministically.
- Avoid hidden global `scene` imports.
- Avoid attaching many anonymous observables that cannot be removed later.
- When using pointer lock, isolate browser API flow in one adapter.

## Testing guidance

Prioritize tests for pure or near-pure logic:

- acceleration and movement calculations
- recoil and spread math
- cooldown and reload rules
- damage and armor resolution
- spawn wave rules

Use thin integration tests for:

- scene bootstrap
- asset loading smoke checks
- pointer lock flow
- projectile or raycast integration

## Refactor triggers

Refactor when you notice:

- one class owning input, rendering, rules, and effects together
- feature modules reaching into each other's mutable fields
- gameplay depending on mesh names or scene lookups for business rules
- missing cleanup paths on restart or HMR
- large methods mixing queries, decisions, and rendering side effects
