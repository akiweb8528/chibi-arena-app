import {
  Color3,
  Color4,
  DirectionalLight,
  type Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { Disposable } from "@/shared/contracts/Disposable";

export interface SceneHandle extends Disposable {
  readonly scene: Scene;
}

export function createScene(engine: Engine): SceneHandle {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.58, 0.79, 0.95, 1);
  scene.ambientColor = new Color3(0.7, 0.72, 0.8);

  const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.95;
  hemi.diffuse = new Color3(1, 0.98, 0.95);
  hemi.groundColor = new Color3(0.55, 0.6, 0.72);

  const sun = new DirectionalLight("sun", new Vector3(-0.45, -1, -0.35), scene);
  sun.intensity = 0.5;

  const groundMat = new StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new Color3(0.42, 0.72, 0.42);
  groundMat.specularColor = new Color3(0, 0, 0);
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 80, height: 80, subdivisions: 2 },
    scene,
  );
  ground.material = groundMat;

  buildTreeRing(scene);

  return {
    scene,
    dispose() {
      scene.dispose();
    },
  };
}

function buildTreeRing(scene: Scene): void {
  const trunkMat = new StandardMaterial("trunkMat", scene);
  trunkMat.diffuseColor = new Color3(0.45, 0.3, 0.2);
  trunkMat.specularColor = new Color3(0, 0, 0);

  const crownMat = new StandardMaterial("crownMat", scene);
  crownMat.diffuseColor = new Color3(0.26, 0.57, 0.27);
  crownMat.specularColor = new Color3(0, 0, 0);
  crownMat.emissiveColor = new Color3(0.04, 0.1, 0.04);

  const count = 9;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 14 + (i % 2) * 3.5;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;

    const trunk = MeshBuilder.CreateCylinder(
      `trunk${i}`,
      { diameter: 0.55, height: 1.7 },
      scene,
    );
    trunk.position.set(x, 0.85, z);
    trunk.material = trunkMat;

    const crown = MeshBuilder.CreateSphere(
      `crown${i}`,
      { diameter: 2.6, segments: 12 },
      scene,
    );
    crown.scaling.set(1, 0.95, 1);
    crown.position.set(x, 2.55, z);
    crown.material = crownMat;
  }
}
