import * as THREE from 'three';
import { CampusCompoundData, CampusRoadData } from '../types';

export interface CompoundVisualsResult {
  group: THREE.Group;
  colliders: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    minY?: number;
    maxY?: number;
  }[];
  update: (delta: number, elapsed: number) => void;
}

/**
 * Creates 3D compound boundary walls, security gates, entrance archway, guard booth,
 * asphalt perimeter road, concrete curbs, sidewalks, road markings, crosswalks,
 * streetlights, and parked emergency response vehicle.
 */
export function createCampusCompoundAndRoad(
  compound: CampusCompoundData,
  road: CampusRoadData,
  campusName: string
): CompoundVisualsResult {
  const group = new THREE.Group();
  group.name = 'campus_compound_and_road';
  const colliders: { minX: number; maxX: number; minZ: number; maxZ: number; minY?: number; maxY?: number }[] = [];

  const wallH = compound.wallHeight || 2.6;
  const baseH = 0.65;
  const railingH = wallH - baseH;
  const cb = compound.bounds;

  // Materials
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.85,
    metalness: 0.1,
  });

  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.75,
    metalness: 0.15,
  });

  const pillarCapMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.3,
  });

  const railMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.88,
    roughness: 0.22,
  });

  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0x78350f,
    emissiveIntensity: 0.2,
    metalness: 0.7,
    roughness: 0.3,
  });

  // Helper to build a decorative pillar
  const createPillar = (x: number, z: number, height: number = wallH + 0.3, width: number = 0.55) => {
    const colGroup = new THREE.Group();
    colGroup.position.set(x, 0, z);

    // Pillar body
    const bodyGeo = new THREE.BoxGeometry(width, height, width);
    const bodyMesh = new THREE.Mesh(bodyGeo, pillarMat);
    bodyMesh.position.y = height / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    colGroup.add(bodyMesh);

    // Pyramid cap
    const capGeo = new THREE.ConeGeometry(width * 0.72, 0.35, 4);
    capGeo.rotateY(Math.PI / 4);
    const capMesh = new THREE.Mesh(capGeo, pillarCapMat);
    capMesh.position.y = height + 0.175;
    colGroup.add(capMesh);

    group.add(colGroup);

    colliders.push({
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - width / 2,
      maxZ: z + width / 2,
      minY: 0,
      maxY: height,
    });
  };

  // Helper to build a compound boundary fence wall segment
  const createWallSegment = (
    startX: number,
    startZ: number,
    endX: number,
    endZ: number
  ) => {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.hypot(dx, dz);
    if (length < 0.4) return;

    const angle = Math.atan2(dx, dz);
    const midX = (startX + endX) / 2;
    const midZ = (startZ + endZ) / 2;
    const thickness = 0.36;

    const wallSegGroup = new THREE.Group();
    wallSegGroup.position.set(midX, 0, midZ);
    wallSegGroup.rotation.y = angle;

    // 1. Concrete base curb
    const baseGeo = new THREE.BoxGeometry(thickness, baseH, length);
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = baseH / 2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    wallSegGroup.add(baseMesh);

    // 2. Horizontal iron rails (top, bottom, middle)
    const railThick = 0.05;
    const railY1 = baseH + 0.06;
    const railY2 = baseH + railingH * 0.52;
    const railY3 = baseH + railingH;

    [railY1, railY2, railY3].forEach((ry) => {
      const hRailGeo = new THREE.BoxGeometry(railThick, railThick, length);
      const hRail = new THREE.Mesh(hRailGeo, railMat);
      hRail.position.set(0, ry, 0);
      wallSegGroup.add(hRail);
    });

    // 3. Vertical iron pickets spaced ~0.45m apart
    const numPickets = Math.max(2, Math.floor(length / 0.45));
    const picketStep = length / numPickets;
    const picketGeo = new THREE.BoxGeometry(0.035, railingH + 0.12, 0.035);

    for (let i = 0; i <= numPickets; i++) {
      const pz = -length / 2 + i * picketStep;
      const picketMesh = new THREE.Mesh(picketGeo, railMat);
      picketMesh.position.set(0, baseH + railingH / 2 + 0.06, pz);
      wallSegGroup.add(picketMesh);

      // Decorative spearhead/finial on top of pickets
      if (i % 2 === 0) {
        const finialGeo = new THREE.ConeGeometry(0.032, 0.09, 4);
        const finial = new THREE.Mesh(finialGeo, goldAccentMat);
        finial.position.set(0, baseH + railingH + 0.16, pz);
        wallSegGroup.add(finial);
      }
    }

    group.add(wallSegGroup);

    // Register wall collider bounding box
    const halfLen = length / 2;
    const halfThick = thickness / 2;
    const cosA = Math.abs(Math.cos(angle));
    const sinA = Math.abs(Math.sin(angle));
    const boundHalfX = halfThick * cosA + halfLen * sinA;
    const boundHalfZ = halfThick * sinA + halfLen * cosA;

    colliders.push({
      minX: midX - boundHalfX,
      maxX: midX + boundHalfX,
      minZ: midZ - boundHalfZ,
      maxZ: midZ + boundHalfZ,
      minY: 0,
      maxY: wallH,
    });
  };

  // --- 1. BUILD COMPOUND BOUNDARY PERIMETER ---

  // North wall (Z = cb.minZ)
  createWallSegment(cb.minX, cb.minZ, cb.maxX, cb.minZ);
  for (let x = cb.minX; x <= cb.maxX; x += 6.5) {
    createPillar(x, cb.minZ);
  }

  // West wall (X = cb.minX)
  createWallSegment(cb.minX, cb.minZ, cb.minX, cb.maxZ);
  for (let z = cb.minZ; z <= cb.maxZ; z += 6.5) {
    createPillar(cb.minX, z);
  }

  // East wall (X = cb.maxX)
  createWallSegment(cb.maxX, cb.minZ, cb.maxX, cb.maxZ);
  for (let z = cb.minZ; z <= cb.maxZ; z += 6.5) {
    createPillar(cb.maxX, z);
  }

  // South wall (Z = cb.maxZ, with Main Gate and optional Emergency Gate)
  const mgX = compound.mainGate.position[0];
  const mgW = compound.mainGate.width;
  const mgLeft = mgX - mgW / 2;
  const mgRight = mgX + mgW / 2;

  let hasEg = !!compound.emergencyGate;
  let egLeft = 999;
  let egRight = 999;
  if (compound.emergencyGate) {
    const egX = compound.emergencyGate.position[0];
    const egW = compound.emergencyGate.width;
    egLeft = egX - egW / 2;
    egRight = egX + egW / 2;
  }

  // Build segments along south wall avoiding gates
  if (hasEg && egLeft > mgRight) {
    // 3 segments: cb.minX -> mgLeft, mgRight -> egLeft, egRight -> cb.maxX
    createWallSegment(cb.minX, cb.maxZ, mgLeft, cb.maxZ);
    createWallSegment(mgRight, cb.maxZ, egLeft, cb.maxZ);
    createWallSegment(egRight, cb.maxZ, cb.maxX, cb.maxZ);
  } else {
    // 2 segments: cb.minX -> mgLeft, mgRight -> cb.maxX
    createWallSegment(cb.minX, cb.maxZ, mgLeft, cb.maxZ);
    createWallSegment(mgRight, cb.maxZ, cb.maxX, cb.maxZ);
  }

  // Pillars along south boundary
  for (let x = cb.minX; x <= cb.maxX; x += 6.5) {
    if ((x > mgLeft - 0.5 && x < mgRight + 0.5) || (hasEg && x > egLeft - 0.5 && x < egRight + 0.5)) {
      continue;
    }
    createPillar(x, cb.maxZ);
  }

  // --- 2. MAIN SECURITY ENTRANCE GATE ---
  const gatePillarH = 4.2;
  const gatePillarW = 0.9;
  createPillar(mgLeft, cb.maxZ, gatePillarH, gatePillarW);
  createPillar(mgRight, cb.maxZ, gatePillarH, gatePillarW);

  // Overhead Campus Entrance Archway Sign
  const archGroup = new THREE.Group();
  archGroup.position.set(mgX, gatePillarH - 0.2, cb.maxZ);

  // Cross girder beam
  const archBeamGeo = new THREE.BoxGeometry(mgW + gatePillarW, 0.45, 0.35);
  const archBeamMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
  const archBeam = new THREE.Mesh(archBeamGeo, archBeamMat);
  archGroup.add(archBeam);

  // Sign plate with high-vis campus title
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const sCtx = signCanvas.getContext('2d');
  if (sCtx) {
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 1024, 256);
    sCtx.strokeStyle = '#38bdf8';
    sCtx.lineWidth = 12;
    sCtx.strokeRect(10, 10, 1004, 236);

    sCtx.fillStyle = '#f8fafc';
    sCtx.font = 'bold 58px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText(campusName.toUpperCase(), 512, 90);

    sCtx.fillStyle = '#38bdf8';
    sCtx.font = 'bold 36px monospace';
    sCtx.fillText('MAIN CAMPUS SECURITY ENTRANCE & EVACUATION GATE', 512, 168);
  }
  const signTex = new THREE.CanvasTexture(signCanvas);
  const signPlateGeo = new THREE.BoxGeometry(mgW * 0.88, 0.9, 0.1);
  const signPlateMat = new THREE.MeshStandardMaterial({
    map: signTex,
    roughness: 0.3,
    metalness: 0.2,
  });
  const signPlate = new THREE.Mesh(signPlateGeo, signPlateMat);
  signPlate.position.set(0, 0.65, 0);
  archGroup.add(signPlate);

  // Gate entrance lanterns (warm glowing illumination)
  [-mgW / 2 - 0.1, mgW / 2 + 0.1].forEach((lx) => {
    const lampPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
    const lampPost = new THREE.Mesh(lampPostGeo, railMat);
    lampPost.position.set(lx, 0.3, 0);
    archGroup.add(lampPost);

    const lampGlobeGeo = new THREE.SphereGeometry(0.16, 12, 12);
    const lampGlobeMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 1.5,
    });
    const lampGlobe = new THREE.Mesh(lampGlobeGeo, lampGlobeMat);
    lampGlobe.position.set(lx, 0.65, 0);
    archGroup.add(lampGlobe);
  });

  group.add(archGroup);

  // Security Guard Cabin / Gate Post
  const boothW = 2.4;
  const boothD = 2.4;
  const boothH = 2.8;
  const boothX = mgLeft - boothW / 2 - 0.4;
  const boothZ = cb.maxZ - boothD / 2 + 0.6;

  const boothGroup = new THREE.Group();
  boothGroup.position.set(boothX, 0, boothZ);

  const boothBodyGeo = new THREE.BoxGeometry(boothW, boothH, boothD);
  const boothBodyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
  const boothBody = new THREE.Mesh(boothBodyGeo, boothBodyMat);
  boothBody.position.y = boothH / 2;
  boothBody.castShadow = true;
  boothBody.receiveShadow = true;
  boothGroup.add(boothBody);

  // Roof
  const bRoofGeo = new THREE.BoxGeometry(boothW + 0.5, 0.2, boothD + 0.5);
  const bRoof = new THREE.Mesh(bRoofGeo, pillarCapMat);
  bRoof.position.y = boothH + 0.1;
  boothGroup.add(bRoof);

  // Window panels
  const bWindowMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
  });
  const bWinGeo = new THREE.PlaneGeometry(1.6, 1.0);
  const bWinFront = new THREE.Mesh(bWinGeo, bWindowMat);
  bWinFront.position.set(0, 1.5, boothD / 2 + 0.01);
  boothGroup.add(bWinFront);

  const bWinSide = new THREE.Mesh(bWinGeo, bWindowMat);
  bWinSide.rotation.y = Math.PI / 2;
  bWinSide.position.set(boothW / 2 + 0.01, 1.5, 0);
  boothGroup.add(bWinSide);

  // Raised boom barrier arm (open for emergency evacuation!)
  const barrierPostGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.1, 12);
  const barrierPostMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
  const bPost = new THREE.Mesh(barrierPostGeo, barrierPostMat);
  bPost.position.set(boothW / 2 + 0.3, 0.55, boothD / 2);
  boothGroup.add(bPost);

  const barrierArmGeo = new THREE.BoxGeometry(0.08, 0.12, 3.8);
  const barrierArmMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.3,
  });
  const bArm = new THREE.Mesh(barrierArmGeo, barrierArmMat);
  bArm.position.set(boothW / 2 + 0.3, 1.1, boothD / 2 - 1.2);
  bArm.rotation.x = -Math.PI / 3; // Swung open upwards 60 deg
  boothGroup.add(bArm);

  group.add(boothGroup);

  colliders.push({
    minX: boothX - boothW / 2,
    maxX: boothX + boothW / 2,
    minZ: boothZ - boothD / 2,
    maxZ: boothZ + boothD / 2,
    minY: 0,
    maxY: boothH,
  });

  // Emergency Muster Gate (if present)
  if (hasEg && compound.emergencyGate) {
    const egX = compound.emergencyGate.position[0];
    const egW = compound.emergencyGate.width;
    createPillar(egX - egW / 2, cb.maxZ, 3.4, 0.7);
    createPillar(egX + egW / 2, cb.maxZ, 3.4, 0.7);

    // Emergency Gate Header sign
    const egSignGeo = new THREE.BoxGeometry(egW * 0.9, 0.5, 0.08);
    const egSignMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: 0.3,
      roughness: 0.4,
    });
    const egSign = new THREE.Mesh(egSignGeo, egSignMat);
    egSign.position.set(egX, 3.2, cb.maxZ);
    group.add(egSign);
  }

  // --- 3. PERIMETER ROAD & STREET INFRASTRUCTURE ---
  const roadZ = road.position;
  const roadW = road.width;
  const roadLen = road.length || 120;
  const swW = road.sidewalkWidth || 2.5;

  // 1. Asphalt Road Tarmac Surface
  const roadGeo = new THREE.PlaneGeometry(roadLen, roadW);
  roadGeo.rotateX(-Math.PI / 2);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
    metalness: 0.05,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.position.set(0, 0.02, roadZ);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // 2. Concrete Sidewalk with Curbs (Near side: between compound wall & road)
  const nearSwZ = roadZ - roadW / 2 - swW / 2;
  const swGeo = new THREE.BoxGeometry(roadLen, 0.16, swW);
  const swMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.75,
    metalness: 0.05,
  });
  const nearSw = new THREE.Mesh(swGeo, swMat);
  nearSw.position.set(0, 0.08, nearSwZ);
  nearSw.receiveShadow = true;
  group.add(nearSw);

  // Raised Curb Edge Stone along road
  const curbGeo = new THREE.BoxGeometry(roadLen, 0.22, 0.2);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
  const nearCurb = new THREE.Mesh(curbGeo, curbMat);
  nearCurb.position.set(0, 0.11, roadZ - roadW / 2);
  group.add(nearCurb);

  // Far side sidewalk (across the street)
  const farSwZ = roadZ + roadW / 2 + swW / 2;
  const farSw = new THREE.Mesh(swGeo, swMat);
  farSw.position.set(0, 0.08, farSwZ);
  farSw.receiveShadow = true;
  group.add(farSw);

  const farCurb = new THREE.Mesh(curbGeo, curbMat);
  farCurb.position.set(0, 0.11, roadZ + roadW / 2);
  group.add(farCurb);

  // 3. Road Markings: Dashed White Center Line
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const centerStripeLen = 3.2;
  const centerStripeGap = 3.0;
  const numStripes = Math.floor(roadLen / (centerStripeLen + centerStripeGap));

  for (let i = 0; i < numStripes; i++) {
    const sx = -roadLen / 2 + i * (centerStripeLen + centerStripeGap) + centerStripeLen / 2;
    // Don't draw across crosswalks
    const inCrosswalk = road.crosswalks?.some((cw) => Math.abs(sx - cw.position) < cw.width / 2 + 1.2);
    if (inCrosswalk) continue;

    const sGeo = new THREE.PlaneGeometry(centerStripeLen, 0.22);
    sGeo.rotateX(-Math.PI / 2);
    const sMesh = new THREE.Mesh(sGeo, stripeMat);
    sMesh.position.set(sx, 0.025, roadZ);
    group.add(sMesh);
  }

  // Solid White Edge Shoulder Lines
  [-roadW / 2 + 0.35, roadW / 2 - 0.35].forEach((ey) => {
    const eGeo = new THREE.PlaneGeometry(roadLen, 0.16);
    eGeo.rotateX(-Math.PI / 2);
    const eMesh = new THREE.Mesh(eGeo, stripeMat);
    eMesh.position.set(0, 0.024, roadZ + ey);
    group.add(eMesh);
  });

  // Yellow Curb Fire Lane Striping
  const yellowCurbMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.25,
    roughness: 0.5,
  });
  const yCurbGeo = new THREE.BoxGeometry(roadLen, 0.04, 0.18);
  const yCurb = new THREE.Mesh(yCurbGeo, yellowCurbMat);
  yCurb.position.set(0, 0.21, roadZ - roadW / 2);
  group.add(yCurb);

  // 4. Pedestrian Crosswalks (Zebra Crossing)
  if (road.crosswalks) {
    road.crosswalks.forEach((cw) => {
      const cwGroup = new THREE.Group();
      cwGroup.position.set(cw.position, 0.026, roadZ);

      const numZebra = Math.floor(roadW / 0.95);
      const zGap = roadW / numZebra;
      const barGeo = new THREE.PlaneGeometry(cw.width, 0.55);
      barGeo.rotateX(-Math.PI / 2);

      for (let j = 0; j < numZebra; j++) {
        const bz = -roadW / 2 + (j + 0.5) * zGap;
        const bMesh = new THREE.Mesh(barGeo, stripeMat);
        bMesh.position.set(0, 0, bz);
        cwGroup.add(bMesh);
      }
      group.add(cwGroup);
    });
  }

  // 5. Street Light Poles along the sidewalk
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
  const lightLumMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 2.0,
  });

  const poleSpacing = 22;
  const numPoles = Math.floor(roadLen / poleSpacing);

  for (let p = 0; p < numPoles; p++) {
    const px = -roadLen / 2 + 10 + p * poleSpacing;
    const pz = nearSwZ;

    const pGroup = new THREE.Group();
    pGroup.position.set(px, 0.16, pz);

    // Vertical shaft (height 5.5m)
    const shaftGeo = new THREE.CylinderGeometry(0.09, 0.13, 5.5, 10);
    const shaft = new THREE.Mesh(shaftGeo, poleMat);
    shaft.position.y = 2.75;
    pGroup.add(shaft);

    // Overhanging curved arm extending over the road
    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8);
    armGeo.rotateZ(Math.PI / 4);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(0, 5.5, 0.7);
    arm.rotation.y = Math.PI / 2;
    pGroup.add(arm);

    // Luminaire box
    const lumGeo = new THREE.BoxGeometry(0.35, 0.14, 0.75);
    const lum = new THREE.Mesh(lumGeo, lightLumMat);
    lum.position.set(0, 5.4, 1.4);
    pGroup.add(lum);

    // Cast soft street lighting around main gate poles
    if (Math.abs(px - mgX) < 18) {
      const streetPtLight = new THREE.PointLight(0xfef08a, 1.2, 16);
      streetPtLight.position.set(0, 5.0, 1.4);
      pGroup.add(streetPtLight);
    }

    group.add(pGroup);
  }

  // 6. Street Road Signs & Fire Hydrant
  // Sign 1: Emergency Evacuation Route
  const sign1Group = new THREE.Group();
  sign1Group.position.set(mgRight + 2.5, 0.16, nearSwZ);

  const signPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8);
  const sPost = new THREE.Mesh(signPostGeo, poleMat);
  sPost.position.y = 1.4;
  sign1Group.add(sPost);

  const roadSignPlateGeo = new THREE.BoxGeometry(0.8, 0.8, 0.04);
  const roadSignPlateMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // Green emergency sign
    roughness: 0.4,
  });
  const sp1 = new THREE.Mesh(roadSignPlateGeo, roadSignPlateMat);
  sp1.position.set(0, 2.3, 0);
  sign1Group.add(sp1);
  group.add(sign1Group);

  // Fire Hydrant
  const hydrantGroup = new THREE.Group();
  hydrantGroup.position.set(mgLeft - 2.8, 0.16, roadZ - roadW / 2 + 0.4);

  const hydMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.5 });
  const hydBodyGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.75, 12);
  const hydBody = new THREE.Mesh(hydBodyGeo, hydMat);
  hydBody.position.y = 0.375;
  hydrantGroup.add(hydBody);

  const hydCapGeo = new THREE.SphereGeometry(0.15, 10, 10);
  const hydCap = new THREE.Mesh(hydCapGeo, hydMat);
  hydCap.position.y = 0.75;
  hydrantGroup.add(hydCap);
  group.add(hydrantGroup);

  // 7. Emergency Response Vehicle / Fire Engine parked on the road shoulder
  const vehicleGroup = new THREE.Group();
  vehicleGroup.position.set(mgLeft - 12.0, 0.02, roadZ - 2.4);
  vehicleGroup.rotation.y = -Math.PI / 18; // parked angled on shoulder

  const vLen = 6.8;
  const vWid = 2.4;
  const vHei = 2.4;

  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7, roughness: 0.25 });
  const darkCabMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7, roughness: 0.1 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });

  // Chassis & Body
  const cabGeo = new THREE.BoxGeometry(2.0, 1.8, vWid);
  const cab = new THREE.Mesh(cabGeo, redMat);
  cab.position.set(vLen / 2 - 1.0, 1.3, 0);
  vehicleGroup.add(cab);

  const rearBodyGeo = new THREE.BoxGeometry(vLen - 2.0, 2.1, vWid);
  const rearBody = new THREE.Mesh(rearBodyGeo, redMat);
  rearBody.position.set(-1.0, 1.45, 0);
  vehicleGroup.add(rearBody);

  // Windshield & windows
  const windshieldGeo = new THREE.PlaneGeometry(vWid * 0.85, 0.8);
  windshieldGeo.rotateY(Math.PI / 2);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(vLen / 2 + 0.01, 1.6, 0);
  vehicleGroup.add(windshield);

  // Equipment Roller Shutters on rear body
  const shutterMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
  [-vWid / 2 - 0.01, vWid / 2 + 0.01].forEach((sz) => {
    const shutGeo = new THREE.BoxGeometry(3.6, 1.2, 0.02);
    const shut = new THREE.Mesh(shutGeo, shutterMat);
    shut.position.set(-1.0, 1.4, sz);
    vehicleGroup.add(shut);
  });

  // 6 Heavy Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.35, 16);
  wheelGeo.rotateX(Math.PI / 2);
  const wheelPositions = [
    [vLen / 2 - 0.8, -vWid / 2],
    [vLen / 2 - 0.8, vWid / 2],
    [-0.8, -vWid / 2],
    [-0.8, vWid / 2],
    [-2.2, -vWid / 2],
    [-2.2, vWid / 2],
  ];
  wheelPositions.forEach(([wx, wz]) => {
    const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
    wMesh.position.set(wx, 0.48, wz);
    vehicleGroup.add(wMesh);

    // Chrome hubcap
    const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.36, 12);
    hubGeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, chromeMat);
    hub.position.set(wx, 0.48, wz);
    vehicleGroup.add(hub);
  });

  // Flashing Emergency Lightbar on cab roof
  const lightbarGroup = new THREE.Group();
  lightbarGroup.position.set(vLen / 2 - 1.0, 2.35, 0);

  const redBeaconMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 2.0,
  });
  const blueBeaconMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.0,
  });

  const bGeo = new THREE.BoxGeometry(0.35, 0.16, 0.6);
  const leftBeacon = new THREE.Mesh(bGeo, redBeaconMat);
  leftBeacon.position.set(0, 0, -0.45);
  lightbarGroup.add(leftBeacon);

  const rightBeacon = new THREE.Mesh(bGeo, blueBeaconMat);
  rightBeacon.position.set(0, 0, 0.45);
  lightbarGroup.add(rightBeacon);

  const beaconLight = new THREE.PointLight(0xef4444, 2.2, 18);
  beaconLight.position.set(0, 0.4, 0);
  lightbarGroup.add(beaconLight);

  vehicleGroup.add(lightbarGroup);
  group.add(vehicleGroup);

  colliders.push({
    minX: vehicleGroup.position.x - vLen / 2,
    maxX: vehicleGroup.position.x + vLen / 2,
    minZ: vehicleGroup.position.z - vWid / 2,
    maxZ: vehicleGroup.position.z + vWid / 2,
    minY: 0,
    maxY: vHei,
  });

  // Update animation function
  const update = (_delta: number, elapsed: number) => {
    // Flashing emergency vehicle lightbar strobe
    const strobe = Math.sin(elapsed * 12.0);
    if (strobe > 0) {
      redBeaconMat.emissiveIntensity = 3.5;
      blueBeaconMat.emissiveIntensity = 0.4;
      beaconLight.color.setHex(0xef4444);
      beaconLight.intensity = 2.5;
    } else {
      redBeaconMat.emissiveIntensity = 0.4;
      blueBeaconMat.emissiveIntensity = 3.5;
      beaconLight.color.setHex(0x38bdf8);
      beaconLight.intensity = 2.5;
    }
  };

  return {
    group,
    colliders,
    update,
  };
}
