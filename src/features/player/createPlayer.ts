import { FreeCamera, type Scene, Vector3 } from "@babylonjs/core";
import type { Disposable } from "@/shared/contracts/Disposable";

export interface PlayerOptions {
  scene: Scene;
  canvas: HTMLCanvasElement;
  spawn: Vector3;
  moveSpeed?: number;
  lookSensitivity?: number;
  eyeHeight?: number;
}

export interface PlayerHandle extends Disposable {
  readonly camera: FreeCamera;
  getPosition(): Vector3;
  update(dt: number): void;
  setActive(active: boolean): void;
}

const PITCH_LIMIT = Math.PI / 2 - 0.01;

export function createPlayer(opts: PlayerOptions): PlayerHandle {
  const { scene, canvas, spawn } = opts;
  const moveSpeed = opts.moveSpeed ?? 5.5;
  const lookSensitivity = opts.lookSensitivity ?? 0.0022;
  const eyeHeight = opts.eyeHeight ?? spawn.y;

  const camera = new FreeCamera("player", spawn.clone(), scene);
  camera.minZ = 0.05;
  camera.maxZ = 300;
  camera.fov = 1.15;
  camera.inertia = 0;

  const pressed = new Set<string>();
  let yaw = 0;
  let pitch = 0;
  let active = true;

  const applyRotation = () => camera.rotation.set(pitch, yaw, 0);
  applyRotation();

  const onKeyDown = (e: KeyboardEvent) => {
    if (!active) return;
    pressed.add(e.code);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    pressed.delete(e.code);
  };
  const onBlur = () => pressed.clear();

  const onMouseMove = (e: MouseEvent) => {
    if (!active) return;
    if (document.pointerLockElement !== canvas) return;
    yaw += e.movementX * lookSensitivity;
    pitch += e.movementY * lookSensitivity;
    if (pitch > PITCH_LIMIT) pitch = PITCH_LIMIT;
    if (pitch < -PITCH_LIMIT) pitch = -PITCH_LIMIT;
    applyRotation();
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  window.addEventListener("mousemove", onMouseMove);

  const readAxis = () => {
    let f = 0;
    let s = 0;
    if (pressed.has("KeyW") || pressed.has("ArrowUp")) f += 1;
    if (pressed.has("KeyS") || pressed.has("ArrowDown")) f -= 1;
    if (pressed.has("KeyD") || pressed.has("ArrowRight")) s += 1;
    if (pressed.has("KeyA") || pressed.has("ArrowLeft")) s -= 1;
    return { f, s };
  };

  return {
    camera,
    getPosition() {
      return camera.position;
    },
    update(dt) {
      if (!active || !(dt > 0)) return;
      const { f, s } = readAxis();
      if (f === 0 && s === 0) {
        camera.position.y = eyeHeight;
        return;
      }
      const norm = 1 / Math.hypot(f, s);
      const sinY = Math.sin(yaw);
      const cosY = Math.cos(yaw);
      const stepX = (sinY * f + cosY * s) * norm * moveSpeed * dt;
      const stepZ = (cosY * f - sinY * s) * norm * moveSpeed * dt;
      camera.position.x += stepX;
      camera.position.z += stepZ;
      camera.position.y = eyeHeight;
    },
    setActive(next) {
      active = next;
      if (!next) pressed.clear();
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("mousemove", onMouseMove);
      camera.dispose();
    },
  };
}
