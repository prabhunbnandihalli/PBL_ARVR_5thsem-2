import * as THREE from 'three';
import { WalkableStaircase } from '../types';

// Cache generated canvas textures for high performance
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a procedural crisp terrazzo/linoleum tile texture
 */
export function getTileTexture(color1: string, color2: string, size = 256): THREE.CanvasTexture {
  const key = `tile_${color1}_${color2}_${size}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Base tile color
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, size, size);

    // Subtle checkerboard pattern
    ctx.fillStyle = color2;
    const half = size / 2;
    ctx.fillRect(0, 0, half, half);
    ctx.fillRect(half, half, half, half);

    // Crisp grid grout line
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);
    ctx.strokeRect(0, 0, half, half);
    ctx.strokeRect(half, half, half, half);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates an outdoor turf / grass field texture
 */
export function getGrassTexture(size = 256): THREE.CanvasTexture {
  const key = `grass_${size}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, size, size);

    // Athletic field lawn stripes
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 0, size, size / 2);

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, size - 8, size - 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates an emergency exit sign texture with glowing green background and running person icon
 */
/**
 * Creates an emergency exit sign texture with glowing green background, running-man icon and directional arrow
 */
export function getExitSignTexture(direction: 'left' | 'right' = 'right'): THREE.CanvasTexture {
  const key = `exit_sign_${direction}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Green safety background
    ctx.fillStyle = '#047857';
    ctx.fillRect(0, 0, 512, 160);

    // Inner bevel gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 160);
    grad.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 160);

    // Glowing border
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 148);

    // Running-man silhouette
    ctx.fillStyle = '#ffffff';
    // Head
    const manX = direction === 'right' ? 80 : 432;
    ctx.beginPath();
    ctx.arc(manX, 50, 16, 0, Math.PI * 2);
    ctx.fill();
    // Torso
    ctx.beginPath();
    ctx.roundRect(manX - 8, 70, 16, 45, 6);
    ctx.fill();
    // Legs
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(manX - 4, 110);
    ctx.lineTo(manX - 22, 145);
    ctx.moveTo(manX + 4, 110);
    ctx.lineTo(manX + 22, 145);
    ctx.stroke();

    // Central Bold EXIT
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 76px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', 256, 75);

    // Arrow
    const arrowX = direction === 'right' ? 425 : 85;
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(direction === 'right' ? '➜' : '⬅', arrowX, 75);

    // Subtitle
    ctx.fillStyle = '#d1fae5';
    ctx.font = 'bold 18px monospace';
    ctx.letterSpacing = '3px';
    ctx.fillText('EMERGENCY EVACUATION ROUTE', 256, 132);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates an ANSI / OSHA standard Emergency Exit Placard for the door leaf
 */
export function getEmergencyDoorPlacardTexture(doorLabel?: string, infoNotice?: string): THREE.CanvasTexture {
  const key = `emergency_placard_${doorLabel || 'default'}_${infoNotice || 'default'}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // White backing plate
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 360);

    // Heavy black outer border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 352);

    // Red Header block
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(8, 8, 496, 95);

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ EMERGENCY EXIT ★', 256, 42);

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('ALARM WILL SOUND WHEN OPENED', 256, 78);

    // Main action instruction
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('PUSH BAR TO OPEN', 256, 145);

    // Green egress route badge
    ctx.fillStyle = '#059669';
    ctx.roundRect(40, 180, 432, 60, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    const displayLabel = doorLabel ? doorLabel.toUpperCase() : 'DESIGNATED EVACUATION ROUTE';
    ctx.fillText(`➜ ${displayLabel} ➜`, 256, 212);

    // Specific instruction / notice
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(infoNotice || 'PROCEED TO ASSEMBLY AREA • DO NOT DELAY', 256, 275);

    // Bottom warning
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('DO NOT BLOCK DOOR OR OBSTRUCT STAIRWAY AT ANY TIME', 256, 320);

    // Corner rivet screw details
    ctx.fillStyle = '#64748b';
    [
      [22, 22],
      [490, 22],
      [22, 338],
      [490, 338],
    ].forEach(([rx, ry]) => {
      ctx.beginPath();
      ctx.arc(rx, ry, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates a modern architectural Room Information Board for the door leaf
 */
export function getRoomDoorPlacardTexture(roomTitle?: string, infoNotice?: string): THREE.CanvasTexture {
  const title = (roomTitle || 'Room').toUpperCase();
  const key = `room_placard_${title}_${infoNotice || 'default'}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Dark executive matte acrylic background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 360);

    // Bevel frame
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.strokeRect(4, 4, 504, 352);

    // Left cyan accent stripe
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(8, 8, 16, 344);

    // Room Title Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, 42, 35);

    // Cyan underline
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(42, 75, 430, 3);

    // Info notice
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 19px monospace';
    ctx.fillText(infoNotice || 'INSTRUCTIONAL FACILITY', 42, 95);

    // Safety instructions box
    ctx.fillStyle = '#1e293b';
    ctx.roundRect(42, 135, 430, 130, 8);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 17px monospace';
    ctx.fillText('⚠ SAFETY & EMERGENCY PROTOCOL', 60, 155);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('• In event of alarm, vacate immediately', 60, 185);
    ctx.fillText('• Close door upon exit to retard fire/smoke', 60, 212);
    ctx.fillText('• DO NOT use elevators - follow green floor guides', 60, 239);

    // Bottom Braille simulation dots
    ctx.fillStyle = '#64748b';
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.arc(55 + i * 24, 305, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(63 + i * 24, 318, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Corner brushed brass mounting standoffs
    ctx.fillStyle = '#d4d4d8';
    [
      [22, 22],
      [490, 22],
      [22, 338],
      [490, 338],
    ].forEach(([rx, ry]) => {
      ctx.beginPath();
      ctx.arc(rx, ry, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates an overhead transom room name signboard
 */
export function getOverheadRoomSignTexture(roomTitle?: string): THREE.CanvasTexture {
  const title = (roomTitle || 'ROOM').toUpperCase();
  const key = `overhead_room_sign_${title}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Dark acrylic background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 160);

    // Border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 152);

    // Accent header line
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(8, 8, 496, 6);

    // Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 256, 75);

    // Subtitle
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('CAMPUS SAFETY MONITORED ZONE', 256, 125);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates instruction plate for the panic push bar
 */
export function getPushBarInstructionTexture(isEmergency: boolean): THREE.CanvasTexture {
  const key = `push_bar_${isEmergency ? 'emergency' : 'normal'}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = isEmergency ? '#dc2626' : '#1e293b';
    ctx.fillRect(0, 0, 512, 80);

    // Hazard stripes at ends
    ctx.fillStyle = isEmergency ? '#facc15' : '#475569';
    for (let x = 0; x < 60; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 10, 0);
      ctx.lineTo(x - 5, 80);
      ctx.lineTo(x - 15, 80);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(512 - x, 0);
      ctx.lineTo(512 - x - 10, 0);
      ctx.lineTo(512 - x + 5, 80);
      ctx.lineTo(512 - x + 15, 80);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isEmergency ? '◄ PUSH BAR TO OPEN ►' : '◄ PUSH TO ENTER / PULL TO EXIT ►', 256, 40);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates a clear room label placard texture (legacy wrapper)
 */
export function getRoomLabelTexture(label: string): THREE.CanvasTexture {
  return getRoomDoorPlacardTexture(label);
}

/**
 * Creates an architectural 3D wall with realistic baseboard trim, top coping molding,
 * and optional decorative accent or signage.
 */
export function createArchitecturalWall(
  start: [number, number],
  end: [number, number],
  height: number,
  baseColor: string = '#cbd5e1',
  label?: string,
  baseY: number = 0
): {
  meshGroup: THREE.Group;
  collider: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number };
} {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  const thickness = 0.4;

  const wallGroup = new THREE.Group();
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[1] + end[1]) / 2;
  wallGroup.position.set(midX, baseY, midZ);
  wallGroup.rotation.y = -angle;

  // 1. Main Wall Body
  const wallGeo = new THREE.BoxGeometry(length, height, thickness);
  const wallMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(baseColor),
    roughness: 0.55,
    metalness: 0.1,
  });
  const mainWall = new THREE.Mesh(wallGeo, wallMat);
  mainWall.position.y = height / 2;
  mainWall.castShadow = true;
  mainWall.receiveShadow = true;
  wallGroup.add(mainWall);

  // 2. Baseboard Trim along the bottom (contrasting darker trim to ground the wall visually)
  const baseboardHeight = 0.16;
  const baseboardThickness = thickness + 0.04;
  const baseboardGeo = new THREE.BoxGeometry(length, baseboardHeight, baseboardThickness);
  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Dark charcoal
    roughness: 0.5,
  });
  const baseboard = new THREE.Mesh(baseboardGeo, baseboardMat);
  baseboard.position.y = baseboardHeight / 2;
  baseboard.castShadow = true;
  baseboard.receiveShadow = true;
  wallGroup.add(baseboard);

  // 3. Top Wall Coping / Crown Molding
  const crownHeight = 0.12;
  const crownThickness = thickness + 0.04;
  const crownGeo = new THREE.BoxGeometry(length, crownHeight, crownThickness);
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Architectural steel/slate
    roughness: 0.4,
  });
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.position.y = height - crownHeight / 2;
  crown.castShadow = true;
  wallGroup.add(crown);

  // 4. Safety Accent Stripe along wall at 1.1m (evacuation path reference stripe)
  const stripeGeo = new THREE.BoxGeometry(length, 0.08, thickness + 0.01);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: baseColor.includes('#ef4444') ? 0xef4444 : 0x059669,
    emissive: baseColor.includes('#ef4444') ? 0xb91c1c : 0x047857,
    emissiveIntensity: 0.4,
    roughness: 0.3,
  });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = 1.1;
  wallGroup.add(stripe);

  // 5. Room label plaque if provided
  if (label && length > 3) {
    const labelTex = getRoomLabelTexture(label);
    const plaqueGeo = new THREE.PlaneGeometry(1.6, 0.45);
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: labelTex,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });
    // Front side plaque
    const plaqueFront = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaqueFront.position.set(0, 1.8, thickness / 2 + 0.02);
    wallGroup.add(plaqueFront);

    // Back side plaque
    const plaqueBack = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaqueBack.position.set(0, 1.8, -thickness / 2 - 0.02);
    plaqueBack.rotation.y = Math.PI;
    wallGroup.add(plaqueBack);
  }

  // Collider approximation with vertical elevation bounds
  const padding = 0.35;
  const collider = {
    minX: Math.min(start[0], end[0]) - padding,
    maxX: Math.max(start[0], end[0]) + padding,
    minZ: Math.min(start[1], end[1]) - padding,
    maxZ: Math.max(start[1], end[1]) + padding,
    minY: baseY,
    maxY: baseY + height,
  };

  return { meshGroup: wallGroup, collider };
}

/**
 * Creates an illuminated 3D Emergency Exit Door Portal with open/close swinging door leaf
 */
export interface DoorRig {
  id: string;
  group: THREE.Group;
  position: [number, number, number];
  isOpen: boolean;
  targetAngle: number;
  currentAngle: number;
  isEmergency: boolean;
  leafGroup: THREE.Group;
  collider: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number };
  toggle: () => boolean;
  open: () => void;
  close: () => void;
  update: (delta: number) => void;
}

export function createInteractiveDoorPortal(
  position: [number, number, number],
  isEmergency: boolean,
  initiallyOpen: boolean = false,
  id: string = `door_${Math.random()}`,
  rotationY: number = 0,
  ceilingHeight: number = 4.2,
  doorLabel?: string,
  infoBoardText?: string
): DoorRig {
  const group = new THREE.Group();
  group.position.set(...position);
  if (rotationY !== 0) {
    group.rotation.y = rotationY;
  }

  // Standard wall openings are 3.0m wide (3.2m for main exterior double doors)
  const isMainExterior = isEmergency && (Math.abs(position[2] - 14) < 1.2 || Math.abs(position[2] - 16) < 1.2);
  const frameWidth = isMainExterior ? 3.2 : 3.0;
  const frameHeight = 3.2;
  const frameDepth = 0.44; // Matches wall thickness 0.4m
  const postThickness = 0.15;

  // 1. Frame Posts & Lintel
  const postGeo = new THREE.BoxGeometry(postThickness, frameHeight, frameDepth);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });

  const leftPost = new THREE.Mesh(postGeo, postMat);
  leftPost.position.set(-frameWidth / 2 + postThickness / 2, frameHeight / 2, 0);
  leftPost.castShadow = true;
  group.add(leftPost);

  const rightPost = new THREE.Mesh(postGeo, postMat);
  rightPost.position.set(frameWidth / 2 - postThickness / 2, frameHeight / 2, 0);
  rightPost.castShadow = true;
  group.add(rightPost);

  const lintelGeo = new THREE.BoxGeometry(frameWidth, postThickness * 1.5, frameDepth);
  const lintel = new THREE.Mesh(lintelGeo, postMat);
  lintel.position.set(0, frameHeight - postThickness * 0.75, 0);
  lintel.castShadow = true;
  group.add(lintel);

  // Architectural Wall-Fitting Architrave Casings (trim that overlaps and fits seamlessly to the adjoining wall)
  const casingWidth = 0.14;
  const casingDepth = frameDepth + 0.08;
  const casingMat = new THREE.MeshStandardMaterial({
    color: isEmergency ? 0x1e293b : 0x475569,
    roughness: 0.35,
  });

  const leftCasing = new THREE.Mesh(new THREE.BoxGeometry(casingWidth, frameHeight, casingDepth), casingMat);
  leftCasing.position.set(-frameWidth / 2, frameHeight / 2, 0);
  leftCasing.castShadow = true;
  group.add(leftCasing);

  const rightCasing = new THREE.Mesh(new THREE.BoxGeometry(casingWidth, frameHeight, casingDepth), casingMat);
  rightCasing.position.set(frameWidth / 2, frameHeight / 2, 0);
  rightCasing.castShadow = true;
  group.add(rightCasing);

  const topCasing = new THREE.Mesh(new THREE.BoxGeometry(frameWidth + casingWidth * 2, casingWidth, casingDepth), casingMat);
  topCasing.position.set(0, frameHeight + casingWidth / 2, 0);
  topCasing.castShadow = true;
  group.add(topCasing);

  // Wall header / transom lintel connecting top of door frame to the ceiling
  if (ceilingHeight > frameHeight) {
    const transomHeight = ceilingHeight - frameHeight;
    const transomGeo = new THREE.BoxGeometry(frameWidth, transomHeight, frameDepth);
    const transomMat = new THREE.MeshStandardMaterial({
      color: isEmergency ? 0x1e293b : 0x334155,
      roughness: 0.55,
    });
    const transom = new THREE.Mesh(transomGeo, transomMat);
    transom.position.set(0, frameHeight + transomHeight / 2, 0);
    transom.castShadow = true;
    transom.receiveShadow = true;
    group.add(transom);
  }

  // Metal floor threshold sill
  const sillGeo = new THREE.BoxGeometry(frameWidth, 0.04, frameDepth);
  const sillMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
  const sill = new THREE.Mesh(sillGeo, sillMat);
  sill.position.set(0, 0.02, 0);
  group.add(sill);

  // 2. Hinged Door Leaf Assembly
  // Hinge is mounted on the left post interior edge
  const hingeX = -frameWidth / 2 + postThickness;
  const leafGroup = new THREE.Group();
  leafGroup.position.set(hingeX, 0, 0);

  const leafWidth = frameWidth - postThickness * 2;
  const leafHeight = frameHeight - postThickness * 1.5;
  const leafThickness = 0.09;

  // Door leaf slab (centered on half-width so it pivots from the hinge)
  const leafGeo = new THREE.BoxGeometry(leafWidth, leafHeight, leafThickness);
  leafGeo.translate(leafWidth / 2, leafHeight / 2, 0);

  const doorMat = new THREE.MeshStandardMaterial({
    color: isEmergency ? 0xb91c1c : 0x1e3a8a, // Fire red or deep navy
    roughness: 0.45,
    metalness: 0.2,
  });
  const leafMesh = new THREE.Mesh(leafGeo, doorMat);
  leafMesh.castShadow = true;
  leafMesh.receiveShadow = true;
  leafGroup.add(leafMesh);

  // Wire glass inspection window
  const windowGeo = new THREE.BoxGeometry(0.5, 0.95, 0.1);
  windowGeo.translate(leafWidth * 0.68, leafHeight * 0.62, 0);
  const windowMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.65,
    roughness: 0.1,
    transmission: 0.6,
  });
  const doorWindow = new THREE.Mesh(windowGeo, windowMat);
  leafGroup.add(doorWindow);

  // Panic push bar (emergency push release)
  const barGeo = new THREE.CylinderGeometry(0.03, 0.03, leafWidth * 0.8, 8);
  barGeo.rotateZ(Math.PI / 2);
  const barMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  const pushBar = new THREE.Mesh(barGeo, barMat);
  pushBar.position.set(leafWidth * 0.5, 1.15, 0.08);
  leafGroup.add(pushBar);

  // Reverse side push bar
  const pushBarBack = new THREE.Mesh(barGeo, barMat);
  pushBarBack.position.set(leafWidth * 0.5, 1.15, -0.08);
  leafGroup.add(pushBarBack);

  // Push bar instruction plate mounted just above the bar
  const instTex = getPushBarInstructionTexture(isEmergency);
  const instGeo = new THREE.PlaneGeometry(leafWidth * 0.72, 0.12);
  const instMat = new THREE.MeshStandardMaterial({
    map: instTex,
    roughness: 0.25,
    emissive: isEmergency ? 0x991b1b : 0x0f172a,
    emissiveIntensity: 0.35,
  });
  const instFront = new THREE.Mesh(instGeo, instMat);
  instFront.position.set(leafWidth * 0.5, 1.28, leafThickness / 2 + 0.012);
  leafGroup.add(instFront);

  const instBack = new THREE.Mesh(instGeo, instMat);
  instBack.position.set(leafWidth * 0.5, 1.28, -leafThickness / 2 - 0.012);
  instBack.rotation.y = Math.PI;
  leafGroup.add(instBack);

  // --- OFFICIAL INFORMATION BOARD ON DOOR LEAF (at eye level, pivots with door) ---
  const boardW = 0.68;
  const boardH = 0.46;
  const boardD = 0.024;
  const boardX = leafWidth * 0.32;
  const boardY = 1.70;

  // Board backing housing
  const boardBackingGeo = new THREE.BoxGeometry(boardW, boardH, boardD);
  const boardBackingMat = new THREE.MeshStandardMaterial({
    color: isEmergency ? 0x7f1d1d : 0x0f172a,
    roughness: 0.3,
    metalness: 0.5,
  });

  // Front information board
  const boardFrontGroup = new THREE.Group();
  boardFrontGroup.position.set(boardX, boardY, leafThickness / 2 + boardD / 2);
  const boardMeshFront = new THREE.Mesh(boardBackingGeo, boardBackingMat);
  boardFrontGroup.add(boardMeshFront);

  const frontPlacardTex = isEmergency
    ? getEmergencyDoorPlacardTexture(doorLabel, infoBoardText)
    : getRoomDoorPlacardTexture(doorLabel, infoBoardText);
  const placardFrontMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(boardW - 0.02, boardH - 0.02),
    new THREE.MeshStandardMaterial({
      map: frontPlacardTex,
      roughness: 0.2,
      emissive: isEmergency ? 0x450a0a : 0x090d16,
      emissiveIntensity: 0.25,
    })
  );
  placardFrontMesh.position.z = boardD / 2 + 0.002;
  boardFrontGroup.add(placardFrontMesh);
  leafGroup.add(boardFrontGroup);

  // Back information board (facing the opposite side)
  const boardBackGroup = new THREE.Group();
  boardBackGroup.position.set(boardX, boardY, -leafThickness / 2 - boardD / 2);
  const boardMeshBack = new THREE.Mesh(boardBackingGeo, boardBackingMat);
  boardBackGroup.add(boardMeshBack);

  const backPlacardTex = isEmergency
    ? getEmergencyDoorPlacardTexture(doorLabel, infoBoardText)
    : getRoomDoorPlacardTexture(doorLabel, infoBoardText);
  const placardBackMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(boardW - 0.02, boardH - 0.02),
    new THREE.MeshStandardMaterial({
      map: backPlacardTex,
      roughness: 0.2,
      emissive: isEmergency ? 0x450a0a : 0x090d16,
      emissiveIntensity: 0.25,
    })
  );
  placardBackMesh.position.z = -boardD / 2 - 0.002;
  placardBackMesh.rotation.y = Math.PI;
  boardBackGroup.add(placardBackMesh);
  leafGroup.add(boardBackGroup);

  // Bottom kick-plate (protective metal plate)
  const kickGeo = new THREE.BoxGeometry(leafWidth, 0.38, 0.1);
  kickGeo.translate(leafWidth / 2, 0.19, 0);
  const kickMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
  const kickPlate = new THREE.Mesh(kickGeo, kickMat);
  leafGroup.add(kickPlate);

  group.add(leafGroup);

  // --- 3. OVERHEAD DOUBLE-SIDED SIGN & INFO BOARDS MOUNTED DIRECTLY ON TOP LINTEL CASING ---
  // The sign spans cleanly over the door casing with front and back visible panels flush with wall casing
  const signHousingWidth = 1.48;
  const signHousingHeight = 0.42;
  const signHousingDepth = casingDepth + 0.06; // Extends slightly past casing so it never clips into walls!
  const signY = frameHeight + 0.22;

  // Solid structural mounting bracket and housing
  const housingGeo = new THREE.BoxGeometry(signHousingWidth, signHousingHeight, signHousingDepth);
  const housingMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.6,
  });
  const signHousing = new THREE.Mesh(housingGeo, housingMat);
  signHousing.position.set(0, signY, 0);
  signHousing.castShadow = true;
  group.add(signHousing);

  // Mounting brackets on left and right anchoring to lintel
  [-signHousingWidth / 2 + 0.08, signHousingWidth / 2 - 0.08].forEach((bx) => {
    const bracketMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.18, signHousingDepth + 0.02),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.2 })
    );
    bracketMesh.position.set(bx, signY - signHousingHeight / 2 - 0.05, 0);
    group.add(bracketMesh);
  });

  if (isEmergency) {
    // Front face glowing Exit sign
    const exitFrontTex = getExitSignTexture('right');
    const exitFrontMat = new THREE.MeshStandardMaterial({
      map: exitFrontTex,
      emissive: 0x10b981,
      emissiveIntensity: 0.95,
      roughness: 0.15,
    });
    const exitFront = new THREE.Mesh(new THREE.PlaneGeometry(signHousingWidth - 0.04, signHousingHeight - 0.04), exitFrontMat);
    exitFront.position.set(0, signY, signHousingDepth / 2 + 0.003);
    group.add(exitFront);

    // Back face glowing Exit sign (with inverted arrow for return egress orientation)
    const exitBackTex = getExitSignTexture('left');
    const exitBackMat = new THREE.MeshStandardMaterial({
      map: exitBackTex,
      emissive: 0x10b981,
      emissiveIntensity: 0.95,
      roughness: 0.15,
    });
    const exitBack = new THREE.Mesh(new THREE.PlaneGeometry(signHousingWidth - 0.04, signHousingHeight - 0.04), exitBackMat);
    exitBack.position.set(0, signY, -signHousingDepth / 2 - 0.003);
    exitBack.rotation.y = Math.PI;
    group.add(exitBack);

    // Dual emergency green illumination beams
    const exitLightFront = new THREE.PointLight(0x34d399, 2.4, 8.0);
    exitLightFront.position.set(0, signY, signHousingDepth / 2 + 0.35);
    group.add(exitLightFront);

    const exitLightBack = new THREE.PointLight(0x34d399, 2.4, 8.0);
    exitLightBack.position.set(0, signY, -signHousingDepth / 2 - 0.35);
    group.add(exitLightBack);
  } else {
    // Non-emergency standard room overhead board
    const roomSignTex = getOverheadRoomSignTexture(doorLabel);
    const roomSignMat = new THREE.MeshStandardMaterial({
      map: roomSignTex,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      roughness: 0.25,
    });

    const roomFront = new THREE.Mesh(new THREE.PlaneGeometry(signHousingWidth - 0.04, signHousingHeight - 0.04), roomSignMat);
    roomFront.position.set(0, signY, signHousingDepth / 2 + 0.003);
    group.add(roomFront);

    const roomBack = new THREE.Mesh(new THREE.PlaneGeometry(signHousingWidth - 0.04, signHousingHeight - 0.04), roomSignMat);
    roomBack.position.set(0, signY, -signHousingDepth / 2 - 0.003);
    roomBack.rotation.y = Math.PI;
    group.add(roomBack);

    // Subtle architectural cyan LED lights
    const roomLightFront = new THREE.PointLight(0x38bdf8, 1.2, 5.0);
    roomLightFront.position.set(0, signY, signHousingDepth / 2 + 0.3);
    group.add(roomLightFront);

    const roomLightBack = new THREE.PointLight(0x38bdf8, 1.2, 5.0);
    roomLightBack.position.set(0, signY, -signHousingDepth / 2 - 0.3);
    group.add(roomLightBack);
  }

  // Door state & animation controller
  let isOpen = initiallyOpen;
  const maxOpenAngle = -Math.PI * 0.48; // Swing inwards ~86 degrees
  let currentAngle = initiallyOpen ? maxOpenAngle : 0;
  let targetAngle = currentAngle;
  leafGroup.rotation.y = currentAngle;

  // Compute collider orientation based on door rotation and floor elevation
  const isZAligned = Math.abs(Math.sin(rotationY)) > 0.5;
  const collider = isZAligned
    ? {
        minX: position[0] - 0.3,
        maxX: position[0] + 0.3,
        minZ: position[2] - frameWidth / 2,
        maxZ: position[2] + frameWidth / 2,
        minY: position[1],
        maxY: position[1] + frameHeight,
      }
    : {
        minX: position[0] - frameWidth / 2,
        maxX: position[0] + frameWidth / 2,
        minZ: position[2] - 0.3,
        maxZ: position[2] + 0.3,
        minY: position[1],
        maxY: position[1] + frameHeight,
      };

  const doorRig: DoorRig = {
    id,
    group,
    position,
    isOpen,
    targetAngle,
    currentAngle,
    isEmergency,
    leafGroup,
    collider,
    toggle() {
      isOpen = !isOpen;
      doorRig.isOpen = isOpen;
      doorRig.targetAngle = isOpen ? maxOpenAngle : 0;
      return isOpen;
    },
    open() {
      isOpen = true;
      doorRig.isOpen = true;
      doorRig.targetAngle = maxOpenAngle;
    },
    close() {
      isOpen = false;
      doorRig.isOpen = false;
      doorRig.targetAngle = 0;
    },
    update(delta: number) {
      // Smooth animated door swing
      if (Math.abs(currentAngle - doorRig.targetAngle) > 0.005) {
        currentAngle = THREE.MathUtils.lerp(currentAngle, doorRig.targetAngle, delta * 6.5);
        leafGroup.rotation.y = currentAngle;
        doorRig.currentAngle = currentAngle;
      }
    },
  };

  return doorRig;
}

/**
 * Backward compatibility wrapper
 */
export function createExitDoorPortal(position: [number, number, number], isEmergency: boolean): THREE.Group {
  return createInteractiveDoorPortal(position, isEmergency).group;
}

/**
 * Creates a procedural high-fidelity commercial acoustic drop-ceiling tile texture
 */
export function getAcousticCeilingTexture(size = 512): THREE.CanvasTexture {
  const key = `ceiling_acoustic_${size}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Base acoustic panel off-white
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, size, size);

    // Grid of 4x4 acoustic panels in texture tile
    const numPanels = 4;
    const panelSize = size / numPanels;

    for (let r = 0; r < numPanels; r++) {
      for (let c = 0; c < numPanels; c++) {
        const px = c * panelSize;
        const py = r * panelSize;

        // Subtle panel variation
        const shade = 240 + Math.floor((r * 7 + c * 13) % 12);
        ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 4})`;
        ctx.fillRect(px + 2, py + 2, panelSize - 4, panelSize - 4);

        // Sound-absorbing micro-fissure stippling
        ctx.fillStyle = 'rgba(100, 116, 139, 0.15)';
        for (let s = 0; s < 18; s++) {
          const dotX = px + 6 + ((s * 37) % (panelSize - 12));
          const dotY = py + 6 + ((s * 59) % (panelSize - 12));
          ctx.beginPath();
          ctx.arc(dotX, dotY, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Panel inner bevel shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 3, py + 3, panelSize - 6, panelSize - 6);
      }
    }

    // Metallic T-bar grid runners
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    for (let i = 0; i <= numPanels; i++) {
      const pos = i * panelSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates an exterior commercial roof membrane texture
 */
export function getRoofMembraneTexture(size = 256): THREE.CanvasTexture {
  const key = `roof_membrane_${size}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, size, size);

    // Bituminous membrane sheets
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size / 2);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  textureCache.set(key, texture);
  return texture;
}

export interface CeilingRig {
  group: THREE.Group;
  height: number;
  indoorBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  setTacticalMode: (isTactical: boolean) => void;
  update: (delta: number) => void;
  dispose: () => void;
}

export function createBuildingCeilingStructure(options: {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  height: number;
  corridorLightPositions?: THREE.Vector3[];
  theme?: 'school' | 'college' | 'university';
}): CeilingRig {
  const { bounds, height, corridorLightPositions = [] } = options;
  const group = new THREE.Group();
  group.name = 'building_ceiling_structure';

  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const midX = (bounds.minX + bounds.maxX) / 2;
  const midZ = (bounds.minZ + bounds.maxZ) / 2;

  // 1. Interior Acoustic Tile Drop Ceiling Slab (Faces downward, normal points -Y)
  const ceilingGeo = new THREE.PlaneGeometry(width, depth);
  ceilingGeo.rotateX(Math.PI / 2); // Faces downwards into the room
  const ceilingMat = new THREE.MeshStandardMaterial({
    map: getAcousticCeilingTexture(),
    roughness: 0.82,
    metalness: 0.05,
    side: THREE.FrontSide,
  });
  const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceilingMesh.position.set(midX, height, midZ);
  ceilingMesh.receiveShadow = true;
  group.add(ceilingMesh);

  // 2. Exterior Weatherproof Roof Cap Slab (Faces upward, normal points +Y)
  const roofGeo = new THREE.PlaneGeometry(width, depth);
  roofGeo.rotateX(-Math.PI / 2); // Faces upwards into the open sky
  const roofMat = new THREE.MeshStandardMaterial({
    map: getRoofMembraneTexture(),
    roughness: 0.9,
    metalness: 0.1,
    side: THREE.FrontSide,
  });
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.set(midX, height + 0.22, midZ);
  roofMesh.receiveShadow = true;
  group.add(roofMesh);

  // 3. Roof Perimeter Coping & Parapet Fascia
  const parapetMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.4,
  });

  const parapetThickness = 0.45;
  const parapetHeight = 0.32;

  // North Parapet
  const pNorthGeo = new THREE.BoxGeometry(width + parapetThickness, parapetHeight, parapetThickness);
  const pNorth = new THREE.Mesh(pNorthGeo, parapetMat);
  pNorth.position.set(midX, height + parapetHeight / 2, bounds.minZ);
  group.add(pNorth);

  // South Parapet
  const pSouthGeo = new THREE.BoxGeometry(width + parapetThickness, parapetHeight, parapetThickness);
  const pSouth = new THREE.Mesh(pSouthGeo, parapetMat);
  pSouth.position.set(midX, height + parapetHeight / 2, bounds.maxZ);
  group.add(pSouth);

  // West Parapet
  const pWestGeo = new THREE.BoxGeometry(parapetThickness, parapetHeight, depth + parapetThickness);
  const pWest = new THREE.Mesh(pWestGeo, parapetMat);
  pWest.position.set(bounds.minX, height + parapetHeight / 2, midZ);
  group.add(pWest);

  // East Parapet
  const pEastGeo = new THREE.BoxGeometry(parapetThickness, parapetHeight, depth + parapetThickness);
  const pEast = new THREE.Mesh(pEastGeo, parapetMat);
  pEast.position.set(bounds.maxX, height + parapetHeight / 2, midZ);
  group.add(pEast);

  // 4. Architectural Structural Ceiling Beams / Soffits (dropped by 0.14m)
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.6,
  });

  // Longitudinal main corridor beam
  const mainBeamGeo = new THREE.BoxGeometry(width - 2, 0.20, 0.38);
  const mainBeam = new THREE.Mesh(mainBeamGeo, beamMat);
  mainBeam.position.set(midX, height - 0.10, 0);
  mainBeam.castShadow = true;
  group.add(mainBeam);

  // Cross structural beams
  const crossOffsets = [-10, 0, 10];
  crossOffsets.forEach((xOff) => {
    if (xOff > bounds.minX + 2 && xOff < bounds.maxX - 2) {
      const crossBeamGeo = new THREE.BoxGeometry(0.38, 0.20, depth - 2);
      const crossBeam = new THREE.Mesh(crossBeamGeo, beamMat);
      crossBeam.position.set(xOff, height - 0.10, midZ);
      crossBeam.castShadow = true;
      group.add(crossBeam);
    }
  });

  // 5. Recessed Ceiling LED Troffers & Downlights
  const trofferMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfef08a,
    emissiveIntensity: 1.15,
    roughness: 0.15,
  });
  const trofferRimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });

  // Use provided positions or generate a default corridor lighting layout
  const lightPositions = corridorLightPositions.length > 0
    ? corridorLightPositions
    : [
        new THREE.Vector3(-14, height, 0),
        new THREE.Vector3(-4, height, 0),
        new THREE.Vector3(6, height, 0),
        new THREE.Vector3(14, height, 4),
        new THREE.Vector3(16, height, 8),
      ];

  const ceilingLights: THREE.PointLight[] = [];

  lightPositions.forEach((pos) => {
    // Recessed Troffer Diffuser
    const trofferGeo = new THREE.BoxGeometry(1.6, 0.06, 0.55);
    const troffer = new THREE.Mesh(trofferGeo, trofferMat);
    troffer.position.set(pos.x, height - 0.03, pos.z);
    group.add(troffer);

    // Aluminum Outer Rim Trim
    const rimGeo = new THREE.BoxGeometry(1.68, 0.04, 0.63);
    const rim = new THREE.Mesh(rimGeo, trofferRimMat);
    rim.position.set(pos.x, height - 0.02, pos.z);
    group.add(rim);

    // Ceiling Downlight casting soft warm illumination
    const downlight = new THREE.PointLight(0xfffbeb, 1.35, 11);
    downlight.position.set(pos.x, height - 0.25, pos.z);
    group.add(downlight);
    ceilingLights.push(downlight);
  });

  // 6. Institutional Smoke Detectors & Chrome Sprinkler Heads
  const detectorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const indicatorLedMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 0.8,
  });
  const sprinklerMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.15 });

  const accessoryPositions = [
    new THREE.Vector3(-10, height, -8),
    new THREE.Vector3(4, height, -8),
    new THREE.Vector3(-8, height, 6),
    new THREE.Vector3(8, height, 6),
    new THREE.Vector3(0, height, 0),
  ];

  accessoryPositions.forEach((p, idx) => {
    if (idx % 2 === 0) {
      // Circular Smoke Detector Puck
      const puckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.05, 16);
      const puck = new THREE.Mesh(puckGeo, detectorMat);
      puck.position.set(p.x, height - 0.025, p.z);
      group.add(puck);

      // Blinking status indicator LED
      const ledGeo = new THREE.SphereGeometry(0.018, 8, 8);
      const led = new THREE.Mesh(ledGeo, indicatorLedMat);
      led.position.set(p.x + 0.06, height - 0.045, p.z);
      group.add(led);
    } else {
      // Chrome Sprinkler Head Pendent
      const pipeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 8);
      const pipe = new THREE.Mesh(pipeGeo, sprinklerMat);
      pipe.position.set(p.x, height - 0.04, p.z);
      group.add(pipe);

      const deflectorGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.008, 12);
      const deflector = new THREE.Mesh(deflectorGeo, sprinklerMat);
      deflector.position.set(p.x, height - 0.08, p.z);
      group.add(deflector);
    }
  });

  let timeAccumulator = 0;

  return {
    group,
    height,
    indoorBounds: bounds,
    setTacticalMode(isTactical: boolean) {
      group.visible = !isTactical;
    },
    update(delta: number) {
      timeAccumulator += delta;
      // Gentle pulse on smoke detector indicators
      indicatorLedMat.emissiveIntensity = 0.5 + Math.sin(timeAccumulator * 2.5) * 0.45;
    },
    dispose() {
      ceilingLights.forEach((l) => l.dispose?.());
    },
  };
}

