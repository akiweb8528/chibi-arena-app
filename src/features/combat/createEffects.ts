import {
  Color3,
  type Mesh,
  MeshBuilder,
  type Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { Disposable } from "@/shared/contracts/Disposable";

interface ActiveEffect {
  mesh: Mesh;
  material: StandardMaterial;
  elapsed: number;
  duration: number;
  update: (t: number) => void;
}

export interface Effects extends Disposable {
  explodeAt(position: Vector3, radius: number): void;
  tracerBeam(from: Vector3, to: Vector3): void;
  muzzleFlash(position: Vector3): void;
  update(dt: number): void;
  clear(): void;
}

export function createEffects(scene: Scene): Effects {
  const active: ActiveEffect[] = [];

  const retire = (e: ActiveEffect) => {
    e.mesh.dispose();
    e.material.dispose();
  };

  return {
    explodeAt(position, radius) {
      const mat = new StandardMaterial("expl:mat", scene);
      mat.diffuseColor = new Color3(0, 0, 0);
      mat.emissiveColor = new Color3(1, 0.55, 0.15);
      mat.specularColor = new Color3(0, 0, 0);
      mat.alpha = 0.9;
      mat.backFaceCulling = false;
      const sphere = MeshBuilder.CreateSphere(
        "expl",
        { diameter: 0.4, segments: 16 },
        scene,
      );
      sphere.material = mat;
      sphere.position.copyFrom(position);
      sphere.isPickable = false;
      const targetScale = (radius * 2) / 0.4;
      active.push({
        mesh: sphere,
        material: mat,
        elapsed: 0,
        duration: 0.45,
        update(t) {
          const eased = 1 - Math.pow(1 - t, 3);
          const s = 1 + (targetScale - 1) * eased;
          sphere.scaling.setAll(s);
          mat.alpha = 0.9 * (1 - t);
          mat.emissiveColor.set(
            1 - t * 0.6,
            0.55 - t * 0.4,
            0.15,
          );
        },
      });
    },
    tracerBeam(from, to) {
      const delta = to.subtract(from);
      const dist = delta.length();
      if (dist < 0.1) return;
      const mat = new StandardMaterial("tracer:mat", scene);
      mat.diffuseColor = new Color3(0, 0, 0);
      mat.emissiveColor = new Color3(1, 0.85, 0.45);
      mat.specularColor = new Color3(0, 0, 0);
      mat.alpha = 0.85;
      const beam = MeshBuilder.CreateCylinder(
        "tracer",
        { height: dist, diameter: 0.04, tessellation: 6 },
        scene,
      );
      beam.material = mat;
      beam.isPickable = false;
      beam.position.copyFrom(from.add(to).scale(0.5));

      const up = new Vector3(0, 1, 0);
      const dir = delta.normalize();
      const dot = Math.min(1, Math.max(-1, Vector3.Dot(up, dir)));
      if (Math.abs(dot - 1) > 1e-6) {
        if (Math.abs(dot + 1) < 1e-6) {
          beam.rotate(new Vector3(1, 0, 0), Math.PI);
        } else {
          const axis = Vector3.Cross(up, dir).normalize();
          const angle = Math.acos(dot);
          beam.rotate(axis, angle);
        }
      }

      active.push({
        mesh: beam,
        material: mat,
        elapsed: 0,
        duration: 0.14,
        update(t) {
          mat.alpha = 0.85 * (1 - t);
        },
      });
    },
    muzzleFlash(position) {
      const mat = new StandardMaterial("muzzle:mat", scene);
      mat.diffuseColor = new Color3(0, 0, 0);
      mat.emissiveColor = new Color3(1, 0.9, 0.5);
      mat.specularColor = new Color3(0, 0, 0);
      mat.alpha = 0.95;
      const flash = MeshBuilder.CreateSphere(
        "muzzle",
        { diameter: 0.2, segments: 8 },
        scene,
      );
      flash.material = mat;
      flash.position.copyFrom(position);
      flash.isPickable = false;
      active.push({
        mesh: flash,
        material: mat,
        elapsed: 0,
        duration: 0.09,
        update(t) {
          flash.scaling.setAll(1 + t * 1.6);
          mat.alpha = 0.95 * (1 - t);
        },
      });
    },
    update(dt) {
      if (dt <= 0) return;
      for (let i = active.length - 1; i >= 0; i--) {
        const e = active[i]!;
        e.elapsed += dt;
        const t = e.elapsed / e.duration;
        if (t >= 1) {
          retire(e);
          active.splice(i, 1);
          continue;
        }
        e.update(t);
      }
    },
    clear() {
      for (const e of active) retire(e);
      active.length = 0;
    },
    dispose() {
      for (const e of active) retire(e);
      active.length = 0;
    },
  };
}
