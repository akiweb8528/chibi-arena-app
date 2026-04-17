import {
  type AbstractMesh,
  Animation,
  Color3,
  type Mesh,
  MeshBuilder,
  type Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type { Disposable } from "@/shared/contracts/Disposable";

export interface ChibiPalette {
  skin: Color3;
  hair: Color3;
  clothesTop: Color3;
  clothesBottom: Color3;
  accent: Color3;
}

export interface ChibiOptions {
  scene: Scene;
  name: string;
  palette: ChibiPalette;
  position?: Vector3;
  facingY?: number;
  bobSpeed?: number;
}

export interface ChibiHandle extends Disposable {
  readonly root: TransformNode;
  readonly pickMeshes: readonly AbstractMesh[];
  setVisible(visible: boolean): void;
  flashDamage(durationMs: number): void;
}

export const DEFAULT_PALETTES: readonly ChibiPalette[] = [
  {
    skin: Color3.FromHexString("#ffe0c4"),
    hair: Color3.FromHexString("#2c2733"),
    clothesTop: Color3.FromHexString("#ff6f91"),
    clothesBottom: Color3.FromHexString("#4466aa"),
    accent: Color3.FromHexString("#ffcf4d"),
  },
  {
    skin: Color3.FromHexString("#ffd6b5"),
    hair: Color3.FromHexString("#f2c46b"),
    clothesTop: Color3.FromHexString("#6ad1ff"),
    clothesBottom: Color3.FromHexString("#2e5a8a"),
    accent: Color3.FromHexString("#ff7285"),
  },
  {
    skin: Color3.FromHexString("#f8d3c1"),
    hair: Color3.FromHexString("#a883ff"),
    clothesTop: Color3.FromHexString("#d8ffd1"),
    clothesBottom: Color3.FromHexString("#3a3a46"),
    accent: Color3.FromHexString("#ffb347"),
  },
  {
    skin: Color3.FromHexString("#ffe4d2"),
    hair: Color3.FromHexString("#ff97b7"),
    clothesTop: Color3.FromHexString("#fff6b0"),
    clothesBottom: Color3.FromHexString("#7c4fc4"),
    accent: Color3.FromHexString("#6dd0a5"),
  },
];

const FLASH_TINT = new Color3(0.95, 0.35, 0.35);

export function createChibiCharacter(opts: ChibiOptions): ChibiHandle {
  const { scene, name, palette } = opts;

  const root = new TransformNode(`${name}:root`, scene);
  if (opts.position) root.position.copyFrom(opts.position);
  root.rotation.y = opts.facingY ?? 0;

  const skinMat = flatMat(scene, `${name}:skin`, palette.skin);
  const hairMat = flatMat(scene, `${name}:hair`, palette.hair);
  const topMat = flatMat(scene, `${name}:top`, palette.clothesTop);
  const botMat = flatMat(scene, `${name}:bot`, palette.clothesBottom);
  const whiteMat = flatMat(scene, `${name}:white`, new Color3(1, 1, 1));
  const darkMat = flatMat(scene, `${name}:dark`, new Color3(0.08, 0.08, 0.14));
  const blushMat = flatMat(scene, `${name}:blush`, palette.accent);

  const ownedMaterials = [skinMat, hairMat, topMat, botMat, whiteMat, darkMat, blushMat];
  const originalEmissives = new Map<StandardMaterial, Color3>(
    ownedMaterials.map((m) => [m, m.emissiveColor.clone()]),
  );

  const parentTo = (m: Mesh, mat: StandardMaterial): Mesh => {
    m.material = mat;
    m.parent = root;
    return m;
  };

  const legL = parentTo(
    MeshBuilder.CreateCylinder(`${name}:legL`, { diameter: 0.26, height: 0.4 }, scene),
    botMat,
  );
  legL.position.set(-0.14, 0.2, 0);

  const legR = parentTo(
    MeshBuilder.CreateCylinder(`${name}:legR`, { diameter: 0.26, height: 0.4 }, scene),
    botMat,
  );
  legR.position.set(0.14, 0.2, 0);

  const body = parentTo(
    MeshBuilder.CreateSphere(`${name}:body`, { diameter: 0.72, segments: 16 }, scene),
    topMat,
  );
  body.scaling.set(1, 0.9, 0.95);
  body.position.set(0, 0.75, 0);

  const armL = parentTo(
    MeshBuilder.CreateSphere(`${name}:armL`, { diameter: 0.22, segments: 12 }, scene),
    skinMat,
  );
  armL.scaling.set(1, 1.55, 1);
  armL.position.set(-0.42, 0.72, 0);

  const armR = parentTo(
    MeshBuilder.CreateSphere(`${name}:armR`, { diameter: 0.22, segments: 12 }, scene),
    skinMat,
  );
  armR.scaling.set(1, 1.55, 1);
  armR.position.set(0.42, 0.72, 0);

  const head = parentTo(
    MeshBuilder.CreateSphere(`${name}:head`, { diameter: 1.1, segments: 20 }, scene),
    skinMat,
  );
  head.position.set(0, 1.55, 0);

  const hairBack = parentTo(
    MeshBuilder.CreateSphere(`${name}:hairBack`, { diameter: 1.18, segments: 20 }, scene),
    hairMat,
  );
  hairBack.scaling.set(1, 0.98, 1.02);
  hairBack.position.set(0, 1.58, -0.05);

  const bangs = parentTo(
    MeshBuilder.CreateSphere(`${name}:bangs`, { diameter: 0.8, segments: 16 }, scene),
    hairMat,
  );
  bangs.scaling.set(1.25, 0.55, 0.65);
  bangs.position.set(0, 1.88, 0.3);

  const sideL = parentTo(
    MeshBuilder.CreateSphere(`${name}:sideL`, { diameter: 0.35, segments: 12 }, scene),
    hairMat,
  );
  sideL.scaling.set(0.7, 1.3, 0.9);
  sideL.position.set(-0.52, 1.4, 0.05);

  const sideR = parentTo(
    MeshBuilder.CreateSphere(`${name}:sideR`, { diameter: 0.35, segments: 12 }, scene),
    hairMat,
  );
  sideR.scaling.set(0.7, 1.3, 0.9);
  sideR.position.set(0.52, 1.4, 0.05);

  const eyeY = 1.55;
  const eyeZ = 0.47;
  const eyeOffset = 0.19;

  const eyeWL = parentTo(
    MeshBuilder.CreateSphere(`${name}:eyeWL`, { diameter: 0.24, segments: 12 }, scene),
    whiteMat,
  );
  eyeWL.scaling.set(1, 1.25, 0.55);
  eyeWL.position.set(-eyeOffset, eyeY, eyeZ);

  const eyeWR = parentTo(
    MeshBuilder.CreateSphere(`${name}:eyeWR`, { diameter: 0.24, segments: 12 }, scene),
    whiteMat,
  );
  eyeWR.scaling.set(1, 1.25, 0.55);
  eyeWR.position.set(eyeOffset, eyeY, eyeZ);

  const pupL = parentTo(
    MeshBuilder.CreateSphere(`${name}:pupL`, { diameter: 0.15, segments: 10 }, scene),
    darkMat,
  );
  pupL.scaling.set(1, 1.25, 0.35);
  pupL.position.set(-eyeOffset, eyeY, eyeZ + 0.04);

  const pupR = parentTo(
    MeshBuilder.CreateSphere(`${name}:pupR`, { diameter: 0.15, segments: 10 }, scene),
    darkMat,
  );
  pupR.scaling.set(1, 1.25, 0.35);
  pupR.position.set(eyeOffset, eyeY, eyeZ + 0.04);

  const blushL = parentTo(
    MeshBuilder.CreateSphere(`${name}:blushL`, { diameter: 0.18, segments: 10 }, scene),
    blushMat,
  );
  blushL.scaling.set(1.1, 0.6, 0.2);
  blushL.position.set(-0.32, eyeY - 0.12, eyeZ - 0.02);

  const blushR = parentTo(
    MeshBuilder.CreateSphere(`${name}:blushR`, { diameter: 0.18, segments: 10 }, scene),
    blushMat,
  );
  blushR.scaling.set(1.1, 0.6, 0.2);
  blushR.position.set(0.32, eyeY - 0.12, eyeZ - 0.02);

  const mouth = parentTo(
    MeshBuilder.CreateSphere(`${name}:mouth`, { diameter: 0.09, segments: 8 }, scene),
    darkMat,
  );
  mouth.scaling.set(1.1, 0.4, 0.3);
  mouth.position.set(0, eyeY - 0.3, eyeZ + 0.02);

  const pickMeshes: readonly AbstractMesh[] = root.getChildMeshes();

  const bob = buildIdleBob(scene, root, opts.bobSpeed ?? 0.8 + Math.random() * 0.5);

  let flashTimer: number | undefined;

  return {
    root,
    pickMeshes,
    setVisible(visible) {
      root.setEnabled(visible);
    },
    flashDamage(durationMs) {
      if (flashTimer !== undefined) window.clearTimeout(flashTimer);
      for (const mat of ownedMaterials) {
        mat.emissiveColor = FLASH_TINT;
      }
      flashTimer = window.setTimeout(() => {
        for (const [mat, original] of originalEmissives) {
          mat.emissiveColor = original;
        }
        flashTimer = undefined;
      }, durationMs);
    },
    dispose() {
      bob.stop();
      if (flashTimer !== undefined) window.clearTimeout(flashTimer);
      root.dispose(false, false);
      for (const m of ownedMaterials) m.dispose();
    },
  };
}

function flatMat(scene: Scene, name: string, color: Color3): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = color;
  mat.specularColor = new Color3(0, 0, 0);
  mat.emissiveColor = color.scale(0.22);
  return mat;
}

function buildIdleBob(
  scene: Scene,
  root: TransformNode,
  speed: number,
): { stop(): void } {
  const baseY = root.position.y;
  const anim = new Animation(
    `${root.name}:bob`,
    "position.y",
    60,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CYCLE,
  );
  anim.setKeys([
    { frame: 0, value: baseY },
    { frame: 45, value: baseY + 0.07 },
    { frame: 90, value: baseY },
  ]);
  root.animations = [anim];
  const runner = scene.beginAnimation(root, 0, 90, true, speed);
  return { stop: () => runner.stop() };
}
