import { Engine } from "@babylonjs/core";
import type { Disposable } from "@/shared/contracts/Disposable";

export interface EngineHandle extends Disposable {
  readonly engine: Engine;
  runRenderLoop(frame: () => void): void;
}

export function createEngine(canvas: HTMLCanvasElement): EngineHandle {
  const engine = new Engine(canvas, true, {
    stencil: true,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });
  engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));

  const onResize = () => engine.resize();
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  window.visualViewport?.addEventListener("resize", onResize);

  let loopAttached = false;

  return {
    engine,
    runRenderLoop(frame) {
      if (loopAttached) return;
      loopAttached = true;
      engine.runRenderLoop(frame);
    },
    dispose() {
      engine.stopRenderLoop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      engine.dispose();
    },
  };
}
