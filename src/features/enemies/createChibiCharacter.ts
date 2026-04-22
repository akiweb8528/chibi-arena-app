import {
  type AbstractMesh,
  Animation,
  Color3,
  DynamicTexture,
  Mesh,
  type Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
  MeshBuilder,
} from "@babylonjs/core";
import type { Disposable } from "@/shared/contracts/Disposable";

export interface ChibiPalette {
  skin: Color3;
  hair: Color3;
  clothesTop: Color3;
  clothesBottom: Color3;
  accent: Color3;
}

export type ChibiHairStyle =
  | "round"
  | "bob"
  | "spiky"
  | "sideSweep"
  | "helmet"
  | "hood";

export type ChibiOutfitStyle =
  | "plain"
  | "scout"
  | "armor"
  | "heavyArmor"
  | "coat"
  | "royal"
  | "bombVest";

export type ChibiFaceStyle = "soft" | "focused" | "masked" | "visor";

export type ChibiAccessory =
  | "none"
  | "headband"
  | "goggles"
  | "horns"
  | "crown"
  | "fuse";

export interface ChibiAppearance {
  readonly hairStyle?: ChibiHairStyle;
  readonly outfitStyle?: ChibiOutfitStyle;
  readonly faceStyle?: ChibiFaceStyle;
  readonly accessory?: ChibiAccessory;
}

export interface ChibiOptions {
  scene: Scene;
  name: string;
  palette: ChibiPalette;
  appearance?: ChibiAppearance;
  position?: Vector3;
  facingY?: number;
  bobSpeed?: number;
  scale?: number;
  hasGun?: boolean;
}

