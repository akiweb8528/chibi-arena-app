# Review Checklist

Use this checklist for Babylon.js FPS reviews.

## 1. Runtime correctness

Check first.

- Is engine, scene, and render loop created exactly once per mount?
- Are async asset loads handled safely if the scene is disposed early?
- Are player movement and camera updates frame-rate aware?
- Does shooting honor cooldown, origin, direction, and timing contracts?
- Is hit detection using the correct coordinate space and ownership?
- Is state reset correct on restart or hot reload?

## 2. Architecture boundaries

- Is Babylon bootstrap isolated from gameplay logic?
- Are input, movement, combat, UI, and enemy systems separated?
- Do modules expose narrow APIs instead of shared mutable objects?
- Is scene wiring kept out of pure domain calculations?

## 3. Contracts and ownership

- Does each module clearly own its mutable state?
- Are preconditions and invariants obvious?
- Are return values explicit about success, failure, cooldown, or invalid state?
- Are mesh references leaking across unrelated modules?

## 4. Lifecycle and cleanup

- Are observables unsubscribed?
- Are DOM listeners removed?
- Are meshes, materials, textures, and sounds disposed by the owning module?
- Is there a clear shutdown order?

## 5. Performance risks

- Is per-frame allocation minimized in hot paths?
- Are repeated scene queries avoided?
- Are debug helpers accidentally left enabled?
- Is collision or raycast work scoped tightly?

## 6. Maintainability

- Can a new weapon or enemy type be added without editing many unrelated files?
- Are constants grouped by feature rather than scattered?
- Are file names aligned with responsibilities?
- Would another engineer know where to place the next mechanic?

## Review output format

Use this template.

### Summary

State overall health, primary risks, and whether the code is safe to extend.

### Critical issues

List only bugs, leaks, or contract violations that can break runtime behavior.

### Design issues

List architecture and maintainability concerns.

### Suggested refactor order

Give a low-risk sequence of changes, starting with fixes that unblock safe iteration.