/**
 * Creates an architectural walkable 3D staircase with safety risers, treads,
 * high-vis edge strips, steel stringers, code handrails, and support structures.
 * Supports both Inside (Interior) and Outside (Exterior Emergency Fire Escape) stairs.
 */
export function createArchitecturalStaircase(stair: WalkableStaircase): {
  group: THREE.Group;
  update: (delta: number) => void;
} {
  const group = new THREE.Group();
  group.name = `staircase_${stair.id}`;

  const isOutside = !!stair.isOutside;
  const b = stair.bounds;
  const width = b.maxX - b.minX;
  const length = b.maxZ - b.minZ;
  const midX = (b.minX + b.maxX) / 2;
  const numSteps = 16;
  const totalH = (stair.topY || 3.6) - (stair.bottomY || 0); // Connects Y=0 to Y=3.6
  const stepRise = totalH / numSteps;
  const stepRun = length / numSteps;

  // Visual materials: Outdoor vs Indoor
  const treadMat = new THREE.MeshStandardMaterial({
    color: isOutside ? 0x475569 : 0x334155,
    roughness: isOutside ? 0.45 : 0.65,
    metalness: isOutside ? 0.8 : 0.2,
  });

  const edgeMat = new THREE.MeshStandardMaterial({
    color: isOutside ? 0xfacc15 : 0xf59e0b,
    emissive: isOutside ? 0xeab308 : 0xd97706,
    emissiveIntensity: isOutside ? 0.8 : 0.6,
    roughness: 0.3,
  });

  const stringerMat = new THREE.MeshStandardMaterial({
    color: isOutside ? 0x0f172a : 0x1e293b,
    metalness: isOutside ? 0.9 : 0.85,
    roughness: 0.25,
  });

  const railMat = new THREE.MeshStandardMaterial({
    color: isOutside ? 0xe2e8f0 : 0xf1f5f9,
    metalness: 0.9,
    roughness: 0.15,
  });

  // Steps
  for (let i = 0; i < numSteps; i++) {
    const stepZ = stair.ascendDirection === '+z'
      ? b.minZ + (i + 0.5) * stepRun
      : b.maxZ - (i + 0.5) * stepRun;
    const stepY = (stair.bottomY || 0) + i * stepRise + stepRise / 2;

    const stepGeo = new THREE.BoxGeometry(width - 0.2, stepRise, stepRun + 0.04);
    const stepMesh = new THREE.Mesh(stepGeo, treadMat);
    stepMesh.position.set(midX, stepY, stepZ);
    stepMesh.castShadow = true;
    stepMesh.receiveShadow = true;
    group.add(stepMesh);

    // High-vis yellow safety nosing strip
    const edgeGeo = new THREE.BoxGeometry(width - 0.2, 0.028, 0.05);
    const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
    const edgeZ = stair.ascendDirection === '+z' ? stepZ + stepRun / 2 : stepZ - stepRun / 2;
    edgeMesh.position.set(midX, stepY + stepRise / 2 + 0.014, edgeZ);
    group.add(edgeMesh);
  }

  // Steel stringer beams along left and right sides
  const stringerAngle = Math.atan2(totalH, length);
  const stringerLen = Math.hypot(length, totalH);
  const stringerGeo = new THREE.BoxGeometry(0.12, isOutside ? 0.38 : 0.32, stringerLen);

  [-width / 2 + 0.06, width / 2 - 0.06].forEach((xSide) => {
    const stringer = new THREE.Mesh(stringerGeo, stringerMat);
    stringer.position.set(midX + xSide, (stair.bottomY || 0) + totalH / 2, (b.minZ + b.maxZ) / 2);
    stringer.rotation.x = stair.ascendDirection === '+z' ? -stringerAngle : stringerAngle;
    group.add(stringer);

    // Handrail posts
    const postCount = isOutside ? 6 : 4;
    for (let p = 0; p <= postCount; p++) {
      const pFrac = p / postCount;
      const postZ = stair.ascendDirection === '+z'
        ? b.minZ + pFrac * length
        : b.maxZ - pFrac * length;
      const postY = (stair.bottomY || 0) + pFrac * totalH + 0.5;
      const postGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.05, 8);
      const post = new THREE.Mesh(postGeo, railMat);
      post.position.set(midX + xSide, postY, postZ);
      group.add(post);
    }

    // Continuous top handrail tube (code height 1.1m)
    const railGeo = new THREE.CylinderGeometry(0.032, 0.032, stringerLen, 8);
    railGeo.rotateX(Math.PI / 2);
    const railMesh = new THREE.Mesh(railGeo, railMat);
    railMesh.position.set(midX + xSide, (stair.bottomY || 0) + totalH / 2 + 1.05, (b.minZ + b.maxZ) / 2);
    railMesh.rotation.x = stair.ascendDirection === '+z' ? -stringerAngle : stringerAngle;
    group.add(railMesh);

    // Intermediate safety rail for outdoor staircase
    if (isOutside) {
      const midRailGeo = new THREE.CylinderGeometry(0.02, 0.02, stringerLen, 8);
      midRailGeo.rotateX(Math.PI / 2);
      const midRailMesh = new THREE.Mesh(midRailGeo, railMat);
      midRailMesh.position.set(midX + xSide, (stair.bottomY || 0) + totalH / 2 + 0.52, (b.minZ + b.maxZ) / 2);
      midRailMesh.rotation.x = stair.ascendDirection === '+z' ? -stringerAngle : stringerAngle;
      group.add(midRailMesh);
    }
  });

  // Outdoor heavy steel support columns anchoring the outside stair to the ground
  if (isOutside) {
    const colGeo = new THREE.CylinderGeometry(0.1, 0.1, totalH, 12);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
    const topZ = stair.ascendDirection === '+z' ? b.maxZ : b.minZ;
    const midZ = (b.minZ + b.maxZ) / 2;

    [-width / 2 + 0.15, width / 2 - 0.15].forEach((xSide) => {
      // Top platform support column
      const colTop = new THREE.Mesh(colGeo, colMat);
      colTop.position.set(midX + xSide, totalH / 2, topZ);
      colTop.castShadow = true;
      group.add(colTop);

      // Mid-span support column
      const colMidGeo = new THREE.CylinderGeometry(0.08, 0.08, totalH / 2, 10);
      const colMid = new THREE.Mesh(colMidGeo, colMat);
      colMid.position.set(midX + xSide, totalH / 4, midZ);
      colMid.castShadow = true;
      group.add(colMid);
    });

    // Top exterior landing platform connecting to 1st Floor door
    const platLen = 1.4;
    const platGeo = new THREE.BoxGeometry(width + 0.4, 0.18, platLen);
    const platMesh = new THREE.Mesh(platGeo, treadMat);
    const platZ = stair.ascendDirection === '+z' ? b.maxZ + platLen / 2 : b.minZ - platLen / 2;
    platMesh.position.set(midX, totalH - 0.09, platZ);
    platMesh.receiveShadow = true;
    group.add(platMesh);

    // Platform side guardrails
    [-width / 2 - 0.15, width / 2 + 0.15].forEach((xSide) => {
      const pRailGeo = new THREE.BoxGeometry(0.05, 1.1, platLen);
      const pRail = new THREE.Mesh(pRailGeo, railMat);
      pRail.position.set(midX + xSide, totalH + 0.55, platZ);
      group.add(pRail);
    });
  }

  // Ground landing pad extending from the bottom step ("end to the land")
  const bottomZ = stair.ascendDirection === '+z' ? b.minZ : b.maxZ;
  const landPadLen = 1.4;
  const landPadGeo = new THREE.BoxGeometry(width + 0.1, 0.05, landPadLen);
  const landPadMesh = new THREE.Mesh(landPadGeo, treadMat);
  const padZ = stair.ascendDirection === '+z' ? bottomZ - landPadLen / 2 : bottomZ + landPadLen / 2;
  landPadMesh.position.set(midX, (stair.bottomY || 0) + 0.025, padZ);
  landPadMesh.receiveShadow = true;
  group.add(landPadMesh);

  // High-vis yellow safety border around the ground landing pad
  const borderGeo = new THREE.BoxGeometry(width + 0.1, 0.02, 0.06);
  const borderMesh = new THREE.Mesh(borderGeo, edgeMat);
  borderMesh.position.set(midX, (stair.bottomY || 0) + 0.05, padZ + (stair.ascendDirection === '+z' ? -landPadLen / 2 : landPadLen / 2));
  group.add(borderMesh);

  // Hanging emergency illuminated signs:
  // Top landing sign
  const topSignZ = stair.ascendDirection === '+z' ? b.maxZ : b.minZ;
  const topSignGeo = new THREE.BoxGeometry(2.4, 0.45, 0.1);
  const topSignMat = new THREE.MeshStandardMaterial({
    color: isOutside ? 0x047857 : 0x059669,
    emissive: isOutside ? 0x10b981 : 0x10b981,
    emissiveIntensity: 0.95,
    roughness: 0.2,
  });
  const topSign = new THREE.Mesh(topSignGeo, topSignMat);
  topSign.position.set(midX, totalH + 2.1, topSignZ);
  group.add(topSign);

  // Bottom entrance sign
  const bottomSign = new THREE.Mesh(topSignGeo, topSignMat);
  bottomSign.position.set(midX, 2.7, bottomZ);
  group.add(bottomSign);

  return {
    group,
    update(_delta: number) {},
  };
}

