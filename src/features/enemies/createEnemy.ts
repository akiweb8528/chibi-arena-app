import { type AbstractMesh, type Scene, Vector3 } from "@babylonjs/core";
import {
  type ChibiPalette,
  createChibiCharacter,
} from "./createChibiCharacter";
import type {
  Damageable,
  DamageResult,
  HitEvent,
} from "@/shared/contracts/damage";
import type { Disposable } from "@/shared/contracts/Disposable";

export type EnemyPhase = "idle" | "chasing" | "attacking" | "dead";

export interface EnemySpec {
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly detectRange: number;
  readonly attackRange: number;
  readonly attackDamage: number;
  readonly attackCooldownMs: number;
}

export interface EnemyCallbacks {
  onAttack(damage: number): void;
  onKilled(): void;
}

export interface EnemyOptions {
  scene: Scene;
  id: string;
  palette: ChibiPalette;
  position: Vector3;
  facingY: number;
  spec: EnemySpec;
  callbacks: EnemyCallbacks;
}

export interface EnemyHandle extends Disposable, Damageable {
  readonly isAlive: boolean;
  readonly phase: EnemyPhase;
  readonly pickMeshes: readonly AbstractMesh[];
  getPosition(): Vector3;
  update(dt: number, playerPos: Vector3): void;
}

export function createEnemy(opts: EnemyOptions): EnemyHandle {
  const { scene, id, palette, position, facingY, spec, callbacks } = opts;

  const chibi = createChibiCharacter({
    scene,
    name: id,
    palette,
    position,
    facingY,
  });

  let hp = spec.maxHp;
  let phase: EnemyPhase = "idle";
  let attackCooldownSecs = 0;

  const toPlayer = new Vector3();

  const applyHit = (hit: HitEvent): DamageResult => {
    if (phase === "dead") return { kind: "ignored", reason: "dead" };
    hp -= hit.damage;
    chibi.flashDamage(160);
    if (hp <= 0) {
      phase = "dead";
      chibi.setVisible(false);
      callbacks.onKilled();
      return { kind: "killed", overkill: -hp };
    }
    return { kind: "damaged", hp, hpMax: spec.maxHp };
  };

  return {
    id,
    get isAlive() {
      return phase !== "dead";
    },
    get phase() {
      return phase;
    },
    get pickMeshes() {
      return chibi.pickMeshes;
    },
    applyHit,
    getPosition() {
      return chibi.root.position;
    },
    update(dt, playerPos) {
      if (phase === "dead" || dt <= 0) return;

      attackCooldownSecs = Math.max(0, attackCooldownSecs - dt);

      toPlayer.copyFrom(playerPos).subtractInPlace(chibi.root.position);
      toPlayer.y = 0;
      const dist = toPlayer.length();

      if (dist > 0.0001) {
        chibi.root.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
      }

      if (dist < spec.attackRange) {
        phase = "attacking";
        if (attackCooldownSecs === 0) {
          callbacks.onAttack(spec.attackDamage);
          attackCooldownSecs = spec.attackCooldownMs / 1000;
        }
        return;
      }

      if (dist < spec.detectRange) {
        phase = "chasing";
        const stepLen = spec.moveSpeed * dt;
        if (dist > 0.0001) {
          const inv = 1 / dist;
          chibi.root.position.x += toPlayer.x * inv * stepLen;
          chibi.root.position.z += toPlayer.z * inv * stepLen;
        }
        return;
      }

      phase = "idle";
    },
    dispose() {
      chibi.dispose();
    },
  };
}
