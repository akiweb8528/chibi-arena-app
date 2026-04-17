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
  isFiringAllowed(): boolean;
  events?: CombatEvents;
}

export function createCombatSystem(opts: CombatOptions): Disposable {
  const { canvas, player, enemies, weapon, isFiringAllowed, events } = opts;

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (document.pointerLockElement !== canvas) return;
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

  window.addEventListener("pointerdown", handlePointerDown);

  return {
    dispose() {
      window.removeEventListener("pointerdown", handlePointerDown);
    },
  };
}
