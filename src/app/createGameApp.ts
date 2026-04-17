import { Vector3 } from "@babylonjs/core";
import { createEngine } from "@/core/engine/createEngine";
import { createScene } from "@/core/scene/createScene";
import { createPlayer } from "@/features/player/createPlayer";
import { createPlayerAgent } from "@/features/player/createPlayerAgent";
import {
  createEnemyManager,
  type EnemySpawn,
} from "@/features/enemies/createEnemyManager";
import { createWeapon } from "@/features/combat/createWeapon";
import { createCombatSystem } from "@/features/combat/createCombatSystem";
import { createHud, resolveHudElements } from "@/features/ui/createHud";
import type { Disposable } from "@/shared/contracts/Disposable";

export interface GameAppOptions {
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
}

export interface GameApp extends Disposable {
  start(): void;
}

type EndState = null | "victory" | "defeat";

const ENEMY_SPAWNS: readonly EnemySpawn[] = [
  { position: new Vector3(0, 0, 6), facingY: Math.PI },
  { position: new Vector3(-3.2, 0, 8), facingY: Math.PI - 0.28 },
  { position: new Vector3(3.2, 0, 8), facingY: Math.PI + 0.28 },
  { position: new Vector3(-6.2, 0, 11.5), facingY: Math.PI - 0.18 },
  { position: new Vector3(6.2, 0, 11.5), facingY: Math.PI + 0.18 },
];

export function createGameApp(opts: GameAppOptions): GameApp {
  const { canvas, overlay } = opts;

  const engineHandle = createEngine(canvas);
  const sceneHandle = createScene(engineHandle.engine);
  const player = createPlayer({
    scene: sceneHandle.scene,
    canvas,
    spawn: new Vector3(0, 1.65, -6),
  });
  const playerAgent = createPlayerAgent({ maxHp: 100, invulnerableMs: 350 });

  const hud = createHud(resolveHudElements());

  let endState: EndState = null;

  const enemyManager = createEnemyManager(sceneHandle.scene, ENEMY_SPAWNS, {
    onEnemyKilled(remaining) {
      const eliminated = enemyManager.totalCount - remaining;
      hud.setKillProgress(eliminated, enemyManager.totalCount);
    },
    onPlayerAttacked(damage) {
      if (endState) return;
      const result = playerAgent.takeDamage(damage);
      if (result.kind === "damaged" || result.kind === "killed") {
        hud.flashDamage();
        hud.setHp(playerAgent.hp, playerAgent.hpMax);
      }
    },
  });

  const weapon = createWeapon({ damage: 1, cooldownMs: 160, rangeMeters: 60 });

  const combat = createCombatSystem({
    canvas,
    player,
    enemies: enemyManager,
    weapon,
    isFiringAllowed: () => endState === null && playerAgent.isAlive,
    events: {
      onHitLanded(result) {
        if (result.kind === "damaged" || result.kind === "killed") {
          hud.flashHitMarker();
        }
      },
    },
  });

  sceneHandle.scene.activeCamera = player.camera;

  hud.setHp(playerAgent.hp, playerAgent.hpMax);
  hud.setKillProgress(0, enemyManager.totalCount);

  const finishGame = (kind: "victory" | "defeat") => {
    if (endState) return;
    endState = kind;
    player.setActive(false);
    hud.showEnd(kind, "R キーでリスタート");
    overlay.classList.add("hidden");
    if (document.exitPointerLock) document.exitPointerLock();
  };

  const requestLock = () => {
    if (endState) return;
    overlay.classList.add("hidden");
    if (canvas.requestPointerLock) canvas.requestPointerLock();
  };
  const onOverlayKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      requestLock();
    }
  };
  const onPointerLockChange = () => {
    if (document.pointerLockElement !== canvas) {
      if (!endState) overlay.classList.remove("hidden");
    }
  };
  const onWindowKeyDown = (e: KeyboardEvent) => {
    if (endState && (e.key === "r" || e.key === "R")) {
      window.location.reload();
    }
  };

  overlay.addEventListener("click", requestLock);
  overlay.addEventListener("keydown", onOverlayKey);
  document.addEventListener("pointerlockchange", onPointerLockChange);
  window.addEventListener("keydown", onWindowKeyDown);

  let started = false;
  let lastTime = 0;

  return {
    start() {
      if (started) return;
      started = true;
      lastTime = performance.now();
      engineHandle.runRenderLoop(() => {
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;

        if (!endState) {
          playerAgent.tick(dt);
          if (playerAgent.isAlive) {
            player.update(dt);
            enemyManager.update(dt, player.getPosition());
          }
          if (!playerAgent.isAlive) {
            finishGame("defeat");
          } else if (enemyManager.aliveCount === 0) {
            finishGame("victory");
          }
        }

        sceneHandle.scene.render();
      });
    },
    dispose() {
      overlay.removeEventListener("click", requestLock);
      overlay.removeEventListener("keydown", onOverlayKey);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      window.removeEventListener("keydown", onWindowKeyDown);
      combat.dispose();
      enemyManager.dispose();
      hud.dispose();
      player.dispose();
      sceneHandle.dispose();
      engineHandle.dispose();
    },
  };
}
