# FPS Roadmap

Use this sequence unless the repository already has a coherent alternative.

## Phase 1: Playable shell

Goal: stand in a 3D scene and look around.

Deliver:
- Vite + Babylon bootstrap
- canvas mount and resize handling
- scene with light and floor
- camera rig
- pointer lock
- deterministic cleanup path

Checkpoint:
- user can open the page, enter pointer lock, and move the camera without leaks after reload

## Phase 2: Movement

Goal: basic FPS locomotion feels correct.

Deliver:
- input adapter
- move vector calculation
- walk, sprint, jump, gravity
- grounded checks
- movement tuning constants isolated from controller wiring

Checkpoint:
- user can traverse a test map with stable movement

## Phase 3: Shooting loop

Goal: press input and resolve a hit.

Deliver:
- weapon policy and cooldown
- raycast or projectile query adapter
- hit result contract
- debug feedback for hit and miss

Checkpoint:
- player can fire and see visible feedback on target contact

## Phase 4: Damage and health

Goal: shooting affects entities through explicit rules.

Deliver:
- damageable contract
- health model
- damage application service
- death event or disable flow

Checkpoint:
- target can be damaged and removed or marked defeated correctly

## Phase 5: Enemies

Goal: enemies make the combat loop meaningful.

Deliver:
- enemy spawn system
- simple enemy state machine
- basic pursuit or firing behavior
- health integration

Checkpoint:
- one enemy type can spawn, chase, and be defeated

## Phase 6: Feedback and UI

Goal: the game communicates state clearly.

Deliver:
- HUD for ammo, health, crosshair
- damage feedback
- muzzle flash, impact decals, audio hooks

Checkpoint:
- player can understand combat state without reading logs

## Phase 7: Content and hardening

Goal: move from prototype to repeatable gameplay.

Deliver:
- wave or level progression
- pickups or weapon switching
- settings menu
- performance pass
- deployment smoke test

Checkpoint:
- several full rounds can be played in-browser with acceptable performance
