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
  stage(2, "ちいさな群れ", null, [
    s("basic", -4, 6.5),
    s("basic", 0, 5.5),
    s("basic", 4, 6.5),
    s("basic", -6, 11),
    s("basic", 6, 11),
  ]),
  stage(3, "走るちび", "突撃兵 — 高速で距離を詰めてくる", [
    s("basic", -4, 7),
    s("basic", 4, 7),
    s("runner", -2.5, 13),
    s("runner", 2.5, 13),
  ]),
  stage(4, "駆ける包囲", null, [
    s("basic", -5, 6.5),
    s("basic", 5, 6.5),
    s("runner", -3, 11),
    s("runner", 3, 11),
    s("runner", 0, 14),
  ]),
  stage(5, "遠くの狙い", "射撃兵 — 遠距離から撃ってくる", [
    s("basic", -3, 7),
    s("basic", 3, 7),
    s("sniper", -7, 15),
    s("sniper", 7, 15),
  ]),
  stage(6, "挟み撃ちの空", null, [
    s("basic", 0, 6),
    s("runner", -4.5, 10),
    s("runner", 4.5, 10),
    s("sniper", -8, 16),
    s("sniper", 8, 16),
  ]),
  stage(7, "鋼のちび", "重装兵 — 堅く重たい", [
    s("basic", -4, 7),
    s("basic", 4, 7),
    s("runner", 0, 11),
    s("tank", -2.5, 14),
    s("tank", 2.5, 14),
  ]),
  stage(8, "壁を越えて", null, [
    s("runner", -4, 7),
    s("runner", 4, 7),
    s("sniper", -9, 17),
    s("sniper", 9, 17),
    s("tank", -2, 13),
    s("tank", 2, 13),
  ]),
  stage(9, "重撃の嵐", "粉砕兵 — 一撃が重い", [
    s("basic", -3, 7),
    s("basic", 3, 7),
    s("bruiser", -5, 12),
    s("bruiser", 5, 12),
    s("sniper", 0, 17),
  ]),
  stage(10, "蹂躙の丘", null, [
    s("runner", -4, 7),
    s("runner", 4, 7),
    s("bruiser", -2, 12),
    s("bruiser", 2, 12),
    s("tank", 0, 16),
    s("sniper", -9, 17),
    s("sniper", 9, 17),
  ]),
  stage(11, "連射の雨", "速射兵 — 絶え間なく攻撃する", [
    s("basic", -3, 7),
    s("basic", 3, 7),
    s("rapid", -6, 11),
    s("rapid", 6, 11),
    s("rapid", 0, 14),
    s("sniper", -10, 18),
  ]),
  stage(12, "撃ち合う荒野", null, [
    s("rapid", -4, 7),
    s("rapid", 4, 7),
    s("rapid", 0, 10),
    s("bruiser", -6, 13),
    s("bruiser", 6, 13),
    s("tank", 0, 17),
  ]),
  stage(13, "疾風の夜", "疾風兵 — 超高速で追ってくる", [
    s("sprinter", -6, 10),
    s("sprinter", 6, 10),
    s("sprinter", 0, 14),
    s("sniper", -9, 18),
    s("sniper", 9, 18),
    s("bruiser", -3, 8),
    s("bruiser", 3, 8),
  ]),
  stage(14, "電光石火", null, [
    s("sprinter", -5, 9),
    s("sprinter", 5, 9),
    s("sprinter", -2, 14),
    s("sprinter", 2, 14),
    s("tank", 0, 18),
    s("rapid", -7, 11),
    s("rapid", 7, 11),
  ]),
  stage(15, "金色の誓い", "精鋭兵 — 高HPと高火力を兼ね備える", [
    s("rapid", -5, 8),
    s("rapid", 5, 8),
    s("sniper", -10, 18),
    s("sniper", 10, 18),
    s("elite", -3, 13),
    s("elite", 3, 13),
  ]),
  stage(16, "精兵の布陣", null, [
    s("elite", -4, 10),
    s("elite", 4, 10),
    s("elite", 0, 14),
    s("tank", -7, 16),
    s("tank", 7, 16),
    s("sprinter", -3, 7),
    s("sprinter", 3, 7),
  ]),
  stage(17, "漆黒の刃", "暗殺兵 と 爆裂兵 — 素早い一撃 / 接触で爆発する自爆兵", [
    s("assassin", -4, 9),
    s("assassin", 4, 9),
    s("assassin", 0, 13),
    s("bomber", -6, 14),
    s("bomber", 6, 14),
    s("sniper", -10, 18),
    s("sniper", 10, 18),
    s("elite", 0, 16),
  ]),
  stage(18, "影なき殺意", null, [
    s("assassin", -5, 9),
    s("assassin", 5, 9),
    s("assassin", -2, 13),
    s("assassin", 2, 13),
    s("bomber", -4, 16),
    s("bomber", 4, 16),
    s("elite", 0, 18),
    s("rapid", -7, 11),
    s("rapid", 7, 11),
  ]),
  stage(19, "王の降臨", "王将 — 圧倒的なHPと攻撃力を持つボス", [
    s("boss", 0, 16),
    s("sniper", -10, 18),
    s("sniper", 10, 18),
    s("assassin", -4, 9),
    s("assassin", 4, 9),
    s("assassin", 0, 11),
    s("bomber", -7, 13),
    s("bomber", 7, 13),
  ]),
  stage(20, "戴冠の戦場", null, [
    s("boss", 0, 17),
    s("elite", -5, 12),
    s("elite", 5, 12),
    s("assassin", -3, 8),
    s("assassin", 3, 8),
    s("bomber", -6, 14),
    s("bomber", 6, 14),
    s("sniper", -11, 19),
    s("sniper", 11, 19),
  ]),
  stage(21, "最終決戦", "二柱の王将と精鋭の軍団", [
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
