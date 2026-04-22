import type {
  Damageable,
  DamageResult,
  HitEvent,
} from "@/shared/contracts/damage";

export interface PlayerAgentSpec {
  readonly maxHp: number;
  readonly invulnerableMs: number;
}

export interface PlayerAgent extends Damageable {
  readonly hp: number;
  readonly hpMax: number;
  readonly isAlive: boolean;
  tick(dt: number): void;
  takeDamage(amount: number): DamageResult;
  reset(): void;
}

export function createPlayerAgent(spec: PlayerAgentSpec): PlayerAgent {
  let hp = spec.maxHp;
  let invulnerableSecs = 0;

  const takeDamage = (amount: number): DamageResult => {
    if (hp <= 0) return { kind: "ignored", reason: "dead" };
    if (invulnerableSecs > 0) return { kind: "ignored", reason: "invulnerable" };
    const absorbed = Math.max(0, amount);
    hp = Math.max(0, hp - absorbed);
    invulnerableSecs = spec.invulnerableMs / 1000;
    if (hp <= 0) return { kind: "killed", overkill: absorbed };
    return { kind: "damaged", hp, hpMax: spec.maxHp };
  };

  const applyHit = (hit: HitEvent): DamageResult => takeDamage(hit.damage);

  return {
    id: "player",
    get hp() {
      return hp;
    },
    get hpMax() {
      return spec.maxHp;
    },
    get isAlive() {
      return hp > 0;
    },
    tick(dt) {
      if (dt > 0) invulnerableSecs = Math.max(0, invulnerableSecs - dt);
    },
    takeDamage,
    applyHit,
    reset() {
      hp = spec.maxHp;
      invulnerableSecs = 0;
    },
  };
}