export interface ChibiHandle extends Disposable {
  readonly root: TransformNode;
  readonly pickMeshes: readonly AbstractMesh[];
  setVisible(visible: boolean): void;
  flashDamage(durationMs: number): void;
  setHpBar(visible: boolean, pct: number): void;
  getMuzzleWorldPosition(): Vector3 | null;
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
const HPBAR_TEX_W = 96;
const HPBAR_TEX_H = 16;
const DEFAULT_APPEARANCE: Required<ChibiAppearance> = {
  hairStyle: "round",
  outfitStyle: "plain",
  faceStyle: "soft",
  accessory: "none",
};

export function createChibiCharacter(opts: ChibiOptions): ChibiHandle {
  const { scene, name, palette } = opts;
  const appearance = { ...DEFAULT_APPEARANCE, ...opts.appearance };

  const root = new TransformNode(`${name}:root`, scene);
  if (opts.position) root.position.copyFrom(opts.position);
  root.rotation.y = opts.facingY ?? 0;
  if (opts.scale !== undefined && opts.scale !== 1) {
    root.scaling.setAll(opts.scale);
  }

  const skinMat = flatMat(scene, `${name}:skin`, palette.skin);
  const hairMat = flatMat(scene, `${name}:hair`, palette.hair);
  const topMat = flatMat(scene, `${name}:top`, palette.clothesTop);
  const botMat = flatMat(scene, `${name}:bot`, palette.clothesBottom);
  const whiteMat = flatMat(scene, `${name}:white`, new Color3(1, 1, 1));
  const darkMat = flatMat(scene, `${name}:dark`, new Color3(0.08, 0.08, 0.14));
  const accentMat = flatMat(scene, `${name}:accent`, palette.accent);

  const ownedMaterials: StandardMaterial[] = [
    skinMat,
    hairMat,
    topMat,
    botMat,
    whiteMat,
    darkMat,
    accentMat,
  ];

  const parentTo = (m: Mesh, mat: StandardMaterial): Mesh => {
    m.material = mat;
    m.parent = root;
    return m;
  };

  function addCone(
    suffix: string,
    x: number,
    y: number,
    z: number,
    diameter: number,
    height: number,
    rotationZ: number,
    mat: StandardMaterial,
  ): Mesh {
    const cone = parentTo(
      MeshBuilder.CreateCylinder(
        `${name}:${suffix}`,
        { diameterTop: 0, diameterBottom: diameter, height, tessellation: 10 },
        scene,
      ),
      mat,
    );
    cone.position.set(x, y, z);
    cone.rotation.z = rotationZ;
    return cone;
  }

  function addFrontBox(
    suffix: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    rotationZ: number,
    mat: StandardMaterial,
  ): Mesh {
    const box = parentTo(
      MeshBuilder.CreateBox(`${name}:${suffix}`, { width, height, depth }, scene),
      mat,
    );
    box.position.set(x, y, z);
    box.rotation.z = rotationZ;
    return box;
  }

  function addBackBox(
    suffix: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    mat: StandardMaterial,
  ): Mesh {
    return addFrontBox(suffix, x, y, z, width, height, depth, 0, mat);
  }

  function addShoulderPad(
    suffix: string,
    x: number,
    y: number,
    mat: StandardMaterial,
    size = 1,
  ): Mesh {
    const pad = parentTo(
      MeshBuilder.CreateSphere(
        `${name}:${suffix}`,
        { diameter: 0.28 * size, segments: 10 },
        scene,
      ),
      mat,
    );
    pad.scaling.set(1.35, 0.62, 0.9);
    pad.position.set(x, y, 0.05);
    return pad;
  }

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

  switch (appearance.hairStyle) {
    case "bob":
      hairBack.scaling.set(1.06, 1.06, 1.02);
      bangs.scaling.set(1.05, 0.52, 0.72);
      bangs.position.set(-0.04, 1.84, 0.32);
      sideL.scaling.set(0.95, 1.75, 0.95);
      sideL.position.set(-0.55, 1.33, 0.06);
      sideR.scaling.set(0.95, 1.75, 0.95);
      sideR.position.set(0.55, 1.33, 0.06);
      break;
    case "spiky":
      hairBack.scaling.set(0.96, 0.78, 0.95);
      hairBack.position.set(0, 1.7, -0.04);
      bangs.scaling.set(0.95, 0.42, 0.58);
      bangs.position.set(0, 1.9, 0.34);
      sideL.scaling.set(0.48, 0.82, 0.7);
      sideR.scaling.set(0.48, 0.82, 0.7);
      addCone("spikeA", -0.28, 2.12, 0.02, 0.18, 0.42, -0.2, hairMat);
      addCone("spikeB", 0, 2.18, 0.04, 0.2, 0.48, 0, hairMat);
      addCone("spikeC", 0.28, 2.12, 0.02, 0.18, 0.42, 0.2, hairMat);
      break;
    case "sideSweep":
      hairBack.scaling.set(1.03, 0.92, 1);
      bangs.scaling.set(1.36, 0.46, 0.64);
      bangs.position.set(0.14, 1.87, 0.31);
      bangs.rotation.z = -0.22;
      sideL.scaling.set(0.92, 1.65, 0.92);
      sideL.position.set(-0.53, 1.3, 0.07);
      sideR.scaling.set(0.5, 0.85, 0.75);
      sideR.position.set(0.52, 1.46, 0.04);
      break;
    case "helmet":
      hairBack.scaling.set(1.08, 0.72, 1.04);
      hairBack.position.set(0, 1.78, -0.02);
      bangs.scaling.set(1.3, 0.24, 0.7);
      bangs.position.set(0, 1.74, 0.42);
      sideL.scaling.set(0.85, 1.05, 0.95);
      sideL.position.set(-0.55, 1.46, 0.02);
      sideR.scaling.set(0.85, 1.05, 0.95);
      sideR.position.set(0.55, 1.46, 0.02);
      break;
    case "hood":
      hairBack.material = topMat;
      bangs.material = topMat;
      sideL.material = topMat;
      sideR.material = topMat;
      hairBack.scaling.set(1.14, 1.02, 1.08);
      bangs.scaling.set(1.18, 0.34, 0.7);
      bangs.position.set(0, 1.78, 0.37);
      sideL.scaling.set(0.95, 1.5, 1);
      sideL.position.set(-0.54, 1.36, 0.02);
      sideR.scaling.set(0.95, 1.5, 1);
      sideR.position.set(0.54, 1.36, 0.02);
      break;
    case "round":
      break;
  }

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

  switch (appearance.faceStyle) {
    case "focused":
      eyeWL.scaling.set(1.08, 0.72, 0.45);
      eyeWR.scaling.set(1.08, 0.72, 0.45);
      pupL.scaling.set(1, 0.8, 0.32);
      pupR.scaling.set(1, 0.8, 0.32);
      eyeWL.position.y += 0.02;
      eyeWR.position.y += 0.02;
      pupL.position.y += 0.02;
      pupR.position.y += 0.02;
      break;
    case "masked":
      parentTo(
        MeshBuilder.CreateBox(
          `${name}:faceMask`,
          { width: 0.78, height: 0.22, depth: 0.05 },
          scene,
        ),
        darkMat,
      ).position.set(0, eyeY, eyeZ + 0.09);
      eyeWL.scaling.set(0.74, 0.56, 0.28);
      eyeWR.scaling.set(0.74, 0.56, 0.28);
      pupL.scaling.set(0.65, 0.48, 0.2);
      pupR.scaling.set(0.65, 0.48, 0.2);
      eyeWL.position.z = eyeZ + 0.14;
      eyeWR.position.z = eyeZ + 0.14;
      pupL.position.z = eyeZ + 0.18;
      pupR.position.z = eyeZ + 0.18;
      break;
    case "visor":
      eyeWL.setEnabled(false);
      eyeWR.setEnabled(false);
      pupL.setEnabled(false);
      pupR.setEnabled(false);
      parentTo(
        MeshBuilder.CreateBox(
          `${name}:visor`,
          { width: 0.72, height: 0.16, depth: 0.06 },
          scene,
        ),
        accentMat,
      ).position.set(0, eyeY + 0.01, eyeZ + 0.12);
      break;
    case "soft":
      break;
  }

  const blushL = parentTo(
    MeshBuilder.CreateSphere(`${name}:blushL`, { diameter: 0.18, segments: 10 }, scene),
    accentMat,
  );
  blushL.scaling.set(1.1, 0.6, 0.2);
  blushL.position.set(-0.32, eyeY - 0.12, eyeZ - 0.02);

  const blushR = parentTo(
    MeshBuilder.CreateSphere(`${name}:blushR`, { diameter: 0.18, segments: 10 }, scene),
    accentMat,
  );
  blushR.scaling.set(1.1, 0.6, 0.2);
  blushR.position.set(0.32, eyeY - 0.12, eyeZ - 0.02);

  const mouth = parentTo(
    MeshBuilder.CreateSphere(`${name}:mouth`, { diameter: 0.09, segments: 8 }, scene),
    darkMat,
  );
  mouth.scaling.set(1.1, 0.4, 0.3);
  mouth.position.set(0, eyeY - 0.3, eyeZ + 0.02);

  switch (appearance.outfitStyle) {
    case "scout":
      addFrontBox("sash", -0.05, 0.82, 0.39, 0.12, 0.78, 0.08, 0.58, accentMat);
      addFrontBox("belt", 0, 0.48, 0.34, 0.62, 0.09, 0.08, 0, botMat);
      break;
    case "armor":
      addFrontBox("chestPlate", 0, 0.83, 0.4, 0.58, 0.4, 0.1, 0, accentMat);
      addShoulderPad("shoulderL", -0.48, 0.9, accentMat);
      addShoulderPad("shoulderR", 0.48, 0.9, accentMat);
      break;
    case "heavyArmor":
      addFrontBox("heavyPlate", 0, 0.84, 0.42, 0.64, 0.48, 0.12, 0, accentMat);
      addFrontBox("heavyBelt", 0, 0.5, 0.39, 0.68, 0.12, 0.1, 0, darkMat);
      addShoulderPad("heavyShoulderL", -0.52, 0.94, accentMat, 1.25);
      addShoulderPad("heavyShoulderR", 0.52, 0.94, accentMat, 1.25);
      break;
    case "coat":
      addFrontBox("coatFront", 0, 0.62, 0.38, 0.6, 0.74, 0.08, 0, botMat);
      addBackBox("coatBack", 0, 0.77, -0.41, 0.72, 0.92, 0.08, topMat);
      break;
    case "royal":
      addFrontBox("royalPlate", 0, 0.84, 0.42, 0.54, 0.44, 0.1, 0, accentMat);
      addBackBox("royalCape", 0, 0.82, -0.43, 0.86, 0.98, 0.08, accentMat);
      addShoulderPad("royalShoulderL", -0.5, 0.94, accentMat, 1.15);
      addShoulderPad("royalShoulderR", 0.5, 0.94, accentMat, 1.15);
      break;
    case "bombVest":
      addFrontBox("bombVest", 0, 0.82, 0.4, 0.62, 0.45, 0.1, 0, darkMat);
      addFrontBox("bombStrap", -0.16, 0.82, 0.47, 0.07, 0.56, 0.05, 0, accentMat);
      addFrontBox("bombStrapR", 0.16, 0.82, 0.47, 0.07, 0.56, 0.05, 0, accentMat);
      break;
    case "plain":
      break;
  }

  switch (appearance.accessory) {
    case "headband":
      addFrontBox("headband", 0, 1.79, 0.53, 0.86, 0.08, 0.08, 0, accentMat);
      break;
    case "goggles":
      addFrontBox("goggleBand", 0, 1.59, 0.57, 0.78, 0.08, 0.06, 0, darkMat);
      addFrontBox("goggleL", -0.2, 1.59, 0.61, 0.2, 0.14, 0.05, 0, accentMat);
      addFrontBox("goggleR", 0.2, 1.59, 0.61, 0.2, 0.14, 0.05, 0, accentMat);
      break;
    case "horns":
      addCone("hornL", -0.38, 2.02, 0.04, 0.16, 0.36, -0.45, accentMat);
      addCone("hornR", 0.38, 2.02, 0.04, 0.16, 0.36, 0.45, accentMat);
      break;
    case "crown":
      addFrontBox("crownBand", 0, 2.08, 0.02, 0.62, 0.14, 0.18, 0, accentMat);
      addCone("crownTipL", -0.22, 2.25, 0.02, 0.12, 0.24, 0, accentMat);
      addCone("crownTipC", 0, 2.3, 0.03, 0.14, 0.3, 0, accentMat);
      addCone("crownTipR", 0.22, 2.25, 0.02, 0.12, 0.24, 0, accentMat);
      break;
    case "fuse":
      addCone("fuseStem", 0.08, 2.16, 0.03, 0.07, 0.36, -0.35, darkMat);
      parentTo(
        MeshBuilder.CreateSphere(`${name}:fuseSpark`, { diameter: 0.16, segments: 8 }, scene),
        accentMat,
      ).position.set(0.16, 2.31, 0.03);
      break;
    case "none":
      break;
  }

  let muzzleNode: TransformNode | null = null;
  if (opts.hasGun) {
    const gunBodyMat = flatMat(
      scene,
      `${name}:gunBody`,
      Color3.FromHexString("#1a1a1f"),
    );
    const gunBarrelMat = flatMat(
      scene,
      `${name}:gunBarrel`,
      Color3.FromHexString("#3f4048"),
    );
    ownedMaterials.push(gunBodyMat, gunBarrelMat);

    const gunRoot = new TransformNode(`${name}:gunRoot`, scene);
    gunRoot.parent = root;
    gunRoot.position.set(0.4, 0.62, 0.36);

    const gunBody = MeshBuilder.CreateBox(
      `${name}:gunBodyMesh`,
      { width: 0.12, height: 0.1, depth: 0.26 },
      scene,
    );
    gunBody.material = gunBodyMat;
    gunBody.parent = gunRoot;

    const gunBarrel = MeshBuilder.CreateCylinder(
      `${name}:gunBarrelMesh`,
      { diameter: 0.055, height: 0.28, tessellation: 10 },
      scene,
    );
    gunBarrel.material = gunBarrelMat;
    gunBarrel.parent = gunRoot;
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.set(0, 0, 0.2);

    muzzleNode = new TransformNode(`${name}:muzzle`, scene);
    muzzleNode.parent = gunRoot;
    muzzleNode.position.set(0, 0, 0.36);
  }

  const hpBarTex = new DynamicTexture(
    `${name}:hpBarTex`,
    { width: HPBAR_TEX_W, height: HPBAR_TEX_H },
    scene,
    false,
  );
  const hpBarMat = new StandardMaterial(`${name}:hpBarMat`, scene);
  hpBarMat.diffuseTexture = hpBarTex;
  hpBarMat.emissiveTexture = hpBarTex;
  hpBarMat.specularColor = new Color3(0, 0, 0);
  hpBarMat.disableLighting = true;
  hpBarMat.backFaceCulling = false;
  const hpBarPlane = MeshBuilder.CreatePlane(
    `${name}:hpBarPlane`,
    { width: 0.9, height: 0.14 },
    scene,
  );
  hpBarPlane.material = hpBarMat;
  hpBarPlane.parent = root;
  hpBarPlane.position.set(0, 2.42, 0);
  hpBarPlane.billboardMode = Mesh.BILLBOARDMODE_ALL;
  hpBarPlane.isPickable = false;
  hpBarPlane.setEnabled(false);

  const drawHpBar = (pct: number) => {
    const ctx = hpBarTex.getContext() as unknown as CanvasRenderingContext2D;
    const W = HPBAR_TEX_W;
    const H = HPBAR_TEX_H;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(10, 10, 15, 0.92)";
    ctx.fillRect(0, 0, W, H);
    const clamped = Math.max(0, Math.min(1, pct));
    const hue = Math.round(120 * clamped);
    ctx.fillStyle = `hsl(${hue}, 72%, 52%)`;
    ctx.fillRect(2, 2, (W - 4) * clamped, H - 4);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    hpBarTex.update();
  };

  const originalEmissives = new Map<StandardMaterial, Color3>(
    ownedMaterials.map((m) => [m, m.emissiveColor.clone()]),
  );

  const pickMeshes: readonly AbstractMesh[] = root
    .getChildMeshes()
    .filter((m) => m !== hpBarPlane);

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
    setHpBar(visible, pct) {
      hpBarPlane.setEnabled(visible);
      if (visible) drawHpBar(pct);
    },
    getMuzzleWorldPosition() {
      if (!muzzleNode) return null;
      return muzzleNode.getAbsolutePosition().clone();
    },
    dispose() {
      bob.stop();
      if (flashTimer !== undefined) window.clearTimeout(flashTimer);
      root.dispose(false, false);
      for (const m of ownedMaterials) m.dispose();
      hpBarMat.dispose();
      hpBarTex.dispose();
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
