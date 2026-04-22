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

export type AttackKind = "melee" | "ranged" | "explosive";

export interface EnemySpec {
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly detectRange: number;
  readonly attackRange: number;
  readonly attackDamage: number;
  readonly attackCooldownMs: number;
  readonly attackKind: AttackKind;
  readonly explosionRadius?: number;
}

export interface EnemyAttackEvent {
  readonly damage: number;
  readonly kind: AttackKind;
  readonly origin: Vector3;
  readonly target: Vector3;
  readonly explosionRadius?: number;
}

export interface EnemyCallbacks {
  onAttack(event: EnemyAttackEvent): void;
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
  scale?: number;
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
    scale: opts.scale,
    hasGun: spec.attackKind === "ranged",
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
    chibi.setHpBar(true, hp / spec.maxHp);
    return { kind: "damaged", hp, hpMax: spec.maxHp };
  };

  const chestOffset = new Vector3(0, 0.9, 0);

  const computeOrigin = (): Vector3 => {
    if (spec.attackKind === "ranged") {
      const muzzle = chibi.getMuzzleWorldPosition();
      if (muzzle) return muzzle;
    }
    return chibi.root.position.add(chestOffset);
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
          const origin = computeOrigin();
          callbacks.onAttack({
            damage: spec.attackDamage,
            kind: spec.attackKind,
            origin,
            target: playerPos.clone(),
            explosionRadius: spec.explosionRadius,
          });
          attackCooldownSecs = spec.attackCooldownMs / 1000;
          if (spec.attackKind === "explosive") {
            phase = "dead";
            chibi.setVisible(false);
            callbacks.onKilled();
          }
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