export interface MezzanineOptions {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  elevation: number; // 3.6m
  staircases: WalkableStaircase[];
}

/**
 * Creates intermediate 1st floor structural slab with acoustic bottom ceiling and stairwell cutouts
 */
export function createMezzanineFloorStructure(options: MezzanineOptions): {
  group: THREE.Group;
  colliders: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number }[];
} {
  const { bounds, elevation } = options;
  const group = new THREE.Group();
  group.name = 'mezzanine_intermediate_floor';

  const tileTex = getTileTexture('#e2e8f0', '#cbd5e1');
  const ceilingTex = getAcousticCeilingTexture();

  const floorMat = new THREE.MeshStandardMaterial({
    map: tileTex,
    roughness: 0.6,
    metalness: 0.05,
  });

  const underCeilingMat = new THREE.MeshStandardMaterial({
    map: ceilingTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  const edgeFasciaMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.5,
  });

  const colliders: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number }[] = [];

  // Cutout ONLY for the single Inside Staircase (West side: X from -13.6 to -10.4, Z from -2.0 to 2.8)
  // East side floor is solid and continuous, leading straight to the Outside Staircase exit door!
  const floorPanels = [
    // 1. North Wing Floor (Covers all rooms north of stairwells: Z from bounds.minZ to -2.0)
    { minX: bounds.minX, maxX: bounds.maxX, minZ: bounds.minZ, maxZ: -2.0 },
    // 2. South Wing Floor (Covers all rooms south of stairwells: Z from 2.8 to bounds.maxZ)
    { minX: bounds.minX, maxX: bounds.maxX, minZ: 2.8, maxZ: bounds.maxZ },
    // 3. West Corridor Outer Aisle (West of the inside stairwell: X from bounds.minX to -13.6)
    { minX: bounds.minX, maxX: -13.6, minZ: -2.0, maxZ: 2.8 },
    // 4. Central & East Concourse Floor (East of the inside stairwell: X from -10.4 to bounds.maxX)
    { minX: -10.4, maxX: bounds.maxX, minZ: -2.0, maxZ: 2.8 },
  ];

  floorPanels.forEach((fp) => {
    const pw = fp.maxX - fp.minX;
    const pd = fp.maxZ - fp.minZ;
    const px = (fp.minX + fp.maxX) / 2;
    const pz = (fp.minZ + fp.maxZ) / 2;

    // Solid floor slab (thickness 0.22m)
    const slabGeo = new THREE.BoxGeometry(pw, 0.22, pd);
    const slabMesh = new THREE.Mesh(slabGeo, edgeFasciaMat);
    slabMesh.position.set(px, elevation - 0.11, pz);
    slabMesh.receiveShadow = true;
    group.add(slabMesh);

    // Top surface walking floor (Y = elevation)
    const topGeo = new THREE.PlaneGeometry(pw, pd);
    topGeo.rotateX(-Math.PI / 2);
    const topMesh = new THREE.Mesh(topGeo, floorMat);
    topMesh.position.set(px, elevation + 0.005, pz);
    topMesh.receiveShadow = true;
    group.add(topMesh);

    // Bottom surface acoustic ceiling (Y = elevation - 0.22m, facing downwards into ground floor)
    const btmGeo = new THREE.PlaneGeometry(pw, pd);
    btmGeo.rotateX(Math.PI / 2);
    const btmMesh = new THREE.Mesh(btmGeo, underCeilingMat);
    btmMesh.position.set(px, elevation - 0.225, pz);
    btmMesh.receiveShadow = true;
    group.add(btmMesh);
  });

  // Safety Balustrades / Glass Guardrails (1.1m code height) along the Inside Staircase opening on 1st Floor
  const railPostMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  const railGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.5,
    roughness: 0.1,
    transmission: 0.75,
  });

  const balustrades = [
    // Inside Staircase opening: West edge, East edge, South edge overlooking void; North landing at Z = -2.0 is OPEN for entry/exit
    { minX: -13.6, maxX: -13.6, minZ: -2.0, maxZ: 2.8 }, // West guardrail
    { minX: -10.4, maxX: -10.4, minZ: -2.0, maxZ: 2.8 }, // East guardrail
    { minX: -13.6, maxX: -10.4, minZ: 2.8, maxZ: 2.8 },   // South guardrail overlooking stairwell void
  ];

  balustrades.forEach((b) => {
    const isZAligned = Math.abs(b.maxX - b.minX) < 0.1;
    const len = isZAligned ? b.maxZ - b.minZ : b.maxX - b.minX;
    const midX = (b.minX + b.maxX) / 2;
    const midZ = (b.minZ + b.maxZ) / 2;

    const glassGeo = isZAligned
      ? new THREE.BoxGeometry(0.04, 1.05, len)
      : new THREE.BoxGeometry(len, 1.05, 0.04);
    const glass = new THREE.Mesh(glassGeo, railGlassMat);
    glass.position.set(midX, elevation + 0.55, midZ);
    group.add(glass);

    // Top Handrail
    const topBarGeo = isZAligned
      ? new THREE.BoxGeometry(0.08, 0.05, len)
      : new THREE.BoxGeometry(len, 0.05, 0.08);
    const topBar = new THREE.Mesh(topBarGeo, railPostMat);
    topBar.position.set(midX, elevation + 1.1, midZ);
    group.add(topBar);

    // Collider blocking cadet from falling over the balustrade
    colliders.push({
      minX: midX - (isZAligned ? 0.25 : len / 2),
      maxX: midX + (isZAligned ? 0.25 : len / 2),
      minZ: midZ - (isZAligned ? len / 2 : 0.25),
      maxZ: midZ + (isZAligned ? len / 2 : 0.25),
      minY: elevation,
      maxY: elevation + 1.3,
    });
  });

  return { group, colliders };
}

