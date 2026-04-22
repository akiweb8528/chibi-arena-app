import { Vector3 } from "@babylonjs/core";
import type { ArchetypeId } from "./enemyArchetypes";

export interface StageSpawn {
  readonly archetype: ArchetypeId;
  readonly position: Vector3;
  readonly facingY: number;
}

export interface StageDef {
  readonly number: number;
  readonly name: string;
  readonly newElement: string | null;
  readonly spawns: readonly StageSpawn[];
  readonly playerSpawn: Vector3;
}

const PLAYER_SPAWN = new Vector3(0, 1.65, -6);

function s(archetype: ArchetypeId, x: number, z: number): StageSpawn {
  const facing = Math.atan2(PLAYER_SPAWN.x - x, PLAYER_SPAWN.z - z);
  return {
    archetype,
    position: new Vector3(x, 0, z),
    facingY: facing,
  };
}

function stage(
  number: number,
  name: string,
  newElement: string | null,
  spawns: readonly StageSpawn[],
): StageDef {
  return { number, name, newElement, spawns, playerSpawn: PLAYER_SPAWN };
}

export const STAGES: readonly StageDef[] = [
  stage(1, "はじまりの野", null, [
    s("basic", 0, 6),
    s("basic", -3.2, 8),
    s("basic", 3.2, 8),
  ]),
  stage(2, "遠くの狙い", "射撃兵 — 遠距離から撃ってくる", [
    s("basic", -3, 7),
    s("basic", 3, 7),
    s("sniper", -7, 15),
    s("sniper", 7, 15),
  ]),
  stage(3, "重撃の嵐", "粉砕兵 — 一撃が重い", [
    s("basic", -3, 7),
    s("basic", 3, 7),
    s("bruiser", -5, 12),
    s("bruiser", 5, 12),
    s("sniper", 0, 17),
  ]),
  stage(4, "疾風の夜", "疾風兵 — 超高速で追ってくる", [
    s("sprinter", -6, 10),
    s("sprinter", 6, 10),
    s("sprinter", 0, 14),
    s("sniper", -9, 18),
    s("sniper", 9, 18),
    s("bruiser", -3, 8),
    s("bruiser", 3, 8),
  ]),
  stage(5, "王の降臨", "王将 — 圧倒的なHPと攻撃力を持つボス", [
    s("boss", 0, 16),
    s("sniper", -10, 18),
    s("sniper", 10, 18),
    s("assassin", -4, 9),
    s("assassin", 4, 9),
    s("assassin", 0, 11),
    s("bomber", -7, 13),
    s("bomber", 7, 13),
  ]),
  stage(6, "最終決戦", "二柱の王将と精鋭の軍団", [
    s("boss", -5, 16),
    s("boss", 5, 16),
    s("assassin", -4, 9),
    s("assassin", 0, 10),
    s("assassin", 4, 9),
    s("sprinter", -8, 12),
    s("sprinter", 8, 12),
    s("sprinter", 0, 13),
    s("bomber", -3, 14),
    s("bomber", 3, 14),
    s("sniper", -12, 20),
    s("sniper", 12, 20),
  ]),
];
