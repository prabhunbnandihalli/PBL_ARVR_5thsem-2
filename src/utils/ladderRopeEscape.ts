import * as THREE from 'three';
import { EmergencyLadderRopeData } from '../types';

export interface LadderRopeVisualsResult {
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
  ropeMesh: THREE.Group;
  strobeLight: THREE.PointLight;
}

/**
 * Creates a unique 1st-floor exterior emergency exit station featuring:
 * - Industrial steel cantilever platform with safety diamond-plate deck & railings
 * - Vertical heavy-duty safety cage ladder from 1st floor (Y=3.6) down to ground (Y=0)
 * - Overhead crane/davit arm with rescue pulley and tactical braided knotted descent rope
 * - Ground emergency rescue landing pad / crash cushion
 * - Backlit exit signage and pulsating emergency beacons
 */
export function createEmergencyLadderRopeVisuals(
  data: EmergencyLadderRopeData
): LadderRopeVisualsResult {
  const group = new THREE.Group();
  group.name = 'emergency_ladder_rope_exit';
  const colliders: { minX: number; maxX: number; minZ: number; maxZ: number; minY?: number; maxY?: number }[] = [];

  const [px, py, pz] = data.platformPosition;
  const [gx, gy, gz] = data.groundPosition;
  const [lx, ly, lz] = data.ladderPosition;
  const [rx, ry, rz] = data.ropePosition;

  // Visual Materials
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.25,
  });

  const hazardYellowMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.35,
    roughness: 0.35,
    metalness: 0.4,
  });

  const greenExitMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.4,
  });

  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.95,
    metalness: 0.05,
  });

  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48, // Vibrant emergency rescue red
    roughness: 0.6,
    metalness: 0.1,
  });

  // --- 1. 1ST-FLOOR STEEL ESCAPE BALCONY PLATFORM ---
  const platW = 2.8; // depth extending out from building (X axis)
  const platL = 3.6; // width along building facade (Z axis)
  const platH = 0.16;

  const platGroup = new THREE.Group();
  platGroup.position.set(px, py, pz);

  // Diamond plate floor slab
  const floorGeo = new THREE.BoxGeometry(platW, platH, platL);
  const floorMesh = new THREE.Mesh(floorGeo, deckMat);
  floorMesh.position.y = -platH / 2;
  floorMesh.receiveShadow = true;
  platGroup.add(floorMesh);

  // High-visibility yellow safety edge strips along perimeter
  const edgeGeo = new THREE.BoxGeometry(platW + 0.08, 0.04, platL + 0.08);
  const edgeMesh = new THREE.Mesh(edgeGeo, hazardYellowMat);
  edgeMesh.position.y = 0.01;
  platGroup.add(edgeMesh);

  // Heavy steel diagonal cantilever support struts underneath platform anchoring to building facade
  const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8);
  [-platL / 2 + 0.3, platL / 2 - 0.3].forEach((zOff) => {
    const strut = new THREE.Mesh(strutGeo, steelMat);
    strut.position.set(0.6, -1.2, zOff);
    strut.rotation.z = Math.PI / 4;
    platGroup.add(strut);
  });

  // Safety railings around 3 outer sides of platform (leave side facing building wall open)
  const railH = 1.1;
  const railThick = 0.045;

  // Outer front railing (furthest from building: -X side)
  const frontRailGeo = new THREE.BoxGeometry(railThick, railH, platL);
  const frontRail = new THREE.Mesh(frontRailGeo, hazardYellowMat);
  frontRail.position.set(-platW / 2 + railThick / 2, railH / 2, 0);
  platGroup.add(frontRail);

  // North side railing
  const sideRailGeo = new THREE.BoxGeometry(platW, railH, railThick);
  const northRail = new THREE.Mesh(sideRailGeo, steelMat);
  northRail.position.set(0, railH / 2, -platL / 2 + railThick / 2);
  platGroup.add(northRail);

  // South side railing
  const southRail = new THREE.Mesh(sideRailGeo, steelMat);
  southRail.position.set(0, railH / 2, platL / 2 - railThick / 2);
  platGroup.add(southRail);

  // Overhead Cantilever Davit Crane Arm for Tactical Rope
  const davitGroup = new THREE.Group();
  davitGroup.position.set(rx - px, 0, rz - pz);

  // Vertical steel mast (height 2.6m above platform)
  const mastGeo = new THREE.CylinderGeometry(0.08, 0.09, 2.8, 12);
  const mast = new THREE.Mesh(mastGeo, steelMat);
  mast.position.y = 1.4;
  davitGroup.add(mast);

  // Overhead horizontal boom extending out over edge
  const boomGeo = new THREE.BoxGeometry(1.6, 0.12, 0.12);
  const boom = new THREE.Mesh(boomGeo, steelMat);
  boom.position.set(-0.6, 2.75, 0);
  davitGroup.add(boom);

  // Heavy steel diagonal gusset brace
  const braceGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
  const brace = new THREE.Mesh(braceGeo, steelMat);
  brace.position.set(-0.4, 2.3, 0);
  brace.rotation.z = Math.PI / 4;
  davitGroup.add(brace);

  // Swivel Rescue Pulley Block
  const pulleyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
  pulleyGeo.rotateZ(Math.PI / 2);
  const pulleyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.8, roughness: 0.2 });
  const pulley = new THREE.Mesh(pulleyGeo, pulleyMat);
  pulley.position.set(-1.1, 2.68, 0);
  davitGroup.add(pulley);

  platGroup.add(davitGroup);

  // Backlit Exit Door Header Signboard
  const signGroup = new THREE.Group();
  signGroup.position.set(platW / 2 - 0.1, 1.8, 0);

  const signPlateGeo = new THREE.BoxGeometry(0.1, 0.55, 2.0);
  const signPlateMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.3,
  });
  const sPlate = new THREE.Mesh(signPlateGeo, signPlateMat);
  signGroup.add(sPlate);

  const exitLightGeo = new THREE.BoxGeometry(0.12, 0.3, 1.6);
  const exitLight = new THREE.Mesh(exitLightGeo, greenExitMat);
  signGroup.add(exitLight);

  platGroup.add(signGroup);

  // Flashing Emergency Green Strobe Light
  const strobeLight = new THREE.PointLight(0x22c55e, 2.5, 14);
  strobeLight.position.set(0, 2.2, 0);
  platGroup.add(strobeLight);

  group.add(platGroup);

  // --- 2. FIXED INDUSTRIAL STEEL CAGE LADDER ---
  const ladderGroup = new THREE.Group();
  ladderGroup.position.set(lx, 0, lz);

  const totalLadderH = py + 1.1; // extends from Y=0 to 1.1m above platform floor
  const ladderW = 0.65;
  const numRungs = Math.floor(totalLadderH / 0.3);

  // Left & right tubular stringers
  const stringerGeo = new THREE.CylinderGeometry(0.035, 0.035, totalLadderH, 10);
  [-ladderW / 2, ladderW / 2].forEach((xSide) => {
    const stringer = new THREE.Mesh(stringerGeo, steelMat);
    stringer.position.set(xSide, totalLadderH / 2, 0);
    stringer.castShadow = true;
    ladderGroup.add(stringer);
  });

  // Anti-slip yellow rungs
  const rungGeo = new THREE.CylinderGeometry(0.02, 0.02, ladderW - 0.04, 8);
  rungGeo.rotateZ(Math.PI / 2);
  for (let r = 1; r < numRungs; r++) {
    const rungY = r * 0.3;
    const rung = new THREE.Mesh(rungGeo, hazardYellowMat);
    rung.position.set(0, rungY, 0);
    ladderGroup.add(rung);
  }

  // Safety Fall-Arrest Cage Hoops (starting at Y=2.0m up to Y=4.4m)
  const cageHoopGeo = new THREE.TorusGeometry(0.42, 0.02, 8, 24, Math.PI);
  cageHoopGeo.rotateX(Math.PI / 2);
  const numHoops = 5;
  for (let h = 0; h < numHoops; h++) {
    const hoopY = 2.0 + h * 0.6;
    const hoop = new THREE.Mesh(cageHoopGeo, steelMat);
    hoop.position.set(0, hoopY, -0.15);
    ladderGroup.add(hoop);
  }

  // Vertical cage backstraps
  const strapGeo = new THREE.BoxGeometry(0.03, 2.6, 0.015);
  [-0.32, 0, 0.32].forEach((sx) => {
    const strap = new THREE.Mesh(strapGeo, steelMat);
    strap.position.set(sx, 3.2, -0.42);
    ladderGroup.add(strap);
  });

  group.add(ladderGroup);

  // --- 3. TACTICAL BRAIDED KNOTTED RESCUE DESCENT ROPE ---
  const ropeGroup = new THREE.Group();
  ropeGroup.position.set(rx, 0, rz);

  const ropeTotalH = py + 2.68; // drops from davit pulley to ground
  const ropeRadius = 0.032;

  // Main vertical rope core cylinder
  const ropeCoreGeo = new THREE.CylinderGeometry(ropeRadius, ropeRadius, ropeTotalH, 10);
  const ropeCore = new THREE.Mesh(ropeCoreGeo, ropeMat);
  ropeCore.position.y = ropeTotalH / 2;
  ropeCore.castShadow = true;
  ropeGroup.add(ropeCore);

  // Tactical knots every 0.6m for emergency slide grip
  const numKnots = Math.floor(ropeTotalH / 0.6);
  const knotGeo = new THREE.SphereGeometry(ropeRadius * 2.2, 10, 8);
  for (let k = 1; k < numKnots; k++) {
    const knotY = k * 0.6;
    const knot = new THREE.Mesh(knotGeo, hazardYellowMat);
    knot.position.set(0, knotY, 0);
    ropeGroup.add(knot);
  }

  // Heavy metal weighted bottom stopper ring resting on the pad
  const weightGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.22, 12);
  const weight = new THREE.Mesh(weightGeo, steelMat);
  weight.position.set(0, 0.11, 0);
  ropeGroup.add(weight);

  group.add(ropeGroup);

  // --- 4. GROUND SAFETY AIR CUSHION / RESCUE MAT ---
  const cushionGroup = new THREE.Group();
  cushionGroup.position.set(gx, gy, gz);

  // High-density rescue cushion
  const matW = 2.6;
  const matL = 2.4;
  const matH = 0.16;

  const matGeo = new THREE.BoxGeometry(matW, matH, matL);
  const matMesh = new THREE.Mesh(matGeo, cushionMat);
  matMesh.position.y = matH / 2;
  matMesh.receiveShadow = true;
  cushionGroup.add(matMesh);

  // High-vis yellow safety border & landing cross
  const borderGeo = new THREE.BoxGeometry(matW + 0.1, 0.03, matL + 0.1);
  const borderMesh = new THREE.Mesh(borderGeo, hazardYellowMat);
  borderMesh.position.y = matH + 0.01;
  cushionGroup.add(borderMesh);

  // Target center landing cross
  const cross1Geo = new THREE.PlaneGeometry(1.6, 0.24);
  cross1Geo.rotateX(-Math.PI / 2);
  const cross1 = new THREE.Mesh(cross1Geo, hazardYellowMat);
  cross1.position.y = matH + 0.02;
  cushionGroup.add(cross1);

  const cross2Geo = new THREE.PlaneGeometry(0.24, 1.6);
  cross2Geo.rotateX(-Math.PI / 2);
  const cross2 = new THREE.Mesh(cross2Geo, hazardYellowMat);
  cross2.position.y = matH + 0.021;
  cushionGroup.add(cross2);

  // Pulsing holographic beacon ring on ground pad
  const beaconGeo = new THREE.RingGeometry(1.4, 1.55, 32);
  beaconGeo.rotateX(-Math.PI / 2);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  const beaconRing = new THREE.Mesh(beaconGeo, beaconMat);
  beaconRing.position.y = matH + 0.025;
  cushionGroup.add(beaconRing);

  group.add(cushionGroup);

  // --- 5. COLLIDERS ---
  // Platform railings colliders so cadet doesn't walk off sides (front, north, south)
  colliders.push({
    minX: px - platW / 2 - 0.2,
    maxX: px - platW / 2 + 0.2,
    minZ: pz - platL / 2,
    maxZ: pz + platL / 2,
    minY: py,
    maxY: py + railH,
  });
  colliders.push({
    minX: px - platW / 2,
    maxX: px + platW / 2,
    minZ: pz - platL / 2 - 0.2,
    maxZ: pz - platL / 2 + 0.2,
    minY: py,
    maxY: py + railH,
  });
  colliders.push({
    minX: px - platW / 2,
    maxX: px + platW / 2,
    minZ: pz + platL / 2 - 0.2,
    maxZ: pz + platL / 2 + 0.2,
    minY: py,
    maxY: py + railH,
  });

  // Dynamic animation loop update
  const update = (_delta: number, elapsed: number) => {
    // 1. Emergency green strobe light pulse
    strobeLight.intensity = 2.0 + Math.sin(elapsed * 8.0) * 1.5;

    // 2. Realistic catenary rope sway in the breeze
    const swayX = Math.sin(elapsed * 2.2) * 0.035;
    const swayZ = Math.cos(elapsed * 1.8) * 0.025;
    ropeGroup.rotation.z = swayX;
    ropeGroup.rotation.x = swayZ;

    // 3. Ground beacon ring pulse
    beaconMat.opacity = 0.45 + Math.sin(elapsed * 5.0) * 0.35;
  };

  return {
    group,
    colliders,
    update,
    ropeMesh: ropeGroup,
    strobeLight,
  };
}
