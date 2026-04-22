import { createEngine } from "@/core/engine/createEngine";
import { createScene } from "@/core/scene/createScene";
import { createPlayer } from "@/features/player/createPlayer";
import { createPlayerAgent } from "@/features/player/createPlayerAgent";
import {
  createEnemyManager,
  type EnemyManager,
  type EnemySpawn,
} from "@/features/enemies/createEnemyManager";
import type { EnemyAttackEvent } from "@/features/enemies/createEnemy";
import { createWeapon } from "@/features/combat/createWeapon";
import { createCombatSystem } from "@/features/combat/createCombatSystem";
import { createEffects } from "@/features/combat/createEffects";
import { createHud, resolveHudElements } from "@/features/ui/createHud";
import { ARCHETYPES } from "@/features/stages/enemyArchetypes";
import {
  STAGES,
  type StageDef,
} from "@/features/stages/stageDefinitions";
import type { Disposable } from "@/shared/contracts/Disposable";

export interface GameAppOptions {
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
}

export interface GameApp extends Disposable {
  start(): void;
}

type PhaseTag =
  | { kind: "playing" }
  | { kind: "stageCleared"; nextIndex: number }
  | { kind: "gameCleared" }
  | { kind: "defeated"; stageIndex: number };

export function createGameApp(opts: GameAppOptions): GameApp {
  const { canvas, overlay } = opts;

  const engineHandle = createEngine(canvas);
  const sceneHandle = createScene(engineHandle.engine);

  const firstStage = STAGES[0]!;
  const player = createPlayer({
    scene: sceneHandle.scene,
    canvas,
    spawn: firstStage.playerSpawn,
  });
  const playerAgent = createPlayerAgent({ maxHp: 100, invulnerableMs: 350 });

  const hud = createHud(resolveHudElements());
  const weapon = createWeapon({ damage: 1, cooldownMs: 160, rangeMeters: 60 });
  const effects = createEffects(sceneHandle.scene);

  sceneHandle.scene.activeCamera = player.camera;

  let stageIndex = 0;
  let phase: PhaseTag = { kind: "playing" };
  let enemyManager: EnemyManager | null = null;
  let combat: Disposable | null = null;

  const isPaused = (): boolean =>
    phase.kind !== "playing" || !overlay.classList.contains("hidden");

  const buildSpawnsFor = (stage: StageDef): EnemySpawn[] =>
    stage.spawns.map((sp, i) => {
      const arche = ARCHETYPES[sp.archetype];
      const appearance =
        arche.appearances[(stage.number + i) % arche.appearances.length];
      return {
        position: sp.position,
        facingY: sp.facingY,
        spec: arche.spec,
        palette: arche.palette,
        appearance,
        scale: arche.scale,
      };
    });

  const handleEnemyAttack = (event: EnemyAttackEvent): void => {
    if (phase.kind !== "playing") return;

    switch (event.kind) {
      case "ranged":
        effects.muzzleFlash(event.origin);
        effects.tracerBeam(event.origin, event.target);
        break;
      case "explosive":
        effects.explodeAt(event.origin, event.explosionRadius ?? 2);
        break;
      case "melee":
        break;
    }

    const result = playerAgent.takeDamage(event.damage);
    if (result.kind === "damaged" || result.kind === "killed") {
      hud.flashDamage();
      hud.setHp(playerAgent.hp, playerAgent.hpMax);
    }
  };

  const loadStage = (index: number): void => {
    enemyManager?.dispose();
    combat?.dispose();
    enemyManager = null;
    combat = null;
    effects.clear();

    stageIndex = index;
    const stage = STAGES[index]!;

    playerAgent.reset();
    player.resetTo(stage.playerSpawn);
    player.setActive(true);

    const mgr = createEnemyManager(sceneHandle.scene, buildSpawnsFor(stage), {
      onEnemyKilled(remaining) {
        if (!enemyManager) return;
        const eliminated = enemyManager.totalCount - remaining;
        hud.setKillProgress(eliminated, enemyManager.totalCount);
      },
      onEnemyAttack: handleEnemyAttack,
    });
    enemyManager = mgr;

    combat = createCombatSystem({
      canvas,
      player,
      enemies: mgr,
      weapon,
      isFiringAllowed: () =>
        phase.kind === "playing" &&
        playerAgent.isAlive &&
        overlay.classList.contains("hidden"),
      events: {
        onHitLanded(result) {
          if (result.kind === "damaged" || result.kind === "killed") {
            hud.flashHitMarker();
          }
        },
      },
    });

    hud.setStage(stage.number, STAGES.length, stage.name);
    hud.setKillProgress(0, mgr.totalCount);
    hud.setHp(playerAgent.hp, playerAgent.hpMax);
    hud.hideEnd();

    phase = { kind: "playing" };
  };

  const releasePointerLock = () => {
    if (document.exitPointerLock) document.exitPointerLock();
  };

  const engagePointerLock = () => {
    overlay.classList.add("hidden");
    if (canvas.requestPointerLock) canvas.requestPointerLock();
  };

  const onStageClear = () => {
    if (phase.kind !== "playing") return;
    player.setActive(false);
    releasePointerLock();
    const nextIndex = stageIndex + 1;
    const current = STAGES[stageIndex]!;
    if (nextIndex >= STAGES.length) {
      phase = { kind: "gameCleared" };
      hud.showEnd(
        "win",
        "GAME CLEAR",
        `全${STAGES.length}ステージ制覇 — ${current.name} を突破`,
        "R で最初のステージへ",
      );
      return;
    }
    const next = STAGES[nextIndex]!;
    phase = { kind: "stageCleared", nextIndex };
    const subtitle = next.newElement
      ? `Stage ${next.number} 新要素: ${next.newElement}`
      : `次は Stage ${next.number} — ${next.name}`;
    hud.showEnd(
      "win",
      `STAGE ${current.number} CLEAR`,
      subtitle,
      "クリック / Space で次のステージへ",
    );
    hud.onEndClick(() => advanceToNextStage());
  };

  const onDefeat = () => {
    if (phase.kind !== "playing") return;
    player.setActive(false);
    releasePointerLock();
    phase = { kind: "defeated", stageIndex };
    const current = STAGES[stageIndex]!;
    hud.showEnd(
      "lose",
      "DEFEAT",
      `Stage ${current.number} — ${current.name}`,
      "R でリトライ",
    );
  };

  const advanceToNextStage = () => {
    if (phase.kind !== "stageCleared") return;
    const target = phase.nextIndex;
    hud.onEndClick(null);
    loadStage(target);
    engagePointerLock();
  };

  const retryCurrentStage = () => {
    if (phase.kind !== "defeated") return;
    const target = phase.stageIndex;
    hud.onEndClick(null);
    loadStage(target);
    engagePointerLock();
  };

  const restartFromBeginning = () => {
    if (phase.kind !== "gameCleared") return;
    hud.onEndClick(null);
    loadStage(0);
    engagePointerLock();
  };

  const requestLock = () => {
    if (phase.kind !== "playing") return;
    engagePointerLock();
  };
  const onOverlayKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      requestLock();
    }
  };
  const onPointerLockChange = () => {
    if (document.pointerLockElement !== canvas) {
      if (phase.kind === "playing") overlay.classList.remove("hidden");
    }
  };
  const onWindowKeyDown = (e: KeyboardEvent) => {
    if (e.key === "r" || e.key === "R") {
      if (phase.kind === "defeated") {
        retryCurrentStage();
      } else if (phase.kind === "gameCleared") {
        restartFromBeginning();
      }
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      if (phase.kind === "stageCleared") {
        e.preventDefault();
        advanceToNextStage();
      }
    }
  };

  overlay.addEventListener("click", requestLock);
  overlay.addEventListener("keydown", onOverlayKey);
  document.addEventListener("pointerlockchange", onPointerLockChange);
  window.addEventListener("keydown", onWindowKeyDown);

  loadStage(0);

  let started = false;
  let lastTime = 0;

  return {
    start() {
      if (started) return;
      started = true;
      lastTime = performance.now();
      engineHandle.runRenderLoop(() => {
        const now = performance.now();
        const paused = isPaused();
        sceneHandle.scene.animationsEnabled = !paused;

        if (paused) {
          lastTime = now;
          sceneHandle.scene.render();
          return;
        }

        const dt = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;

        playerAgent.tick(dt);
        if (playerAgent.isAlive) {
          player.update(dt);
          enemyManager?.update(dt, player.getPosition());
        }
        effects.update(dt);

        if (!playerAgent.isAlive) {
          onDefeat();
        } else if (enemyManager && enemyManager.aliveCount === 0) {
          onStageClear();
        }

        sceneHandle.scene.render();
      });
    },
    dispose() {
      overlay.removeEventListener("click", requestLock);
      overlay.removeEventListener("keydown", onOverlayKey);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      window.removeEventListener("keydown", onWindowKeyDown);
      hud.onEndClick(null);
      combat?.dispose();
      enemyManager?.dispose();
      effects.dispose();
      hud.dispose();
      player.dispose();
      sceneHandle.dispose();
      engineHandle.dispose();
    },
  };
}