/**
 * Creates exterior emergency fire escape balcony and stairs on building sides
 */
export function createExteriorFireEscape(options: {
  exitPosition: [number, number, number];
  landingPosition: [number, number, number];
  width?: number;
}): {
  group: THREE.Group;
  colliders: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number }[];
} {
  const { exitPosition, landingPosition, width = 3.2 } = options;
  const group = new THREE.Group();
  group.name = 'exterior_fire_escape';

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.85,
    roughness: 0.35,
  });

  const gratingMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.4,
  });

  const colliders: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number }[] = [];

  // 1. Exterior Elevated Catwalk Balcony outside 1st Floor Emergency Exit Door
  const balconyLen = 3.6;
  const balconyGeo = new THREE.BoxGeometry(width, 0.18, balconyLen);
  const balcony = new THREE.Mesh(balconyGeo, gratingMat);
  balcony.position.set(exitPosition[0], exitPosition[1] - 0.09, exitPosition[2] + balconyLen / 2);
  balcony.receiveShadow = true;
  group.add(balcony);

  // Safety railings around balcony
  const railHeight = 1.15;
  const leftRailGeo = new THREE.BoxGeometry(0.06, railHeight, balconyLen);
  const leftRail = new THREE.Mesh(leftRailGeo, steelMat);
  leftRail.position.set(exitPosition[0] - width / 2, exitPosition[1] + railHeight / 2, exitPosition[2] + balconyLen / 2);
  group.add(leftRail);

  const rightRailGeo = new THREE.BoxGeometry(0.06, railHeight, balconyLen);
  const rightRail = new THREE.Mesh(rightRailGeo, steelMat);
  rightRail.position.set(exitPosition[0] + width / 2, exitPosition[1] + railHeight / 2, exitPosition[2] + balconyLen / 2);
  group.add(rightRail);

  // 2. Heavy steel support columns anchoring the balcony to the ground
  const colGeo = new THREE.CylinderGeometry(0.12, 0.12, exitPosition[1], 12);
  [-width / 2 + 0.15, width / 2 - 0.15].forEach((xOff) => {
    const col = new THREE.Mesh(colGeo, steelMat);
    col.position.set(exitPosition[0] + xOff, exitPosition[1] / 2, exitPosition[2] + balconyLen - 0.2);
    col.castShadow = true;
    group.add(col);
  });

  // 3. Exterior Fire Escape Stairs descending to Ground
  const numSteps = 16;
  const stairLen = Math.abs(landingPosition[2] - (exitPosition[2] + balconyLen));
  const stepRise = exitPosition[1] / numSteps;
  const stepRun = stairLen / numSteps;
  const stairMidZ = (exitPosition[2] + balconyLen + landingPosition[2]) / 2;

  for (let i = 0; i < numSteps; i++) {
    const stepZ = exitPosition[2] + balconyLen + (i + 0.5) * stepRun;
    const stepY = exitPosition[1] - (i + 1) * stepRise + stepRise / 2;

    const stepGeo = new THREE.BoxGeometry(width - 0.3, stepRise, stepRun + 0.04);
    const step = new THREE.Mesh(stepGeo, gratingMat);
    step.position.set(exitPosition[0], stepY, stepZ);
    step.receiveShadow = true;
    group.add(step);
  }

  // Exterior industrial railings along the escape flight
  const stringerLen = Math.hypot(stairLen, exitPosition[1]);
  const angle = Math.atan2(exitPosition[1], stairLen);

  [-width / 2 + 0.1, width / 2 - 0.1].forEach((xOff) => {
    const railGeo = new THREE.CylinderGeometry(0.035, 0.035, stringerLen, 8);
    railGeo.rotateX(Math.PI / 2);
    const rail = new THREE.Mesh(railGeo, steelMat);
    rail.position.set(exitPosition[0] + xOff, exitPosition[1] / 2 + 1.05, stairMidZ);
    rail.rotation.x = angle;
    group.add(rail);
  });

  return { group, colliders };
}

