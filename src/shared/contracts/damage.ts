import type { Vector3 } from "@babylonjs/core";

export interface HitEvent {
  readonly damage: number;
  readonly hitPoint: Vector3;
  readonly hitNormal: Vector3;
  readonly sourceId: string;
}

export type DamageResult =
  | { readonly kind: "damaged"; readonly hp: number; readonly hpMax: number }
  | { readonly kind: "killed"; readonly overkill: number }
  | { readonly kind: "ignored"; readonly reason: "dead" | "invulnerable" };

export interface Damageable {
  readonly id: string;
  applyHit(hit: HitEvent): DamageResult;
}
