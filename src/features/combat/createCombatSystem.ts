import type { PlayerHandle } from "@/features/player/createPlayer";
import type { EnemyManager } from "@/features/enemies/createEnemyManager";
import type { DamageResult } from "@/shared/contracts/damage";
import type { Disposable } from "@/shared/contracts/Disposable";
import type { WeaponHandle } from "./createWeapon";

export interface CombatEvents {
  onHitLanded?(result: DamageResult): void;
  onShotFired?(): void;
  onMiss?(): void;
}

export interface CombatOptions {
  canvas: HTMLCanvasElement;
  player: PlayerHandle;
  enemies: EnemyManager;
  weapon: WeaponHandle;
  fireButton?: HTMLElement;
  isFiringAllowed(): boolean;
  events?: CombatEvents;
}

export function createCombatSystem(opts: CombatOptions): Disposable {
  const {
    canvas,
    player,
    enemies,
    weapon,
    fireButton,
    isFiringAllowed,
    events,
  } = opts;

  let touchTap:
    | {
        pointerId: number;
        startX: number;
        startY: number;
        startMs: number;
        moved: boolean;
      }
    | null = null;

  const tryFire = (): void => {
    if (!isFiringAllowed()) return;

    const now = performance.now();
    if (!weapon.tryFire(now)) return;
    events?.onShotFired?.();

    const ray = player.camera.getForwardRay(weapon.spec.rangeMeters);
    const result = enemies.tryHitAlongRay(ray, {
      damage: weapon.spec.damage,
      sourceId: "player",
    });
    if (result) events?.onHitLanded?.(result);
    else events?.onMiss?.();
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || e.pointerType !== "mouse") return;
    if (document.pointerLockElement !== canvas) return;
    tryFire();
  };

  const handleFireButtonPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    tryFire();
  };

  const handleCanvasPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 || e.pointerType === "mouse") return;
    const rect = canvas.getBoundingClientRect();
    if (e.clientX < rect.left + rect.width * 0.42) return;

    touchTap = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startMs: performance.now(),
      moved: false,
    };
  };

  const handleCanvasPointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== touchTap?.pointerId) return;
    const movement = Math.hypot(e.clientX - touchTap.startX, e.clientY - touchTap.startY);
    if (movement > 14) touchTap.moved = true;
  };

  const handleCanvasPointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== touchTap?.pointerId) return;
    const elapsedMs = performance.now() - touchTap.startMs;
    const shouldFire = !touchTap.moved && elapsedMs <= 280;
    touchTap = null;
    if (shouldFire) tryFire();
  };

  const handleCanvasPointerCancel = (e: PointerEvent): void => {
    if (e.pointerId === touchTap?.pointerId) touchTap = null;
  };

  window.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointerdown", handleCanvasPointerDown);
  canvas.addEventListener("pointermove", handleCanvasPointerMove);
  canvas.addEventListener("pointerup", handleCanvasPointerUp);
  canvas.addEventListener("pointercancel", handleCanvasPointerCancel);
  fireButton?.addEventListener("pointerdown", handleFireButtonPointerDown);

  return {
    dispose() {
      window.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerdown", handleCanvasPointerDown);
      canvas.removeEventListener("pointermove", handleCanvasPointerMove);
      canvas.removeEventListener("pointerup", handleCanvasPointerUp);
      canvas.removeEventListener("pointercancel", handleCanvasPointerCancel);
      fireButton?.removeEventListener("pointerdown", handleFireButtonPointerDown);
    },
  };
}
