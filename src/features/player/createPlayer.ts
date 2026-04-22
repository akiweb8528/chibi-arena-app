import { FreeCamera, type Scene, Vector3 } from "@babylonjs/core";
import type { Disposable } from "@/shared/contracts/Disposable";

export interface PlayerOptions {
  scene: Scene;
  canvas: HTMLCanvasElement;
  spawn: Vector3;
  touchMoveControls?: {
    pad: HTMLElement;
    knob: HTMLElement;
  };
  moveSpeed?: number;
  lookSensitivity?: number;
  touchLookSensitivity?: number;
  eyeHeight?: number;
}

export interface PlayerHandle extends Disposable {
  readonly camera: FreeCamera;
  getPosition(): Vector3;
  update(dt: number): void;
  setActive(active: boolean): void;
  resetTo(spawn: Vector3, yawRad?: number): void;
}

const PITCH_LIMIT = Math.PI / 2 - 0.01;

export function createPlayer(opts: PlayerOptions): PlayerHandle {
  const { scene, canvas, spawn } = opts;
  const moveSpeed = opts.moveSpeed ?? 5.5;
  const lookSensitivity = opts.lookSensitivity ?? 0.0022;
  const touchLookSensitivity = opts.touchLookSensitivity ?? 0.0045;
  const eyeHeight = opts.eyeHeight ?? spawn.y;

  const camera = new FreeCamera("player", spawn.clone(), scene);
  camera.minZ = 0.05;
  camera.maxZ = 300;
  camera.fov = 1.15;
  camera.inertia = 0;

  const pressed = new Set<string>();
  const touchAxis = { f: 0, s: 0 };
  let yaw = 0;
  let pitch = 0;
  let active = true;
  let movePointerId: number | null = null;
  let lookPointerId: number | null = null;
  let lastLookX = 0;
  let lastLookY = 0;

  const applyRotation = () => camera.rotation.set(pitch, yaw, 0);
  applyRotation();

  const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

  const applyLookDelta = (
    movementX: number,
    movementY: number,
    sensitivity: number,
  ): void => {
    yaw += movementX * sensitivity;
    pitch += movementY * sensitivity;
    pitch = clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT);
    applyRotation();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!active) return;
    pressed.add(e.code);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    pressed.delete(e.code);
  };
  const onBlur = () => {
    pressed.clear();
    resetTouchMove();
    movePointerId = null;
    lookPointerId = null;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!active) return;
    if (document.pointerLockElement !== canvas) return;
    applyLookDelta(e.movementX, e.movementY, lookSensitivity);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  window.addEventListener("mousemove", onMouseMove);

  const resetTouchMove = (): void => {
    touchAxis.f = 0;
    touchAxis.s = 0;
    opts.touchMoveControls?.knob.style.setProperty(
      "transform",
      "translate(-50%, -50%)",
    );
  };

  const updateTouchMove = (clientX: number, clientY: number): void => {
    const controls = opts.touchMoveControls;
    if (!controls) return;

    const rect = controls.pad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = Math.max(24, Math.min(rect.width, rect.height) * 0.36);
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance > maxRadius) {
      const scale = maxRadius / distance;
      dx *= scale;
      dy *= scale;
    }

    const deadZone = 0.08;
    const axisS = dx / maxRadius;
    const axisF = -dy / maxRadius;
    touchAxis.s = Math.abs(axisS) < deadZone ? 0 : axisS;
    touchAxis.f = Math.abs(axisF) < deadZone ? 0 : axisF;
    controls.knob.style.setProperty(
      "transform",
      `translate(-50%, -50%) translate(${dx}px, ${dy}px)`,
    );
  };

  const releaseMovePointer = (pointerId: number): void => {
    const controls = opts.touchMoveControls;
    if (controls?.pad.hasPointerCapture(pointerId)) {
      controls.pad.releasePointerCapture(pointerId);
    }
  };

  const onMovePointerDown = (e: PointerEvent): void => {
    if (!active || movePointerId !== null) return;
    movePointerId = e.pointerId;
    opts.touchMoveControls?.pad.setPointerCapture(e.pointerId);
    updateTouchMove(e.clientX, e.clientY);
    e.preventDefault();
  };

  const onMovePointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== movePointerId) return;
    updateTouchMove(e.clientX, e.clientY);
    e.preventDefault();
  };

  const onMovePointerEnd = (e: PointerEvent): void => {
    if (e.pointerId !== movePointerId) return;
    releaseMovePointer(e.pointerId);
    movePointerId = null;
    resetTouchMove();
    e.preventDefault();
  };

  const onTouchLookPointerDown = (e: PointerEvent): void => {
    if (!active || e.pointerType === "mouse" || lookPointerId !== null) return;
    const rect = canvas.getBoundingClientRect();
    if (e.clientX < rect.left + rect.width * 0.42) return;

    lookPointerId = e.pointerId;
    lastLookX = e.clientX;
    lastLookY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onTouchLookPointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== lookPointerId) return;
    const dx = e.clientX - lastLookX;
    const dy = e.clientY - lastLookY;
    lastLookX = e.clientX;
    lastLookY = e.clientY;
    applyLookDelta(dx, dy, touchLookSensitivity);
    e.preventDefault();
  };

  const onTouchLookPointerEnd = (e: PointerEvent): void => {
    if (e.pointerId !== lookPointerId) return;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    lookPointerId = null;
    e.preventDefault();
  };

  opts.touchMoveControls?.pad.addEventListener("pointerdown", onMovePointerDown);
  opts.touchMoveControls?.pad.addEventListener("pointermove", onMovePointerMove);
  opts.touchMoveControls?.pad.addEventListener("pointerup", onMovePointerEnd);
  opts.touchMoveControls?.pad.addEventListener("pointercancel", onMovePointerEnd);
  canvas.addEventListener("pointerdown", onTouchLookPointerDown);
  canvas.addEventListener("pointermove", onTouchLookPointerMove);
  canvas.addEventListener("pointerup", onTouchLookPointerEnd);
  canvas.addEventListener("pointercancel", onTouchLookPointerEnd);

  const readAxis = () => {
    let f = 0;
    let s = 0;
    if (pressed.has("KeyW") || pressed.has("ArrowUp")) f += 1;
    if (pressed.has("KeyS") || pressed.has("ArrowDown")) f -= 1;
    if (pressed.has("KeyD") || pressed.has("ArrowRight")) s += 1;
    if (pressed.has("KeyA") || pressed.has("ArrowLeft")) s -= 1;
    return {
      f: clamp(f + touchAxis.f, -1, 1),
      s: clamp(s + touchAxis.s, -1, 1),
    };
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
      const norm = 1 / Math.max(1, Math.hypot(f, s));
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
      if (!next) {
        pressed.clear();
        resetTouchMove();
        movePointerId = null;
        lookPointerId = null;
      }
    },
    resetTo(spawn, yawRad) {
      camera.position.copyFrom(spawn);
      camera.position.y = eyeHeight;
      yaw = yawRad ?? 0;
      pitch = 0;
      applyRotation();
      pressed.clear();
      resetTouchMove();
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("mousemove", onMouseMove);
      opts.touchMoveControls?.pad.removeEventListener(
        "pointerdown",
        onMovePointerDown,
      );
      opts.touchMoveControls?.pad.removeEventListener(
        "pointermove",
        onMovePointerMove,
      );
      opts.touchMoveControls?.pad.removeEventListener("pointerup", onMovePointerEnd);
      opts.touchMoveControls?.pad.removeEventListener(
        "pointercancel",
        onMovePointerEnd,
      );
      canvas.removeEventListener("pointerdown", onTouchLookPointerDown);
      canvas.removeEventListener("pointermove", onTouchLookPointerMove);
      canvas.removeEventListener("pointerup", onTouchLookPointerEnd);
      canvas.removeEventListener("pointercancel", onTouchLookPointerEnd);
      camera.dispose();
    },
  };
}
