import { type Ray, type Scene, Vector3 } from "@babylonjs/core";
import type { DamageResult } from "@/shared/contracts/damage";
import type { Disposable } from "@/shared/contracts/Disposable";
import { DEFAULT_PALETTES } from "./createChibiCharacter";
import { createEnemy, type EnemyHandle, type EnemySpec } from "./createEnemy";

export interface EnemyManagerEvents {
  onEnemyKilled(remainingAlive: number): void;
  onPlayerAttacked(damage: number): void;
}

export interface EnemySpawn {
  readonly position: Vector3;
  readonly facingY: number;
}

export interface EnemyManager extends Disposable {
  readonly totalCount: number;
  readonly aliveCount: number;
  tryHitAlongRay(
    ray: Ray,
    request: { damage: number; sourceId: string },
  ): DamageResult | null;
  update(dt: number, playerPos: Vector3): void;
}

const DEFAULT_SPEC: EnemySpec = {
  maxHp: 3,
  moveSpeed: 2.2,
  detectRange: 24,
  attackRange: 1.35,
  attackDamage: 12,
  attackCooldownMs: 900,
};

export function createEnemyManager(
  scene: Scene,
  spawns: readonly EnemySpawn[],
  events: EnemyManagerEvents,
  spec: EnemySpec = DEFAULT_SPEC,
): EnemyManager {
  const enemies: EnemyHandle[] = [];
  const meshIdToEnemy = new Map<number, EnemyHandle>();
  let aliveCount = 0;

  spawns.forEach((spawn, i) => {
    const id = `chibi-${i}`;
    const enemy = createEnemy({
      scene,
      id,
      palette: DEFAULT_PALETTES[i % DEFAULT_PALETTES.length]!,
      position: spawn.position,
      facingY: spawn.facingY,
      spec,
      callbacks: {
        onAttack(damage) {
          events.onPlayerAttacked(damage);
        },
        onKilled() {
          aliveCount -= 1;
          events.onEnemyKilled(aliveCount);
        },
      },
    });
    enemies.push(enemy);
    aliveCount += 1;
    for (const mesh of enemy.pickMeshes) {
      meshIdToEnemy.set(mesh.uniqueId, enemy);
    }
  });

  const isEnemyMesh = (uniqueId: number): EnemyHandle | undefined => {
    const e = meshIdToEnemy.get(uniqueId);
    if (!e || !e.isAlive) return undefined;
    return e;
  };

  return {
    get totalCount() {
      return enemies.length;
    },
    get aliveCount() {
      return aliveCount;
    },
    tryHitAlongRay(ray, req) {
      const pick = scene.pickWithRay(ray, (mesh) => !!isEnemyMesh(mesh.uniqueId));
      if (!pick || !pick.hit || !pick.pickedMesh) return null;
      const enemy = isEnemyMesh(pick.pickedMesh.uniqueId);
      if (!enemy) return null;
      const normal = pick.getNormal(true) ?? new Vector3(0, 1, 0);
      return enemy.applyHit({
        damage: req.damage,
        hitPoint: pick.pickedPoint ?? enemy.getPosition(),
        hitNormal: normal,
        sourceId: req.sourceId,
      });
    },
    update(dt, playerPos) {
      for (const e of enemies) e.update(dt, playerPos);
    },
    dispose() {
      for (const e of enemies) e.dispose();
      enemies.length = 0;
      meshIdToEnemy.clear();
    },
  };
}
