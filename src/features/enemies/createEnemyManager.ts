import { type Ray, type Scene, Vector3 } from "@babylonjs/core";
import type { DamageResult } from "@/shared/contracts/damage";
import type { Disposable } from "@/shared/contracts/Disposable";
import { type ChibiPalette, DEFAULT_PALETTES } from "./createChibiCharacter";
import {
  createEnemy,
  type EnemyAttackEvent,
  type EnemyHandle,
  type EnemySpec,
} from "./createEnemy";

export interface EnemyManagerEvents {
  onEnemyKilled(remainingAlive: number): void;
  onEnemyAttack(event: EnemyAttackEvent): void;
}

export interface EnemySpawn {
  readonly position: Vector3;
  readonly facingY: number;
  readonly spec?: EnemySpec;
  readonly palette?: ChibiPalette;
  readonly scale?: number;
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
  attackKind: "melee",
};

export function createEnemyManager(
  scene: Scene,
  spawns: readonly EnemySpawn[],
  events: EnemyManagerEvents,
  defaultSpec: EnemySpec = DEFAULT_SPEC,
): EnemyManager {
  const enemies: EnemyHandle[] = [];
  const meshIdToEnemy = new Map<number, EnemyHandle>();
  let aliveCount = 0;

  spawns.forEach((spawn, i) => {
    const id = `chibi-${i}`;
    const palette =
      spawn.palette ?? DEFAULT_PALETTES[i % DEFAULT_PALETTES.length]!;
    const enemy = createEnemy({
      scene,
      id,
      palette,
      position: spawn.position,
      facingY: spawn.facingY,
      spec: spawn.spec ?? defaultSpec,
      scale: spawn.scale,
      callbacks: {
        onAttack(event) {
          events.onEnemyAttack(event);
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
