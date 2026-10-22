export interface WeaponSpec {
  readonly damage: number;
  readonly cooldownMs: number;
  readonly rangeMeters: number;
}

export interface WeaponHandle {
  readonly spec: WeaponSpec;
  tryFire(nowMs: number): boolean;
  reset(): void;
}

export function createWeapon(spec: WeaponSpec): WeaponHandle {
  let lastFireMs = Number.NEGATIVE_INFINITY;

  return {
    spec,
    tryFire(nowMs) {
      if (nowMs - lastFireMs < spec.cooldownMs) return false;
      lastFireMs = nowMs;
      return true;
    },
    reset() {
      lastFireMs = Number.NEGATIVE_INFINITY;
    },
  };
}