/**
 * Creates an interactive 3D Emergency Health Care Center & Medical Triage Station
 * at the safe assembly / goal location.
 */
export function createHealthCareCenter(position: [number, number, number]): {
  group: THREE.Group;
  update: (delta: number) => void;
} {
  const group = new THREE.Group();
  group.position.set(...position);

  // 1. Sterile Rubberized Ground Triage Pad
  const padWidth = 14;
  const padLength = 11;
  const padGeo = new THREE.PlaneGeometry(padWidth, padLength);
  const padCanvas = document.createElement('canvas');
  padCanvas.width = 512;
  padCanvas.height = 512;
  const padCtx = padCanvas.getContext('2d');
  if (padCtx) {
    padCtx.fillStyle = '#f8fafc';
    padCtx.fillRect(0, 0, 512, 512);
    // Green triage perimeter line
    padCtx.strokeStyle = '#10b981';
    padCtx.lineWidth = 14;
    padCtx.strokeRect(10, 10, 492, 492);
    // Central Red Cross Emblem
    padCtx.fillStyle = '#ef4444';
    padCtx.fillRect(226, 120, 60, 272);
    padCtx.fillRect(120, 226, 272, 60);
    // Text labels
    padCtx.fillStyle = '#0f172a';
    padCtx.font = 'bold 24px monospace';
    padCtx.textAlign = 'center';
    padCtx.fillText('EMERGENCY HEALTH CARE CENTER', 256, 70);
    padCtx.fillText('TRIAGE & MEDICAL EVALUATION', 256, 450);
  }
  const padTexture = new THREE.CanvasTexture(padCanvas);
  const padMat = new THREE.MeshStandardMaterial({
    map: padTexture,
    roughness: 0.6,
    metalness: 0.1,
  });
  const padMesh = new THREE.Mesh(padGeo, padMat);
  padMesh.rotation.x = -Math.PI / 2;
  padMesh.position.y = 0.03;
  padMesh.receiveShadow = true;
  group.add(padMesh);

  // 2. Field Clinic Marquee Tent
  const tentWidth = 8.5;
  const tentLength = 7.0;
  const wallHeight = 2.8;
  const roofHeight = 1.6;
  const tentZ = -0.5;

  const tentMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Crisp sterile white canvas
    roughness: 0.5,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const redMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.4,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.8,
    roughness: 0.3,
  });

  // Tent back wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(tentWidth, wallHeight), tentMat);
  backWall.position.set(0, wallHeight / 2, tentZ - tentLength / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // Tent left and right walls
  const sideGeo = new THREE.PlaneGeometry(tentLength, wallHeight);
  const leftWall = new THREE.Mesh(sideGeo, tentMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-tentWidth / 2, wallHeight / 2, tentZ);
  leftWall.castShadow = true;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(sideGeo, tentMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(tentWidth / 2, wallHeight / 2, tentZ);
  rightWall.castShadow = true;
  group.add(rightWall);

  // Tent front wall with wide 3.4m arched walk-in opening
  const frontWingWidth = (tentWidth - 3.4) / 2;
  const leftFrontWing = new THREE.Mesh(new THREE.PlaneGeometry(frontWingWidth, wallHeight), tentMat);
  leftFrontWing.position.set(-tentWidth / 2 + frontWingWidth / 2, wallHeight / 2, tentZ + tentLength / 2);
  group.add(leftFrontWing);

  const rightFrontWing = new THREE.Mesh(new THREE.PlaneGeometry(frontWingWidth, wallHeight), tentMat);
  rightFrontWing.position.set(tentWidth / 2 - frontWingWidth / 2, wallHeight / 2, tentZ + tentLength / 2);
  group.add(rightFrontWing);

  // Front Header Banner above door
  const headerHeight = 0.8;
  const frontHeader = new THREE.Mesh(new THREE.PlaneGeometry(3.4, headerHeight), tentMat);
  frontHeader.position.set(0, wallHeight - headerHeight / 2, tentZ + tentLength / 2);
  group.add(frontHeader);

  // Peaked Gable Roof
  const roofSlopeLen = Math.hypot(tentWidth / 2, roofHeight);
  const roofAngle = Math.atan2(roofHeight, tentWidth / 2);

  const roofLeftGeo = new THREE.PlaneGeometry(roofSlopeLen, tentLength + 0.4);
  const roofLeft = new THREE.Mesh(roofLeftGeo, tentMat);
  roofLeft.rotation.set(0, 0, -roofAngle);
  roofLeft.position.set(-tentWidth / 4, wallHeight + roofHeight / 2, tentZ);
  roofLeft.castShadow = true;
  group.add(roofLeft);

  const roofRight = new THREE.Mesh(roofLeftGeo, tentMat);
  roofRight.rotation.set(0, 0, roofAngle);
  roofRight.position.set(tentWidth / 4, wallHeight + roofHeight / 2, tentZ);
  roofRight.castShadow = true;
  group.add(roofRight);

  // Front Gable Triangle
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-tentWidth / 2, 0);
  gableShape.lineTo(tentWidth / 2, 0);
  gableShape.lineTo(0, roofHeight);
  gableShape.closePath();
  const gableGeo = new THREE.ShapeGeometry(gableShape);
  const frontGable = new THREE.Mesh(gableGeo, tentMat);
  frontGable.position.set(0, wallHeight, tentZ + tentLength / 2);
  group.add(frontGable);

  // Red Cross Decals on Front Gable and Roof
  const crossGroup = new THREE.Group();
  const crossV = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1.2), redMat);
  const crossH = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.35), redMat);
  crossGroup.add(crossV);
  crossGroup.add(crossH);
  crossGroup.position.set(0, wallHeight + roofHeight * 0.45, tentZ + tentLength / 2 + 0.02);
  group.add(crossGroup);

  // Illuminated Marquee Sign Board above Entrance
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const sCtx = signCanvas.getContext('2d');
  if (sCtx) {
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 512, 128);
    sCtx.strokeStyle = '#ef4444';
    sCtx.lineWidth = 6;
    sCtx.strokeRect(4, 4, 504, 120);
    sCtx.fillStyle = '#ef4444';
    sCtx.font = 'bold 36px monospace';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('🏥 HEALTH CARE CENTER', 256, 45);
    sCtx.fillStyle = '#38bdf8';
    sCtx.font = 'bold 22px monospace';
    sCtx.fillText('EMERGENCY TRIAGE & CHECK-UP', 256, 92);
  }
  const signTex = new THREE.CanvasTexture(signCanvas);
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.9, 0.1),
    new THREE.MeshStandardMaterial({
      map: signTex,
      roughness: 0.3,
      emissive: 0x0f172a,
    })
  );
  signMesh.position.set(0, wallHeight + 0.35, tentZ + tentLength / 2 + 0.1);
  group.add(signMesh);

  // 3. Inside Medical Equipment
  // Hospital Stretchers / Triage Cots
  [-2.2, 2.2].forEach((xOffset) => {
    const cotGroup = new THREE.Group();
    cotGroup.position.set(xOffset, 0, tentZ);

    // Metal cot frame legs
    const frameGeo = new THREE.BoxGeometry(1.0, 0.65, 2.3);
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.y = 0.35;
    cotGroup.add(frameMesh);

    // Mattress & Pillow
    const mattressGeo = new THREE.BoxGeometry(0.95, 0.15, 2.2);
    const mattressMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
    const mattress = new THREE.Mesh(mattressGeo, mattressMat);
    mattress.position.y = 0.72;
    cotGroup.add(mattress);

    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.1, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    pillow.position.set(0, 0.82, -0.75);
    cotGroup.add(pillow);

    // IV Drip Pole with Saline Bag
    const ivPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.9, 8), frameMat);
    ivPole.position.set(0.65, 0.95, -0.75);
    cotGroup.add(ivPole);

    const ivBag = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.22, 0.06),
      new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
      })
    );
    ivBag.position.set(0.65, 1.75, -0.75);
    cotGroup.add(ivBag);

    group.add(cotGroup);
  });

  // Vital Signs Telemetry Screen Monitor
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(0, 0, tentZ - 1.8);

  const cartMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.6), frameMat);
  cartMesh.position.y = 0.5;
  monitorGroup.add(cartMesh);

  // Monitor screen with green ECG line
  const ecgCanvas = document.createElement('canvas');
  ecgCanvas.width = 256;
  ecgCanvas.height = 128;
  const ecgCtx = ecgCanvas.getContext('2d');
  if (ecgCtx) {
    ecgCtx.fillStyle = '#022c22';
    ecgCtx.fillRect(0, 0, 256, 128);
    ecgCtx.strokeStyle = '#10b981';
    ecgCtx.lineWidth = 3;
    ecgCtx.beginPath();
    ecgCtx.moveTo(0, 64);
    ecgCtx.lineTo(60, 64);
    ecgCtx.lineTo(75, 20);
    ecgCtx.lineTo(95, 110);
    ecgCtx.lineTo(110, 45);
    ecgCtx.lineTo(125, 64);
    ecgCtx.lineTo(190, 64);
    ecgCtx.lineTo(205, 20);
    ecgCtx.lineTo(225, 110);
    ecgCtx.lineTo(240, 45);
    ecgCtx.lineTo(256, 64);
    ecgCtx.stroke();
    ecgCtx.fillStyle = '#34d399';
    ecgCtx.font = 'bold 18px monospace';
    ecgCtx.fillText('HR: 108 BPM • SpO2: 98%', 15, 30);
  }
  const ecgTex = new THREE.CanvasTexture(ecgCanvas);
  const screenMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.45, 0.06),
    new THREE.MeshStandardMaterial({
      map: ecgTex,
      emissive: 0x059669,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    })
  );
  screenMesh.position.set(0, 1.25, 0);
  monitorGroup.add(screenMesh);
  group.add(monitorGroup);

  // High-Pressure Medical Oxygen Cylinders
  const o2Mat = new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.7, roughness: 0.3 });
  [-0.6, 0.6].forEach((xOff) => {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.2, 12), o2Mat);
    tank.position.set(xOff, 0.6, tentZ - 2.6);
    group.add(tank);

    const brassCap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 }));
    brassCap.position.set(xOff, 1.25, tentZ - 2.6);
    group.add(brassCap);
  });

  // 4. Paramedic & Field Physician 3D Stationed Characters
  // Field Physician (White coat, clipboard)
  const doctorGroup = new THREE.Group();
  doctorGroup.position.set(-1.2, 0, tentZ + 1.2);
  doctorGroup.rotation.y = 0.4;
  const docBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0xf1f5f9 }));
  docBody.position.y = 1.0;
  doctorGroup.add(docBody);
  const docHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfbcfe8 }));
  docHead.position.y = 1.75;
  doctorGroup.add(docHead);
  // Clipboard
  const clipboard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.04), new THREE.MeshStandardMaterial({ color: 0x78350f }));
  clipboard.position.set(0.15, 1.1, 0.25);
  clipboard.rotation.x = -0.5;
  doctorGroup.add(clipboard);
  group.add(doctorGroup);

  // Paramedic (High-vis orange/navy uniform)
  const paramedicGroup = new THREE.Group();
  paramedicGroup.position.set(1.2, 0, tentZ + 1.2);
  paramedicGroup.rotation.y = -0.4;
  const paramBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
  paramBody.position.y = 1.0;
  paramedicGroup.add(paramBody);
  const paramHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfde68a }));
  paramHead.position.y = 1.75;
  paramedicGroup.add(paramHead);
  group.add(paramedicGroup);

  // 5. Parked Type-I Emergency Medical Response Ambulance
  const ambulanceGroup = new THREE.Group();
  ambulanceGroup.position.set(5.5, 0, tentZ);
  ambulanceGroup.rotation.y = -Math.PI / 2;

  // Ambulance Body Box
  const ambBoxGeo = new THREE.BoxGeometry(2.4, 2.2, 5.2);
  const ambBoxMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const ambBox = new THREE.Mesh(ambBoxGeo, ambBoxMat);
  ambBox.position.y = 1.4;
  ambBox.castShadow = true;
  ambulanceGroup.add(ambBox);

  // Red & Yellow Chevron Reflective Rear / Side Stripe
  const stripeGeo = new THREE.BoxGeometry(2.44, 0.35, 5.24);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = 1.2;
  ambulanceGroup.add(stripe);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  [
    [-1.15, 0.38, -1.5],
    [1.15, 0.38, -1.5],
    [-1.15, 0.38, 1.5],
    [1.15, 0.38, 1.5],
  ].forEach((wPos) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wPos[0], wPos[1], wPos[2]);
    ambulanceGroup.add(wheel);
  });

  // Flashing Emergency Lightbars on Ambulance
  const lightbarMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 1.5,
  });
  const lightbarBlueMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    emissive: 0x2563eb,
    emissiveIntensity: 1.5,
  });

  const redLightbar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.25), lightbarMat);
  redLightbar.position.set(-0.5, 2.58, 2.2);
  ambulanceGroup.add(redLightbar);

  const blueLightbar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.25), lightbarBlueMat);
  blueLightbar.position.set(0.5, 2.58, 2.2);
  ambulanceGroup.add(blueLightbar);

  group.add(ambulanceGroup);

  // 6. Interactive Walk-In Floor Zone
  const enterZoneGeo = new THREE.RingGeometry(1.6, 2.4, 32);
  const enterZoneMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  const enterZone = new THREE.Mesh(enterZoneGeo, enterZoneMat);
  enterZone.rotation.x = -Math.PI / 2;
  enterZone.position.set(0, 0.05, tentZ + tentLength / 2 + 1.2);
  group.add(enterZone);

  let time = 0;
  return {
    group,
    update: (delta: number) => {
      time += delta;
      // Strobe ambulance lights
      const strobe = Math.sin(time * 12) > 0;
      lightbarMat.emissiveIntensity = strobe ? 2.5 : 0.4;
      lightbarBlueMat.emissiveIntensity = !strobe ? 2.5 : 0.4;

      // Pulse interactive entrance ring
      enterZoneMat.opacity = 0.5 + Math.sin(time * 3.5) * 0.35;
    },
  };
}
