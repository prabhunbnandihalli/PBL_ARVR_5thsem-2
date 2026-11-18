import * as THREE from 'three';

export interface HazardRig {
  id: string;
  type: 'fire' | 'gas' | 'smoke' | 'debris' | 'chemical_leak' | 'electrical_arc';
  position: [number, number, number];
  radius: number;
  group: THREE.Group;
  update: (delta: number, playerPos: THREE.Vector3, cameraPos: THREE.Vector3) => void;
  dispose: () => void;
}

// Reusable procedural textures for decals & billboards
const hazardTextureCache = new Map<string, THREE.CanvasTexture>();

function getHazardDecalTexture(type: 'fire' | 'gas' | 'smoke' | 'electrical'): THREE.CanvasTexture {
  const key = `decal_${type}`;
  if (hazardTextureCache.has(key)) return hazardTextureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = 256;
    const cy = 256;

    if (type === 'fire') {
      // Scorched soot radial burn with glowing ember center
      const radGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 240);
      radGrad.addColorStop(0, 'rgba(255, 110, 20, 0.95)');
      radGrad.addColorStop(0.25, 'rgba(180, 40, 10, 0.7)');
      radGrad.addColorStop(0.65, 'rgba(25, 20, 18, 0.85)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Cracked ember fissures
      ctx.strokeStyle = 'rgba(254, 215, 100, 0.85)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const len = 60 + Math.random() * 90;
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.stroke();
      }
    } else if (type === 'gas') {
      // Toxic chemical puddle
      const radGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 230);
      radGrad.addColorStop(0, 'rgba(163, 230, 53, 0.9)');
      radGrad.addColorStop(0.4, 'rgba(34, 197, 94, 0.7)');
      radGrad.addColorStop(0.75, 'rgba(20, 83, 45, 0.5)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Bio-corrosive foam dots
      ctx.fillStyle = 'rgba(217, 249, 157, 0.75)';
      for (let i = 0; i < 35; i++) {
        const r = Math.random() * 160;
        const a = Math.random() * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'smoke') {
      // Ash accumulation soot ring
      const radGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 240);
      radGrad.addColorStop(0, 'rgba(30, 41, 59, 0.85)');
      radGrad.addColorStop(0.6, 'rgba(51, 65, 85, 0.5)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 512, 512);
    } else {
      // Electrical burn
      const radGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 220);
      radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
      radGrad.addColorStop(0.4, 'rgba(14, 116, 144, 0.6)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 512, 512);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  hazardTextureCache.set(key, texture);
  return texture;
}

function getHazardSignBillboardTexture(
  icon: string,
  title: string,
  subtext: string,
  themeColor: string,
  accentColor: string
): THREE.CanvasTexture {
  const key = `sign_${title}`;
  if (hazardTextureCache.has(key)) return hazardTextureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Semi-transparent tactical dark acrylic backing
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.roundRect(4, 4, 376, 132, 16);
    ctx.fill();

    // High-visibility glowing danger border
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 4;
    ctx.roundRect(4, 4, 376, 132, 16);
    ctx.stroke();

    // Left Danger Accent Banner
    ctx.fillStyle = themeColor;
    ctx.roundRect(4, 4, 20, 132, [16, 0, 0, 16]);
    ctx.fill();

    // Danger Icon
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 54, 70);

    // Hazard Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(title.toUpperCase(), 90, 50);

    // Hazard Subtext / Warning
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(subtext, 90, 88);
  }

  const texture = new THREE.CanvasTexture(canvas);
  hazardTextureCache.set(key, texture);
  return texture;
}

/**
 * Creates an animated Hazard Danger Perimeter Ring on the floor
 */
