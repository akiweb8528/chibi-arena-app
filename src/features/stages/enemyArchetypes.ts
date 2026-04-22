import { Color3 } from "@babylonjs/core";
import type { ChibiPalette } from "@/features/enemies/createChibiCharacter";
import type { EnemySpec } from "@/features/enemies/createEnemy";

export type ArchetypeId =
  | "basic"
  | "runner"
  | "sniper"
  | "tank"
  | "bruiser"
  | "rapid"
  | "sprinter"
  | "elite"
  | "assassin"
  | "boss"
  | "bomber";

export interface EnemyArchetype {
  readonly id: ArchetypeId;
  readonly label: string;
  readonly spec: EnemySpec;
  readonly palette: ChibiPalette;
  readonly scale: number;
}

interface PaletteParts {
  skin: string;
  hair: string;
  clothesTop: string;
  clothesBottom: string;
  accent: string;
}

function palette(p: PaletteParts): ChibiPalette {
  return {
    skin: Color3.FromHexString(p.skin),
    hair: Color3.FromHexString(p.hair),
    clothesTop: Color3.FromHexString(p.clothesTop),
    clothesBottom: Color3.FromHexString(p.clothesBottom),
    accent: Color3.FromHexString(p.accent),
  };
}

export const ARCHETYPES: Readonly<Record<ArchetypeId, EnemyArchetype>> = {
  basic: {
    id: "basic",
    label: "通常兵",
    scale: 1,
    spec: {
      maxHp: 3,
      moveSpeed: 2.2,
      detectRange: 24,
      attackRange: 1.35,
      attackDamage: 12,
      attackCooldownMs: 900,
      attackKind: "melee",
    },
    palette: palette({
      skin: "#ffe0c4",
      hair: "#2c2733",
      clothesTop: "#ff6f91",
      clothesBottom: "#4466aa",
      accent: "#ffcf4d",
    }),
  },
  runner: {
    id: "runner",
    label: "突撃兵",
    scale: 0.95,
    spec: {
      maxHp: 2,
      moveSpeed: 4.0,
      detectRange: 28,
      attackRange: 1.35,
      attackDamage: 10,
      attackCooldownMs: 850,
      attackKind: "melee",
    },
    palette: palette({
      skin: "#ffd6b5",
      hair: "#ff5b3b",
      clothesTop: "#ff8a45",
      clothesBottom: "#5c1f10",
      accent: "#fff4a0",
    }),
  },
  sniper: {
    id: "sniper",
    label: "射撃兵",
    scale: 0.95,
    spec: {
      maxHp: 2,
      moveSpeed: 1.5,
      detectRange: 42,
      attackRange: 9.0,
      attackDamage: 15,
      attackCooldownMs: 1400,
      attackKind: "ranged",
    },
    palette: palette({
      skin: "#f5e1cf",
      hair: "#321b55",
      clothesTop: "#6c3ad0",
      clothesBottom: "#211634",
      accent: "#ff4fa8",
    }),
  },
  tank: {
    id: "tank",
    label: "重装兵",
    scale: 1.25,
    spec: {
      maxHp: 8,
      moveSpeed: 1.4,
      detectRange: 22,
      attackRange: 1.6,
      attackDamage: 18,
      attackCooldownMs: 1200,
      attackKind: "melee",
    },
    palette: palette({
      skin: "#e3d7c8",
      hair: "#3a3a3a",
      clothesTop: "#5a6370",
      clothesBottom: "#2f333c",
      accent: "#9da6b4",
    }),
  },
  bruiser: {
    id: "bruiser",
    label: "粉砕兵",
    scale: 1.15,
    spec: {
      maxHp: 4,
      moveSpeed: 2.4,
      detectRange: 26,
      attackRange: 1.6,
      attackDamage: 25,
      attackCooldownMs: 1000,
      attackKind: "melee",
    },
    palette: palette({
      skin: "#ffd0b0",
      hair: "#3b0d0d",
      clothesTop: "#a61e1e",
      clothesBottom: "#2a0808",
      accent: "#ffc04a",
    }),
  },
  rapid: {
    id: "rapid",
    label: "速射兵",
    scale: 0.95,
    spec: {
      maxHp: 3,
      moveSpeed: 2.6,
      detectRange: 24,
      attackRange: 1.35,
      attackDamage: 8,
      attackCooldownMs: 420,
      attackKind: "melee",
    },
    palette: palette({
      skin: "#fff0cf",
      hair: "#ffbd2e",
      clothesTop: "#fff170",
      clothesBottom: "#6a5418",
      accent: "#ff8a8a",
    }),
  },
  sprinter: {
    id: "sprinter",
    label: "疾風兵",
    scale: 0.9,
    spec: {
      maxHp: 3,
      moveSpeed: 5.5,
      detectRange: 42,
      attackRange: 1.35,
      attackDamage: 14,
      attackCooldownMs: 800,
      attackKind: "melee",
    },
    palette: palette({
      skin: "#e5efff",
      hair: "#9ef0ff",
      clothesTop: "#37cfff",
      clothesBottom: "#0e5070",
      accent: "#e0ff63",
    }),
  },
  elite: {
    id: "elite",
    label: "精鋭兵",
    scale: 1.15,
    spec: {
      maxHp: 10,
      moveSpeed: 2.6,
      detectRange: 28,
      attackRange: 1.5,
      attackDamage: 20,
      attackCooldownMs: 900,
      attackKind: "melee",
    },
    palette: palette({
      skin: "#fff4d2",
      hair: "#ffd146",
      clothesTop: "#f0b000",
      clothesBottom: "#3a2a00",
      accent: "#ffffff",
    }),
  },
  assassin: {
    id: "assassin",
    label: "暗殺兵",
    scale: 0.95,
    spec: {
      maxHp: 5,
      moveSpeed: 4.5,
      detectRange: 32,
      attackRange: 1.4,
      attackDamage: 22,
      attackCooldownMs: 700,
      attackKind: "melee",
    },
    palette: palette({
      skin: "#d8c9c3",
      hair: "#0a0a12",
      clothesTop: "#14141f",
      clothesBottom: "#050508",
      accent: "#ff2a6d",
    }),
  },
  boss: {
    id: "boss",
    label: "王将",
    scale: 1.55,
    spec: {
      maxHp: 30,
      moveSpeed: 2.0,
      detectRange: 55,
      attackRange: 2.2,
      attackDamage: 28,
      attackCooldownMs: 1100,
      attackKind: "melee",
    },
    palette: palette({
      skin: "#c8bfcb",
      hair: "#6e0000",
      clothesTop: "#3a0030",
      clothesBottom: "#190018",
      accent: "#ffcf4d",
    }),
  },
  bomber: {
    id: "bomber",
    label: "爆裂兵",
    scale: 1.0,
    spec: {
      maxHp: 2,
      moveSpeed: 3.2,
      detectRange: 30,
      attackRange: 1.9,
      attackDamage: 45,
      attackCooldownMs: 1,
      attackKind: "explosive",
      explosionRadius: 2.3,
    },
    palette: palette({
      skin: "#ffe3c0",
      hair: "#ffd700",
      clothesTop: "#ff2a0a",
      clothesBottom: "#331000",
      accent: "#ffff00",
    }),
  },
};