function createHazardPerimeterRing(radius: number, colorHex: number): {
  mesh: THREE.Mesh;
  update: (delta: number) => void;
} {
  const ringGeo = new THREE.RingGeometry(radius - 0.2, radius, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.05;

  let elapsed = Math.random() * 10;
  return {
    mesh: ringMesh,
    update: (delta: number) => {
      elapsed += delta;
      ringMat.opacity = 0.45 + Math.sin(elapsed * 4.5) * 0.3;
      const pulseScale = 1.0 + Math.sin(elapsed * 3.0) * 0.04;
      ringMesh.scale.set(pulseScale, pulseScale, 1);
    },
  };
}

/**
 * Creates a floating 3D tactical billboard beacon
 */
function createFloatingHazardSign(
  icon: string,
  title: string,
  subtext: string,
  themeColor: string,
  accentColor: string,
  height: number = 2.8
): {
  mesh: THREE.Mesh;
  update: (delta: number, cameraPos: THREE.Vector3) => void;
} {
  const tex = getHazardSignBillboardTexture(icon, title, subtext, themeColor, accentColor);
  const geo = new THREE.PlaneGeometry(2.4, 0.9);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height;

  let elapsed = 0;
  return {
    mesh,
    update: (delta: number, cameraPos: THREE.Vector3) => {
      elapsed += delta;
      mesh.position.y = height + Math.sin(elapsed * 2.5) * 0.1;
      mesh.lookAt(cameraPos);
    },
  };
}

/**
 * Creates a visually stunning, multi-layer realistic Fire Hazard
 */
export function createFireHazard(
  id: string,
  position: [number, number, number],
  radius: number
): HazardRig {
  const group = new THREE.Group();
  group.position.set(...position);

  // 1. Scorched ground decal
  const groundGeo = new THREE.PlaneGeometry(radius * 1.8, radius * 1.8);
  const groundMat = new THREE.MeshBasicMaterial({
    map: getHazardDecalTexture('fire'),
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const groundDecal = new THREE.Mesh(groundGeo, groundMat);
  groundDecal.rotation.x = -Math.PI / 2;
  groundDecal.position.y = 0.03;
  group.add(groundDecal);

  // 2. Pulsing danger perimeter ring
  const perimeter = createHazardPerimeterRing(radius, 0xef4444);
  group.add(perimeter.mesh);

  // 3. Dynamic flickering fire point light
  const fireLight = new THREE.PointLight(0xf97316, 5.0, radius * 2.5, 1.6);
  fireLight.position.set(0, 1.4, 0);
  fireLight.castShadow = true;
  group.add(fireLight);

  // 4. Multi-layer volumetric flame tongues (Inner core, middle body, outer flames)
  const flameTongues: {
    mesh: THREE.Mesh;
    rotSpeed: number;
    scaleSpeed: number;
    baseScale: THREE.Vector3;
  }[] = [];

  // Core white-yellow intense fire column
  const coreGeo = new THREE.ConeGeometry(radius * 0.28, 2.2, 10, 1, true);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a, // Intense glowing yellow
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.y = 1.1;
  group.add(coreMesh);
  flameTongues.push({
    mesh: coreMesh,
    rotSpeed: 2.2,
    scaleSpeed: 5.5,
    baseScale: new THREE.Vector3(1, 1, 1),
  });

  // Mid-tier searing orange flame body
  const midGeo = new THREE.ConeGeometry(radius * 0.45, 2.8, 12, 1, true);
  const midMat = new THREE.MeshBasicMaterial({
    color: 0xf97316, // Vibrant orange
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const midMesh = new THREE.Mesh(midGeo, midMat);
  midMesh.position.y = 1.4;
  group.add(midMesh);
  flameTongues.push({
    mesh: midMesh,
    rotSpeed: -1.8,
    scaleSpeed: 4.0,
    baseScale: new THREE.Vector3(1, 1, 1),
  });

  // Outer roaring flame blades (4 staggered angled flame blades)
  const outerGeo = new THREE.ConeGeometry(radius * 0.6, 3.2, 8, 1, true);
  const outerMat = new THREE.MeshBasicMaterial({
    color: 0xef4444, // Crimson fire tips
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const outerMesh = new THREE.Mesh(outerGeo, outerMat);
  outerMesh.position.y = 1.6;
  group.add(outerMesh);
  flameTongues.push({
    mesh: outerMesh,
    rotSpeed: 1.4,
    scaleSpeed: 3.2,
    baseScale: new THREE.Vector3(1, 1, 1),
  });

  // 5. Rising Ember Spark Particles
  const emberCount = 50;
  const emberPositions = new Float32Array(emberCount * 3);
  const emberVelocities: { x: number; y: number; z: number; phase: number }[] = [];

  for (let i = 0; i < emberCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius * 0.45;
    emberPositions[i * 3 + 0] = Math.cos(angle) * r;
    emberPositions[i * 3 + 1] = Math.random() * 3.5;
    emberPositions[i * 3 + 2] = Math.sin(angle) * r;

    emberVelocities.push({
      x: (Math.random() - 0.5) * 0.4,
      y: 1.2 + Math.random() * 1.5,
      z: (Math.random() - 0.5) * 0.4,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
  const emberMat = new THREE.PointsMaterial({
    color: 0xfef08a,
    size: 0.16,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const emberPoints = new THREE.Points(emberGeo, emberMat);
  group.add(emberPoints);

  // 6. Floating In-World Danger Billboard
  const billboard = createFloatingHazardSign(
    '🔥',
    'EXTREME FIRE',
    'DO NOT ENTER • RADIANT HEAT',
    '#ef4444',
    '#fca5a5',
    3.3
  );
  group.add(billboard.mesh);

  let time = 0;

  return {
    id,
    type: 'fire',
    position,
    radius,
    group,
    update: (delta: number, _playerPos: THREE.Vector3, cameraPos: THREE.Vector3) => {
      time += delta;

      // Update perimeter & billboard
      perimeter.update(delta);
      billboard.update(delta, cameraPos);

      // Flickering dynamic light with multi-wave noise
      fireLight.intensity =
        4.0 +
        Math.sin(time * 18.0) * 1.2 +
        Math.sin(time * 7.5) * 0.8 +
        (Math.random() - 0.5) * 0.5;
      fireLight.position.x = Math.sin(time * 6.0) * 0.15;
      fireLight.position.z = Math.cos(time * 5.0) * 0.15;

      // Animate flame layers (undulation & rotation)
      flameTongues.forEach((flame, idx) => {
        flame.mesh.rotation.y += delta * flame.rotSpeed;
        const wave = Math.sin(time * flame.scaleSpeed + idx * 1.4);
        flame.mesh.scale.set(
          flame.baseScale.x * (1 + wave * 0.15),
          flame.baseScale.y * (1 + wave * 0.25),
          flame.baseScale.z * (1 + wave * 0.15)
        );
      });

      // Animate rising ember sparks
      const posAttr = emberGeo.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < emberCount; i++) {
        const vel = emberVelocities[i];
        arr[i * 3 + 0] += Math.sin(time * 3 + vel.phase) * 0.02 + vel.x * delta;
        arr[i * 3 + 1] += vel.y * delta;
        arr[i * 3 + 2] += Math.cos(time * 3 + vel.phase) * 0.02 + vel.z * delta;

        // Reset if reached ceiling or drifted too far
        if (arr[i * 3 + 1] > 3.8) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * radius * 0.45;
          arr[i * 3 + 0] = Math.cos(angle) * r;
          arr[i * 3 + 1] = 0.2;
          arr[i * 3 + 2] = Math.sin(angle) * r;
        }
      }
      posAttr.needsUpdate = true;
    },
    dispose: () => {
      groundGeo.dispose();
      groundMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      midGeo.dispose();
      midMat.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      emberGeo.dispose();
      emberMat.dispose();
    },
  };
}

/**
 * Creates a visually rich, billowing Volumetric Toxic Gas Hazard
 */
export function createGasHazard(
  id: string,
  position: [number, number, number],
  radius: number
): HazardRig {
  const group = new THREE.Group();
  group.position.set(...position);

  // 1. Chemical spill puddle ground decal
  const groundGeo = new THREE.PlaneGeometry(radius * 1.7, radius * 1.7);
  const groundMat = new THREE.MeshBasicMaterial({
    map: getHazardDecalTexture('gas'),
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  const groundDecal = new THREE.Mesh(groundGeo, groundMat);
  groundDecal.rotation.x = -Math.PI / 2;
  groundDecal.position.y = 0.03;
  group.add(groundDecal);

  // 2. Ruptured pressurized chemical pipe / valve prop
  const cylinderGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.8, 12);
  const cylinderMat = new THREE.MeshStandardMaterial({
    color: 0xeab308, // Warning yellow canister
    metalness: 0.6,
    roughness: 0.4,
  });
  const drumMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
  drumMesh.position.set(0, 0.4, 0);
  drumMesh.castShadow = true;
  group.add(drumMesh);

  // Pipe valve nozzle venting gas
  const nozzleGeo = new THREE.TorusGeometry(0.2, 0.06, 8, 16);
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
  const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.set(0, 0.82, 0);
  group.add(nozzle);

  // 3. Toxic hazard perimeter ring
  const perimeter = createHazardPerimeterRing(radius, 0x84cc16);
  group.add(perimeter.mesh);

  // 4. Toxic eerie fluorescent point light
  const gasLight = new THREE.PointLight(0x84cc16, 3.8, radius * 2.2, 1.8);
  gasLight.position.set(0, 1.2, 0);
  group.add(gasLight);

  // 5. Billowing translucent toxic clouds (multi-cluster undulating spheres)
  const cloudClusters: {
    group: THREE.Group;
    rotSpeed: number;
    bobSpeed: number;
    initialY: number;
  }[] = [];

  const gasColors = [0x84cc16, 0x22c55e, 0xa3e635, 0x4ade80];

  for (let c = 0; c < 3; c++) {
    const cluster = new THREE.Group();
    const puffCount = 7;
    const baseColor = gasColors[c % gasColors.length];

    for (let p = 0; p < puffCount; p++) {
      const puffGeo = new THREE.DodecahedronGeometry(0.85 + Math.random() * 0.55, 1);
      const puffMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.38 - c * 0.07,
        roughness: 0.9,
        depthWrite: false,
      });
      const puff = new THREE.Mesh(puffGeo, puffMat);
      const angle = (p / puffCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = (0.3 + Math.random() * 0.6) * radius * 0.8;
      puff.position.set(
        Math.cos(angle) * dist,
        0.4 + Math.random() * 1.4,
        Math.sin(angle) * dist
      );
      cluster.add(puff);
    }

    cluster.position.y = 0.3 + c * 0.4;
    group.add(cluster);

    cloudClusters.push({
      group: cluster,
      rotSpeed: (c % 2 === 0 ? 1 : -1) * (0.25 + c * 0.1),
      bobSpeed: 1.5 + c * 0.7,
      initialY: cluster.position.y,
    });
  }

  // 6. Suspended Bio-hazard Spore / Chemical Sparkle Particles
  const sporeCount = 45;
  const sporePositions = new Float32Array(sporeCount * 3);
  const sporeSpeeds: { vx: number; vy: number; vz: number; seed: number }[] = [];

  for (let i = 0; i < sporeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius * 0.85;
    sporePositions[i * 3 + 0] = Math.cos(angle) * r;
    sporePositions[i * 3 + 1] = 0.2 + Math.random() * 2.2;
    sporePositions[i * 3 + 2] = Math.sin(angle) * r;

    sporeSpeeds.push({
      vx: (Math.random() - 0.5) * 0.35,
      vy: 0.25 + Math.random() * 0.5,
      vz: (Math.random() - 0.5) * 0.35,
      seed: Math.random() * 10,
    });
  }

  const sporeGeo = new THREE.BufferGeometry();
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));
  const sporeMat = new THREE.PointsMaterial({
    color: 0xd9f99d,
    size: 0.18,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sporePoints = new THREE.Points(sporeGeo, sporeMat);
  group.add(sporePoints);

  // 7. Floating In-World Danger Billboard
  const billboard = createFloatingHazardSign(
    '☣️',
    'TOXIC GAS LEAK',
    'CORROSIVE VAPOR • GAS MASK REQ.',
    '#84cc16',
    '#d9f99d',
    2.9
  );
  group.add(billboard.mesh);

  let time = 0;

  return {
    id,
    type: 'gas',
    position,
    radius,
    group,
    update: (delta: number, _playerPos: THREE.Vector3, cameraPos: THREE.Vector3) => {
      time += delta;

      perimeter.update(delta);
      billboard.update(delta, cameraPos);

      // Eerie fluctuating toxic light
      gasLight.intensity = 3.2 + Math.sin(time * 4.0) * 0.9;

      // Rotate and undulate cloud layers
      cloudClusters.forEach((cluster) => {
        cluster.group.rotation.y += delta * cluster.rotSpeed;
        cluster.group.position.y =
          cluster.initialY + Math.sin(time * cluster.bobSpeed) * 0.12;
      });

      // Waft spore particles
      const posAttr = sporeGeo.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < sporeCount; i++) {
        const sp = sporeSpeeds[i];
        arr[i * 3 + 0] += Math.sin(time * 2 + sp.seed) * 0.015 + sp.vx * delta;
        arr[i * 3 + 1] += sp.vy * delta;
        arr[i * 3 + 2] += Math.cos(time * 2 + sp.seed) * 0.015 + sp.vz * delta;

        if (arr[i * 3 + 1] > 2.6) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * radius * 0.75;
          arr[i * 3 + 0] = Math.cos(a) * r;
          arr[i * 3 + 1] = 0.2;
          arr[i * 3 + 2] = Math.sin(a) * r;
        }
      }
      posAttr.needsUpdate = true;
    },
    dispose: () => {
      groundGeo.dispose();
      groundMat.dispose();
      cylinderGeo.dispose();
      cylinderMat.dispose();
      sporeGeo.dispose();
      sporeMat.dispose();
    },
  };
}

/**
 * Creates a visually dramatic, realistic Dense Smoke Hazard
 */
export function createSmokeHazard(
  id: string,
  position: [number, number, number],
  radius: number
): HazardRig {
  const group = new THREE.Group();
  group.position.set(...position);

  // 1. Soot ground decal
  const groundGeo = new THREE.PlaneGeometry(radius * 1.6, radius * 1.6);
  const groundMat = new THREE.MeshBasicMaterial({
    map: getHazardDecalTexture('smoke'),
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const groundDecal = new THREE.Mesh(groundGeo, groundMat);
  groundDecal.rotation.x = -Math.PI / 2;
  groundDecal.position.y = 0.03;
  group.add(groundDecal);

  // 2. Hazard boundary ring
  const perimeter = createHazardPerimeterRing(radius, 0xf59e0b);
  group.add(perimeter.mesh);

  // 3. Dense Volumetric Smoke Clusters (Ceiling layer & Mid plumes)
  const smokeClusters: {
    group: THREE.Group;
    rotSpeed: number;
    initialY: number;
  }[] = [];

  const smokeTones = [0x1e293b, 0x334155, 0x475569, 0x0f172a];

  // Ceiling stratified dense smoke blanket
  const ceilingSmokeGroup = new THREE.Group();
  ceilingSmokeGroup.position.y = 2.4;

  for (let i = 0; i < 14; i++) {
    const sphereGeo = new THREE.SphereGeometry(1.1 + Math.random() * 0.7, 7, 7);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: smokeTones[i % smokeTones.length],
      roughness: 0.95,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const puff = new THREE.Mesh(sphereGeo, sphereMat);
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
    const r = (0.2 + Math.random() * 0.7) * radius;
    puff.position.set(
      Math.cos(angle) * r,
      (Math.random() - 0.5) * 0.6,
      Math.sin(angle) * r
    );
    ceilingSmokeGroup.add(puff);
  }
  group.add(ceilingSmokeGroup);
  smokeClusters.push({ group: ceilingSmokeGroup, rotSpeed: 0.12, initialY: 2.4 });

  // Mid-level rolling smoke column
  const midSmokeGroup = new THREE.Group();
  midSmokeGroup.position.y = 1.4;

  for (let i = 0; i < 10; i++) {
    const sphereGeo = new THREE.SphereGeometry(0.85 + Math.random() * 0.5, 6, 6);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.95,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const puff = new THREE.Mesh(sphereGeo, sphereMat);
    const angle = (i / 10) * Math.PI * 2;
    const r = Math.random() * radius * 0.6;
    puff.position.set(
      Math.cos(angle) * r,
      (Math.random() - 0.5) * 0.5,
      Math.sin(angle) * r
    );
    midSmokeGroup.add(puff);
  }
  group.add(midSmokeGroup);
  smokeClusters.push({ group: midSmokeGroup, rotSpeed: -0.16, initialY: 1.4 });

  // 4. Drifting Soot & Ash Flakes
  const ashCount = 50;
  const ashPositions = new Float32Array(ashCount * 3);
  const ashSpeeds: { vx: number; vy: number; vz: number }[] = [];

  for (let i = 0; i < ashCount; i++) {
    ashPositions[i * 3 + 0] = (Math.random() - 0.5) * radius * 1.5;
    ashPositions[i * 3 + 1] = 0.5 + Math.random() * 2.5;
    ashPositions[i * 3 + 2] = (Math.random() - 0.5) * radius * 1.5;

    ashSpeeds.push({
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.2 + Math.random() * 0.4), // Falling ash flakes
      vz: (Math.random() - 0.5) * 0.3,
    });
  }

  const ashGeo = new THREE.BufferGeometry();
  ashGeo.setAttribute('position', new THREE.BufferAttribute(ashPositions, 3));
  const ashMat = new THREE.PointsMaterial({
    color: 0x94a3b8,
    size: 0.14,
    transparent: true,
    opacity: 0.75,
  });
  const ashPoints = new THREE.Points(ashGeo, ashMat);
  group.add(ashPoints);

  // 5. Floating In-World Danger Billboard
  const billboard = createFloatingHazardSign(
    '💨',
    'DENSE SMOKE',
    'CARBON TOXICITY • LOW CRAWL',
    '#f59e0b',
    '#fde68a',
    3.2
  );
  group.add(billboard.mesh);

  let time = 0;

  return {
    id,
    type: 'smoke',
    position,
    radius,
    group,
    update: (delta: number, _playerPos: THREE.Vector3, cameraPos: THREE.Vector3) => {
      time += delta;

      perimeter.update(delta);
      billboard.update(delta, cameraPos);

      // Billowing cluster rotation
      smokeClusters.forEach((cluster) => {
        cluster.group.rotation.y += delta * cluster.rotSpeed;
        cluster.group.position.y =
          cluster.initialY + Math.sin(time * 1.5) * 0.08;
      });

      // Drifting falling ash flakes
      const posAttr = ashGeo.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < ashCount; i++) {
        const vel = ashSpeeds[i];
        arr[i * 3 + 0] += vel.vx * delta + Math.sin(time + i) * 0.005;
        arr[i * 3 + 1] += vel.vy * delta;
        arr[i * 3 + 2] += vel.vz * delta + Math.cos(time + i) * 0.005;

        // Reset if reached floor
        if (arr[i * 3 + 1] < 0.2) {
          arr[i * 3 + 0] = (Math.random() - 0.5) * radius * 1.4;
          arr[i * 3 + 1] = 2.8 + Math.random() * 0.5;
          arr[i * 3 + 2] = (Math.random() - 0.5) * radius * 1.4;
        }
      }
      posAttr.needsUpdate = true;
    },
    dispose: () => {
      groundGeo.dispose();
      groundMat.dispose();
      ashGeo.dispose();
      ashMat.dispose();
    },
  };
}

/**
 * Creates High Voltage Arc Flash Hazard
 */
export function createElectricalHazard(
  id: string,
  position: [number, number, number],
  radius: number
): HazardRig {
  const group = new THREE.Group();
  group.position.set(...position);

  // 1. Arc burn decal
  const groundGeo = new THREE.PlaneGeometry(radius * 1.5, radius * 1.5);
  const groundMat = new THREE.MeshBasicMaterial({
    map: getHazardDecalTexture('electrical'),
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const groundDecal = new THREE.Mesh(groundGeo, groundMat);
  groundDecal.rotation.x = -Math.PI / 2;
  groundDecal.position.y = 0.03;
  group.add(groundDecal);

  // 2. Hazard boundary ring
  const perimeter = createHazardPerimeterRing(radius, 0x06b6d4);
  group.add(perimeter.mesh);

  // 3. Electrical spark strobe point light
  const sparkLight = new THREE.PointLight(0x38bdf8, 6.0, radius * 2.4, 2.0);
  sparkLight.position.set(0, 1.5, 0);
  group.add(sparkLight);

  // 4. Arc spark lines
  const sparkGeo = new THREE.OctahedronGeometry(0.35);
  const sparkMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    wireframe: true,
  });
  const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
  sparkMesh.position.y = 1.5;
  group.add(sparkMesh);

  // 5. Floating In-World Danger Billboard
  const billboard = createFloatingHazardSign(
    '⚡',
    'ELECTRICAL ARC',
    'HIGH VOLTAGE • 10,000V HAZARD',
    '#0284c7',
    '#7dd3fc',
    3.0
  );
  group.add(billboard.mesh);

  let time = 0;

  return {
    id,
    type: 'electrical_arc',
    position,
    radius,
    group,
    update: (delta: number, _playerPos: THREE.Vector3, cameraPos: THREE.Vector3) => {
      time += delta;

      perimeter.update(delta);
      billboard.update(delta, cameraPos);

      // Random high voltage spark strobe
      const isStrobe = Math.random() > 0.65;
      sparkLight.intensity = isStrobe ? 6.5 + Math.random() * 4.0 : 0.4;
      sparkLight.color.setHex(Math.random() > 0.3 ? 0x38bdf8 : 0xffffff);

      sparkMesh.rotation.x += delta * 15;
      sparkMesh.rotation.y += delta * 20;
      sparkMesh.scale.setScalar(isStrobe ? 1.4 : 0.6);
    },
    dispose: () => {
      groundGeo.dispose();
      groundMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
    },
  };
}
