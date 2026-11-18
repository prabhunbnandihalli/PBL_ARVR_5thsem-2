import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { DoorClosed, DoorOpen, AlertTriangle, Flame, Wind, Zap, Biohazard, Skull, HeartCrack, Activity } from 'lucide-react';
import { CampusMapData, CharacterCustomization, DisasterType, DrillScoreReport, PeerUser, HealthReportData } from '../types';
import { createCharacterRig, CharacterRig } from '../utils/characterModel';
import { soundFX } from '../utils/audio';
import {
  createArchitecturalWall,
  createInteractiveDoorPortal,
  createBuildingCeilingStructure,
  createMezzanineFloorStructure,
  createArchitecturalStaircase,
  createExteriorFireEscape,
  createHealthCareCenter,
  CeilingRig,
  DoorRig,
  getTileTexture,
  getGrassTexture,
} from '../utils/mapVisuals';
import {
  createCampusCompoundAndRoad,
  CompoundVisualsResult,
} from '../utils/compoundVisuals';
import {
  createEmergencyLadderRopeVisuals,
  LadderRopeVisualsResult,
} from '../utils/ladderRopeEscape';
import {
  createFireHazard,
  createGasHazard,
  createSmokeHazard,
  createElectricalHazard,
  HazardRig,
} from '../utils/hazardVisuals';

/**
 * 2D horizontal ray-box intersection test for spring-arm camera wall collision avoidance
 */
function testRayBoxCollision(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  box: { minX: number; maxX: number; minZ: number; maxZ: number },
  maxDist: number
): number | null {
  let tmin = 0;
  let tmax = maxDist;

  if (Math.abs(dx) < 1e-6) {
    if (ox < box.minX || ox > box.maxX) return null;
  } else {
    const invD = 1 / dx;
    let t1 = (box.minX - ox) * invD;
    let t2 = (box.maxX - ox) * invD;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  if (Math.abs(dz) < 1e-6) {
    if (oz < box.minZ || oz > box.maxZ) return null;
  } else {
    const invD = 1 / dz;
    let t1 = (box.minZ - oz) * invD;
    let t2 = (box.maxZ - oz) * invD;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  return tmin > 0 ? tmin : null;
}

/**
 * Clamps ray distance so the camera eye remains strictly within the interior building box
 */
function clipRayInsideBox(
  ox: number, oz: number,
  dx: number, dz: number,
  box: { minX: number; maxX: number; minZ: number; maxZ: number },
  maxDist: number
): number {
  let tMax = maxDist;
  if (dx > 1e-5) {
    tMax = Math.min(tMax, (box.maxX - ox) / dx);
  } else if (dx < -1e-5) {
    tMax = Math.min(tMax, (box.minX - ox) / dx);
  }
  if (dz > 1e-5) {
    tMax = Math.min(tMax, (box.maxZ - oz) / dz);
  } else if (dz < -1e-5) {
    tMax = Math.min(tMax, (box.minZ - oz) / dz);
  }
  return Math.max(1.4, tMax - 0.2);
}

interface Simulator3DProps {
  mapData: CampusMapData;
  disasterType: DisasterType;
  customization: CharacterCustomization;
  isARMode: boolean;
  cameraStream: MediaStream | null;
  onDrillComplete: (report: DrillScoreReport) => void;
  onCheckpointReached: (index: number, points: number) => void;
  movementInput: { x: number; y: number; isSprinting: boolean; isCrouching: boolean; interact: boolean; jump: boolean };
  flashlightEnabled: boolean;
  viewMode: 'third' | 'first' | 'tactical';
  onStatsUpdate: (stats: {
    elapsedTime: number;
    health: number;
    smokeInhalation: number;
    stamina: number;
    currentScore: number;
    nearestCheckpointDist: number;
    compassHeading: number;
    currentFloor: number;
    targetAngle: number;
    playerPosition: [number, number, number];
    playerRotation: number;
  }) => void;
  startPosition?: [number, number, number];
  onOpenHealthCareCenter?: (report: HealthReportData) => void;
}

// Modular shortest-path angular interpolation to prevent 360-degree wrapping glitches
function lerpAngle(current: number, target: number, speed: number): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * speed;
}

// Helper to construct a crisp 3D Chevron Directional Arrow geometry for floor guidance
function createChevronArrowGeometry(width = 0.28, length = 0.32): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const halfW = width * 0.5;
  const halfL = length * 0.5;
  // In 2D plane: Tip points along -Y so that after rotation.x = -Math.PI / 2,
  // surface normal points UP (+Y) and arrow tip points forward along local +Z!
  shape.moveTo(0, -halfL); // tip
  shape.lineTo(halfW, halfL * 0.3); // right outer wing
  shape.lineTo(halfW * 0.36, halfL * 0.05); // right inner notch
  shape.lineTo(halfW * 0.22, halfL); // right tail stem
  shape.lineTo(-halfW * 0.22, halfL); // left tail stem
  shape.lineTo(-halfW * 0.36, halfL * 0.05); // left inner notch
  shape.lineTo(-halfW, halfL * 0.3); // left outer wing
  shape.closePath();

  return new THREE.ShapeGeometry(shape);
}

export const Simulator3D: React.FC<Simulator3DProps> = ({
  mapData,
  disasterType,
  customization,
  isARMode,
  cameraStream,
  onDrillComplete,
  onCheckpointReached,
  movementInput,
  flashlightEnabled,
  viewMode,
  onStatsUpdate,
  startPosition,
  onOpenHealthCareCenter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const deathTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronized props refs to avoid stale closure in the 60fps render loop
  const movementInputRef = useRef(movementInput);
  movementInputRef.current = movementInput;

  const flashlightEnabledRef = useRef(flashlightEnabled);
  flashlightEnabledRef.current = flashlightEnabled;

  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  const onStatsUpdateRef = useRef(onStatsUpdate);
  onStatsUpdateRef.current = onStatsUpdate;

  const onCheckpointReachedRef = useRef(onCheckpointReached);
  onCheckpointReachedRef.current = onCheckpointReached;

  const onDrillCompleteRef = useRef(onDrillComplete);
  onDrillCompleteRef.current = onDrillComplete;

  const onOpenHealthCareCenterRef = useRef(onOpenHealthCareCenter);
  onOpenHealthCareCenterRef.current = onOpenHealthCareCenter;

  const customizationRef = useRef(customization);
  customizationRef.current = customization;

  // Direct keyboard tracking for immediate desktop movement
  const keysDown = useRef<{ [key: string]: boolean }>({});

  // Simulation state refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerRigRef = useRef<CharacterRig | null>(null);
  const ceilingRigRef = useRef<CeilingRig | null>(null);
  const compoundRigRef = useRef<CompoundVisualsResult | null>(null);
  const ladderRopeRigRef = useRef<LadderRopeVisualsResult | null>(null);

  // Fast-rope descent slide kinematic animation state
  const ropeSlideState = useRef<{
    isDescending: boolean;
    progress: number;
    startY: number;
    targetY: number;
    startX: number;
    targetX: number;
    startZ: number;
    targetZ: number;
  }>({
    isDescending: false,
    progress: 0,
    startY: 3.6,
    targetY: 0,
    startX: 0,
    targetX: 0,
    startZ: 0,
    targetZ: 0,
  });

  // State for on-screen prompt when near rope & ladder exit
  const [isNearRopeExit, setIsNearRopeExit] = useState<boolean>(false);

  // Camera Orbit State (Camera visual direction calibrated for indoor building view)
  const cameraOrbit = useRef({
    yaw: 0, // Horizontal orbit angle in radians
    pitch: 0.22, // Vertical tilt angle (~12.6 degrees - ideal eye-level follow)
    dist: 3.6, // Camera distance from player inside building
    targetYaw: 0,
    targetPitch: 0.22,
  });

  // Pointer drag state for camera look
  const dragRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    startYaw: number;
    startPitch: number;
    pointerId: number | null;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startYaw: 0,
    startPitch: 0,
    pointerId: null,
  });

  // Interactive Door States & Refs
  const [nearbyDoor, setNearbyDoor] = useState<{ id: string; isOpen: boolean; isEmergency: boolean } | null>(null);
  const nearbyDoorState = useRef<{ id: string; isOpen: boolean; isEmergency: boolean } | null>(null);
  const activeDoorRef = useRef<DoorRig | null>(null);
  const prevInteractRef = useRef<boolean>(false);
  const doorsRef = useRef<DoorRig[]>([]);

  // Hazard Proximity Alert State for Screen Visual Effects & In-Screen Warning HUD
  const [hazardAlert, setHazardAlert] = useState<{
    id: string;
    type: 'fire' | 'gas' | 'smoke' | 'debris' | 'chemical_leak' | 'electrical_arc';
    dist: number;
    radius: number;
    description: string;
    isInside: boolean;
    urgency: 'caution' | 'danger' | 'critical';
  } | null>(null);
  const lastHazardAlertUpdate = useRef<number>(0);

  // Character Danger Sensing & Vital Casualty States
  const [isDead, setIsDead] = useState(false);
  const [fatalCause, setFatalCause] = useState<string>('');
  const [dangerSenseLevel, setDangerSenseLevel] = useState<number>(0);

  // Manual or Touch Toggle for interactive doors
  const handleToggleDoor = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeDoorRef.current) {
      const newOpen = activeDoorRef.current.toggle();
      soundFX.playDoor(newOpen);
      const updated = {
        id: activeDoorRef.current.id,
        isOpen: newOpen,
        isEmergency: activeDoorRef.current.isEmergency,
      };
      nearbyDoorState.current = updated;
      setNearbyDoor(updated);
    }
  };

  // Manual or Touch Trigger for 1st-floor tactical rope escape
  const handleTriggerRopeSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const elr = mapData.emergencyLadderRope;
    if (!elr || ropeSlideState.current.isDescending) return;
    const p = playerState.current;
    ropeSlideState.current = {
      isDescending: true,
      progress: 0,
      startY: p.pos.y,
      targetY: elr.groundPosition[1],
      startX: p.pos.x,
      targetX: elr.groundPosition[0],
      startZ: p.pos.z,
      targetZ: elr.groundPosition[2],
    };
    soundFX.playRopeSlide();
    p.score += 350;
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.65 },
      colors: ['#22c55e', '#38bdf8', '#facc15', '#f97316'],
    });
  };

  // State for on-screen prompt when near Health Care Center / Triage
  const [isNearHealthCenter, setIsNearHealthCenter] = useState<boolean>(false);
  const isNearHealthCenterRef = useRef<boolean>(false);

  // Player physics state (originating from selected starting room)
  const initialSpawn = startPosition || mapData.initialPlayerPosition;
  const playerState = useRef({
    pos: new THREE.Vector3(...initialSpawn),
    velocity: new THREE.Vector3(0, 0, 0),
    rotationY: 0,
    health: 100,
    smokeInhalation: 0,
    stamina: 100,
    score: 0,
    currentCheckpointIndex: 0,
    completed: false,
    isDead: false,
    deathHandled: false,
    fatalCause: '',
    dangerSensedLevel: 0,
    startTime: Date.now(),
    hazardsHitCount: 0,
    peerAssisted: false,
  });

  // Helper to generate comprehensive HealthReportData
  const generateHealthReport = (p: typeof playerState.current, elapsed: number): HealthReportData => {
    const isGreen = p.health >= 75 && p.smokeInhalation < 35;
    const isYellow = (p.health >= 40 && p.health < 75) || (p.smokeInhalation >= 35 && p.smokeInhalation < 70);

    const heartRate = Math.min(145, Math.max(76, Math.floor(78 + (100 - p.health) * 0.45 + (120 / Math.max(elapsed, 20)) * 5)));
    const sysBp = Math.floor(118 + (100 - p.health) * 0.2);
    const diaBp = Math.floor(76 + (100 - p.health) * 0.1);
    const spo2 = Math.max(88, Math.min(99, Math.floor(99 - p.smokeInhalation * 0.12)));
    const coHb = +(1.2 + p.smokeInhalation * 0.08).toFixed(1);
    const respRate = Math.min(32, Math.max(16, Math.floor(16 + (100 - p.health) * 0.15)));

    return {
      reportId: 'med_' + Date.now(),
      drillId: 'drill_' + Date.now(),
      cadetName: customizationRef.current.name || 'Cadet',
      cadetRole: customizationRef.current.role,
      campusName: mapData.name,
      disasterType,
      evacuationTimeSeconds: Math.floor(elapsed),
      routeUsed: 'Illuminated Emergency Evacuation Path & Safe Zone',
      triageTag: isGreen ? 'GREEN' : isYellow ? 'YELLOW' : 'RED',
      triageCategory: isGreen ? 'Priority 3: Minor / Walking Wounded' : isYellow ? 'Priority 2: Delayed Care Required' : 'Priority 1: Immediate Critical Care',
      vitals: {
        heartRateBpm: heartRate,
        bloodPressure: `${sysBp}/${diaBp} mmHg`,
        spo2Percent: spo2,
        respiratoryRateBpm: respRate,
        bodyTempC: 36.8,
        carbonMonoxideCoHb: coHb,
      },
      clinicalFindings: {
        airwayLungsStatus: spo2 >= 95 ? 'Lungs clear bilaterally to auscultation. Normal vesicular breath sounds. No wheezes or stridor.' : 'Mild upper airway irritation from smoke particles. Bronchial hygiene and supplemental humidified oxygen advised.',
        thermalBurnStatus: 'Full body dermatoscan negative for 1st or 2nd-degree thermal burns. Protective gear remained intact during evacuation.',
        musculoskeletalStatus: 'Lower extremities, knees, and ankles evaluated post-staircase and tactical egress. Full active range of motion; no ligamentous sprain.',
        psychologicalShock: 'Cadet alert, oriented x 4 (person, place, time, situation). Normal pupil reactivity. Reactive stress managed well.',
      },
      treatmentAdministered: [
        'Rapid Simple Triage and Rapid Treatment (START) assessment',
        'Continuous pulse oximetry and ECG rhythm screening',
        'Sterile eye wash & smoke particle facial rinse',
        'Hydration & post-evacuation rest monitoring',
      ],
      physicianNotes: isGreen
        ? 'Cadet successfully evacuated without sustaining severe physical trauma or critical smoke intoxication. Vitals are responsive and stable. Clear for normal duty after 15 minutes of observation.'
        : 'Cadet experienced moderate smoke inhalation and elevated cardiovascular strain during evacuation. Supplemental oxygen administered. Recommend 24-hour observation for delayed pulmonary symptoms.',
      doctorName: 'Dr. Sarah Chen, MD (Emergency Disaster Medicine Chief)',
      paramedicName: 'Lt. Marcus Brody, EMT-P (Field Triage Supervisor)',
      dischargeStatus: isGreen ? 'Fit for Normal Duty' : 'Observation Recommended',
      timestamp: new Date().toLocaleTimeString(),
      evacuationScore: p.score,
      evacuationGrade: (p.health > 85 ? 'S' : p.health > 70 ? 'A' : p.health > 55 ? 'B' : 'C') as any,
    };
  };

  // Open Health Care Center check-up report
  const handleOpenHealthCareCenter = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const p = playerState.current;
    const elapsed = (Date.now() - p.startTime) / 1000;
    const report = generateHealthReport(p, elapsed);
    onOpenHealthCareCenterRef.current?.(report);
  };

  // Dynamic reaction when startPosition prop changes
  useEffect(() => {
    if (startPosition) {
      playerState.current.pos.set(startPosition[0], startPosition[1], startPosition[2]);
      playerState.current.velocity.set(0, 0, 0);
      playerState.current.health = 100;
      playerState.current.smokeInhalation = 0;
      playerState.current.stamina = 100;
      playerState.current.isDead = false;
      playerState.current.deathHandled = false;
      setIsDead(false);
      soundFX.playDoor(true);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#06b6d4', '#10b981', '#f59e0b'],
      });
    }
  }, [startPosition]);

  // Checkpoints state copy
  const checkpointsRef = useRef(mapData.checkpoints.map(cp => ({ ...cp })));

  // Setup video element for AR mode
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [cameraStream]);

  // Main Three.js Scene Setup & Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reset player state on map change
    const spawnPos = startPosition || mapData.initialPlayerPosition;
    playerState.current = {
      pos: new THREE.Vector3(...spawnPos),
      velocity: new THREE.Vector3(0, 0, 0),
      rotationY: 0,
      health: 100,
      smokeInhalation: 0,
      stamina: 100,
      score: 0,
      currentCheckpointIndex: 0,
      completed: false,
      isDead: false,
      deathHandled: false,
      fatalCause: '',
      dangerSensedLevel: 0,
      startTime: Date.now(),
      hazardsHitCount: 0,
      peerAssisted: false,
    };
    setIsDead(false);
    setFatalCause('');
    setDangerSenseLevel(0);
    checkpointsRef.current = mapData.checkpoints.map(cp => ({ ...cp }));

    // Reset camera orbit behind player calibrated for indoor building view
    cameraOrbit.current.yaw = 0;
    cameraOrbit.current.targetYaw = 0;
    cameraOrbit.current.pitch = 0.22;
    cameraOrbit.current.targetPitch = 0.22;
    cameraOrbit.current.dist = 3.6;

    soundFX.startEmergencySiren(0.025);

    // 1. Scene with Clear Visuals
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = isARMode ? null : new THREE.Color(0x0a0f1d);
    if (!isARMode) {
      scene.fog = new THREE.Fog(0x0a0f1d, 55, 120);
    }

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 160);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Balanced Lighting
    const hemiLight = new THREE.HemisphereLight(
      isARMode ? 0xffffff : 0xe0f2fe,
      isARMode ? 0x64748b : 0x1e293b,
      isARMode ? 2.2 : 1.8
    );
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    dirLight.position.set(25, 45, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    const d = 40;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    const emergencyStrobe = new THREE.PointLight(0xef4444, 2.5, 24);
    emergencyStrobe.position.set(0, 3.4, 0);
    scene.add(emergencyStrobe);

    // 5. Environment Geometry
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const corridorTileTex = getTileTexture('#f1f5f9', '#e2e8f0');
    const floorMat = new THREE.MeshStandardMaterial({
      map: corridorTileTex,
      roughness: 0.6,
      metalness: 0.05,
      transparent: isARMode,
      opacity: isARMode ? 0.35 : 1,
    });
    const mainFloor = new THREE.Mesh(floorGeo, floorMat);
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.receiveShadow = true;
    scene.add(mainFloor);

    const grid = new THREE.GridHelper(120, 60, 0x10b981, 0x334155);
    grid.position.y = 0.015;
    scene.add(grid);

    // Room Floors
    mapData.rooms.forEach((room) => {
      const roomY = room.elevation || 0;
      const rMinX = room.center[0] - room.size[0] / 2;
      const rMaxX = room.center[0] + room.size[0] / 2;
      const rMinZ = room.center[1] - room.size[1] / 2;
      const rMaxZ = room.center[1] + room.size[1] / 2;

      // Skip upper level hallways/concourses already constructed with stairwell openings by createMezzanineFloorStructure
      if (
        roomY >= 1.8 &&
        (room.name.toLowerCase().includes('concourse') ||
          room.name.toLowerCase().includes('hallway') ||
          room.name.toLowerCase().includes('lounge'))
      ) {
        return;
      }

      // Ensure no room floor is rendered over staircase openings on upper level
      if (mapData.staircases && roomY >= 1.8) {
        const coversStair = mapData.staircases.some((st) => {
          return (
            rMaxX > st.bounds.minX + 0.1 &&
            rMinX < st.bounds.maxX - 0.1 &&
            rMaxZ > st.bounds.minZ + 0.1 &&
            rMinZ < st.bounds.maxZ - 0.1
          );
        });
        if (coversStair) {
          return;
        }
      }

      const isOutdoor = room.name.toLowerCase().includes('field') || room.name.toLowerCase().includes('plaza') || room.name.toLowerCase().includes('courtyard');
      const isLab = room.name.toLowerCase().includes('lab') || room.name.toLowerCase().includes('server');

      const rGeo = new THREE.PlaneGeometry(room.size[0], room.size[1]);
      let rTexture: THREE.CanvasTexture;

      if (isOutdoor) {
        rTexture = getGrassTexture();
      } else if (isLab) {
        rTexture = getTileTexture('#fee2e2', '#fecaca');
      } else {
        rTexture = getTileTexture('#e2e8f0', '#cbd5e1');
      }

      const rMat = new THREE.MeshStandardMaterial({
        map: rTexture,
        roughness: isOutdoor ? 0.9 : 0.5,
        metalness: 0.05,
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.rotation.x = -Math.PI / 2;
      rMesh.position.set(room.center[0], (room.elevation || 0) + 0.025, room.center[1]);
      rMesh.receiveShadow = true;
      scene.add(rMesh);
    });

    // 6. Architectural 3D Walls (Ground Floor & 1st Floor)
    const wallColliders: { minX: number; maxX: number; minZ: number; maxZ: number; minY?: number; maxY?: number }[] = [];

    mapData.walls.forEach((wall) => {
      const { meshGroup, collider } = createArchitecturalWall(
        wall.start,
        wall.end,
        wall.height,
        wall.color || '#e2e8f0',
        wall.label,
        wall.baseY || 0
      );
      scene.add(meshGroup);
      wallColliders.push(collider);
    });

    // 7. Mezzanine Floor Structure (1st Floor / Extra Floor)
    const indoorBounds = mapData.indoorBounds || { minX: -20, maxX: 20, minZ: -16, maxZ: 14 };
    const mezzanine = createMezzanineFloorStructure({
      bounds: indoorBounds,
      elevation: 3.6,
      staircases: mapData.staircases || [],
    });
    scene.add(mezzanine.group);
    wallColliders.push(...mezzanine.colliders);

    // 8. Walkable Dual Interior Staircases (Two stairs for escape choice)
    if (mapData.staircases) {
      mapData.staircases.forEach((stair) => {
        const stairRig = createArchitecturalStaircase(stair);
        scene.add(stairRig.group);
      });
    }

    // 9. Exterior Emergency Fire Escape (Direct 1st-floor exterior escape to ground muster)
    if (mapData.exteriorFireEscape) {
      const fireEscape = createExteriorFireEscape(mapData.exteriorFireEscape);
      scene.add(fireEscape.group);
      wallColliders.push(...fireEscape.colliders);
    }

    // 9b. Interactive Emergency Health Care Center & Medical Triage Clinic at Assembly Area
    const hcPos = mapData.healthCareCenter?.position || mapData.safeAssemblyPosition;
    const healthCareCenterRig = createHealthCareCenter(hcPos);
    scene.add(healthCareCenterRig.group);

    // 10. Interactive 3D Doors (Operable Swing Doors with Physical Portals & Ceiling Lintels)
    const ceilingHeight = mapData.ceilingHeight || 7.0;

    const doorRigs: DoorRig[] = [];
    mapData.doors.forEach((door, idx) => {
      const isUpper = (door.position[1] || 0) >= 3.0;
      const doorCeilingH = isUpper ? ceilingHeight - 3.6 : 3.6;
      const doorRig = createInteractiveDoorPortal(
        door.position,
        door.isEmergencyExit,
        false,
        `door_${idx}`,
        door.rotationY || 0,
        doorCeilingH,
        door.label,
        door.infoBoard
      );
      scene.add(doorRig.group);
      doorRigs.push(doorRig);
    });
    doorsRef.current = doorRigs;

    // 11. Architectural Building Ceiling Structure with Acoustic Tiles, LED Troffers & Sprinklers
    const corridorLights = [
      new THREE.Vector3(-14, ceilingHeight, 0),
      new THREE.Vector3(-4, ceilingHeight, 0),
      new THREE.Vector3(6, ceilingHeight, 0),
      new THREE.Vector3(12, ceilingHeight, 4),
      new THREE.Vector3(16, ceilingHeight, 8),
    ];

    const ceilingRig = createBuildingCeilingStructure({
      bounds: indoorBounds,
      height: ceilingHeight,
      corridorLightPositions: corridorLights,
      theme: mapData.id as any,
    });
    ceilingRigRef.current = ceilingRig;
    scene.add(ceilingRig.group);

    // 12. Assembly Safety Beacon
    const assemblyGroup = new THREE.Group();
    assemblyGroup.position.set(...mapData.safeAssemblyPosition);
    const beaconGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.25, 32);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.85,
    });
    const beaconRing = new THREE.Mesh(beaconGeo, beaconMat);
    assemblyGroup.add(beaconRing);

    const beamGeo = new THREE.CylinderGeometry(0.6, 0.6, 22, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 11;
    assemblyGroup.add(beam);
    scene.add(assemblyGroup);

    // 12b. Compound Boundary Perimeter Walls & Public Access Road Infrastructure
    if (mapData.compound && mapData.road) {
      const compoundRig = createCampusCompoundAndRoad(
        mapData.compound,
        mapData.road,
        mapData.name
      );
      scene.add(compoundRig.group);
      wallColliders.push(...compoundRig.colliders);
      compoundRigRef.current = compoundRig;
    }

    // 12c. Unique 1st-Floor Emergency Ladder & Tactical Rope Descent Station
    if (mapData.emergencyLadderRope) {
      const lrRig = createEmergencyLadderRopeVisuals(mapData.emergencyLadderRope);
      scene.add(lrRig.group);
      wallColliders.push(...lrRig.colliders);
      ladderRopeRigRef.current = lrRig;
    }

    // 13. Paths: Straight pathways with 3D Directional Chevron Navigation Arrows
    const animatedFloorArrows: {
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      globalPos: THREE.Vector3;
      isGreenSafe: boolean;
    }[] = [];

    const createStraightSquarePath = (
      nodes: typeof mapData.safePathNodes,
      color: number,
      emissiveColor: number,
      isGreenSafe: boolean = true
    ) => {
      if (!nodes || nodes.length < 2) return null;

      const group = new THREE.Group();
      const pathWidth = isGreenSafe ? 0.46 : 0.36;
      const pathHeight = 0.04;

      const pathMat = new THREE.MeshStandardMaterial({
        color,
        emissive: emissiveColor,
        emissiveIntensity: 0.95,
        roughness: 0.25,
      });

      const borderMat = new THREE.MeshStandardMaterial({
        color: isGreenSafe ? 0x064e3b : 0x7f1d1d,
        roughness: 0.4,
      });

      // Extract straight segments respecting graph edges (connectedTo) or sequential fallback
      const segments: { p1: THREE.Vector3; p2: THREE.Vector3 }[] = [];
      const nodeMap = new Map<string, typeof nodes[0]>();
      nodes.forEach((n) => nodeMap.set(n.id, n));
      const addedKeys = new Set<string>();

      const hasConnections = nodes.some((n) => n.connectedTo && n.connectedTo.length > 0);

      if (hasConnections) {
        nodes.forEach((n, idx) => {
          if (n.connectedTo) {
            n.connectedTo.forEach((targetId) => {
              const target = nodeMap.get(targetId);
              if (target) {
                const targetIdx = nodes.indexOf(target);
                const pairKey = [n.id, targetId].sort().join('__');
                if (!addedKeys.has(pairKey)) {
                  addedKeys.add(pairKey);
                  // Direct forward edge from earlier node to later node (evacuation egress direction)
                  const fromNode = idx <= targetIdx ? n : target;
                  const toNode = idx <= targetIdx ? target : n;
                  segments.push({
                    p1: new THREE.Vector3(...fromNode.position),
                    p2: new THREE.Vector3(...toNode.position),
                  });
                }
              }
            });
          }
        });
      } else {
        for (let i = 0; i < nodes.length - 1; i++) {
          segments.push({
            p1: new THREE.Vector3(...nodes[i].position),
            p2: new THREE.Vector3(...nodes[i + 1].position),
          });
        }
      }

      // Chevron arrow geometry for high-visibility floor navigation guidance
      const arrowGeo = createChevronArrowGeometry(pathWidth * 0.65, pathWidth * 0.72);

      segments.forEach((seg) => {
        const { p1, p2 } = seg;
        const segVector = new THREE.Vector3().subVectors(p2, p1);
        const segLen = Math.hypot(segVector.x, segVector.z);
        const vertDiff = p2.y - p1.y;

        // If this is a vertical or near-vertical descent (e.g. tactical fast-rope or caged ladder)
        if (segLen < 0.35 && Math.abs(vertDiff) > 0.5) {
          const colHeight = Math.abs(vertDiff);
          const colMidY = (p1.y + p2.y) / 2;
          const ropeGuideGeo = new THREE.CylinderGeometry(0.08, 0.08, colHeight, 12);
          const ropeGuide = new THREE.Mesh(ropeGuideGeo, pathMat);
          ropeGuide.position.set((p1.x + p2.x) / 2, colMidY, (p1.z + p2.z) / 2);
          group.add(ropeGuide);

          const ringCount = Math.max(2, Math.floor(colHeight / 0.7));
          for (let r = 1; r < ringCount; r++) {
            const ringY = Math.max(p1.y, p2.y) - (r / ringCount) * colHeight;
            const ringGeo = new THREE.TorusGeometry(pathWidth * 0.45, 0.035, 8, 16);
            const ringMesh = new THREE.Mesh(ringGeo, borderMat);
            ringMesh.rotation.x = Math.PI / 2;
            ringMesh.position.set((p1.x + p2.x) / 2, ringY, (p1.z + p2.z) / 2);
            group.add(ringMesh);
          }
          return;
        }

        if (segLen < 0.05) return;

        // Straight rectangular strip with square edges
        const segGeo = new THREE.BoxGeometry(pathWidth, pathHeight, segLen);
        const segMesh = new THREE.Mesh(segGeo, pathMat);

        // Position at midpoint between p1 and p2 in 3D (supporting stair incline)
        const midX = (p1.x + p2.x) / 2;
        // On stair incline, give a slight extra clearance so the path hugs the stair risers cleanly
        const isStairSlope = Math.abs(vertDiff) > 0.4;
        const midY = (p1.y + p2.y) / 2 + (isStairSlope ? 0.08 : 0.04);
        const midZ = (p1.z + p2.z) / 2;
        segMesh.position.set(midX, midY, midZ);

        // Orient box along the straight segment line in 3D (including stair incline)
        const angle = Math.atan2(segVector.x, segVector.z);
        const pitch = Math.atan2(vertDiff, segLen);
        segMesh.rotation.set(-pitch, angle, 0, 'YXZ');
        group.add(segMesh);

        // Square safety curb borders on sides for sharp square edges
        const curbWidth = 0.04;
        const curbGeo = new THREE.BoxGeometry(curbWidth, pathHeight * 1.3, segLen);
        const leftCurb = new THREE.Mesh(curbGeo, borderMat);
        leftCurb.position.set(-pathWidth / 2 - curbWidth / 2, pathHeight * 0.15, 0);
        segMesh.add(leftCurb);

        const rightCurb = new THREE.Mesh(curbGeo, borderMat);
        rightCurb.position.set(pathWidth / 2 + curbWidth / 2, pathHeight * 0.15, 0);
        segMesh.add(rightCurb);

        // Directional Chevron Arrows along this segment pointing forward (p1 -> p2) towards safety
        const numArrows = Math.max(1, Math.floor(segLen / 1.35));
        for (let a = 1; a <= numArrows; a++) {
          const t = a / (numArrows + 1);
          const zOffset = (t - 0.5) * segLen;

          const arrowMat = new THREE.MeshStandardMaterial({
            color: isGreenSafe ? 0xa7f3d0 : 0xfecaca,
            emissive: isGreenSafe ? 0x10b981 : 0xef4444,
            emissiveIntensity: 1.2,
            roughness: 0.15,
            side: THREE.DoubleSide,
          });

          const chevronMesh = new THREE.Mesh(arrowGeo, arrowMat);
          // Rotate -90 deg on X so 2D tip points forward along local +Z
          chevronMesh.rotation.x = -Math.PI / 2;
          chevronMesh.position.set(0, pathHeight / 2 + 0.007, zOffset);
          segMesh.add(chevronMesh);

          const globalArrowPos = new THREE.Vector3().addVectors(p1, segVector.clone().multiplyScalar(t));
          animatedFloorArrows.push({
            mesh: chevronMesh,
            mat: arrowMat,
            globalPos: globalArrowPos,
            isGreenSafe,
          });
        }
      });

      // Square corner junction pads at every waypoint node
      const padSize = pathWidth + 0.08;
      const padGeo = new THREE.BoxGeometry(padSize, pathHeight * 1.05, padSize);
      for (const node of nodes) {
        const padMesh = new THREE.Mesh(padGeo, pathMat);
        padMesh.position.set(node.position[0], node.position[1] + 0.04, node.position[2]);
        group.add(padMesh);
      }

      return group;
    };

    const safePathMesh = createStraightSquarePath(mapData.safePathNodes, 0x10b981, 0x059669, true);
    if (safePathMesh) scene.add(safePathMesh);

    const dangerPathMesh = createStraightSquarePath(mapData.dangerPathNodes, 0xef4444, 0xb91c1c, false);
    if (dangerPathMesh) scene.add(dangerPathMesh);

    // 11. Dynamic Realistic Hazard Systems (Fire, Gas, Smoke, Electrical)
    const hazardRigs: HazardRig[] = [];

    mapData.hazards.forEach((h) => {
      let rig: HazardRig | null = null;
      if (h.type === 'fire') {
        rig = createFireHazard(h.id, h.position, h.radius);
      } else if (h.type === 'gas' || h.type === 'chemical_leak') {
        rig = createGasHazard(h.id, h.position, h.radius);
      } else if (h.type === 'smoke') {
        rig = createSmokeHazard(h.id, h.position, h.radius);
      } else if (h.type === 'electrical_arc') {
        rig = createElectricalHazard(h.id, h.position, h.radius);
      }

      if (rig) {
        scene.add(rig.group);
        hazardRigs.push(rig);
      }
    });

    // 12. Checkpoints Beacons with 3D Downward Objective Navigation Arrows
    const checkpointObjects: { group: THREE.Group; downArrow: THREE.Group; id: string; index: number }[] = [];
    checkpointsRef.current.forEach((cp, idx) => {
      const cpGroup = new THREE.Group();
      cpGroup.position.set(...cp.position);

      const ringGeo = new THREE.TorusGeometry(cp.radius * 0.8, 0.1, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      cpGroup.add(ringMesh);

      const cylGeo = new THREE.CylinderGeometry(cp.radius * 0.6, cp.radius * 0.6, 2.5, 16, 1, true);
      const cylMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const cylMesh = new THREE.Mesh(cylGeo, cylMat);
      cylMesh.position.y = 1.25;
      cpGroup.add(cylMesh);

      const diamondGeo = new THREE.OctahedronGeometry(0.35);
      const diamondMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
      });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      diamond.position.y = 2.4;
      cpGroup.add(diamond);

      // Floating 3D Navigation Arrow pointing downward into the active beacon ring
      const downArrowGroup = new THREE.Group();
      const downConeGeo = new THREE.ConeGeometry(0.28, 0.62, 16);
      const downConeMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.5,
        roughness: 0.15,
      });
      const downCone = new THREE.Mesh(downConeGeo, downConeMat);
      downCone.rotation.x = Math.PI; // point straight down into ring
      downCone.position.y = -0.22;
      downArrowGroup.add(downCone);

      const downShaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.38, 12);
      const downShaft = new THREE.Mesh(downShaftGeo, downConeMat);
      downShaft.position.y = 0.22;
      downArrowGroup.add(downShaft);

      downArrowGroup.position.y = 3.2;
      cpGroup.add(downArrowGroup);

      scene.add(cpGroup);
      checkpointObjects.push({ group: cpGroup, downArrow: downArrowGroup, id: cp.id, index: idx });
    });

    // 13. Player Character Rig (Solo cadet simulation)
    const playerRig = createCharacterRig(customizationRef.current);
    playerRig.root.position.copy(playerState.current.pos);
    scene.add(playerRig.root);
    playerRigRef.current = playerRig;

    // 14. Real-Time Dynamic Cadet Navigation Guide Arrow (Holographic 3D Guidance Arrow)
    const cadetGuideArrow = new THREE.Group();

    // Floor holographic pulsing guidance circle
    const guideFloorRingGeo = new THREE.RingGeometry(0.3, 0.42, 32);
    const guideFloorRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const guideFloorRing = new THREE.Mesh(guideFloorRingGeo, guideFloorRingMat);
    guideFloorRing.rotation.x = -Math.PI / 2;
    guideFloorRing.position.y = 0.03;
    cadetGuideArrow.add(guideFloorRing);

    // Glowing Arrowhead Cone
    const guideConeGeo = new THREE.ConeGeometry(0.18, 0.44, 16);
    const guideConeMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x059669,
      emissiveIntensity: 1.4,
      roughness: 0.15,
    });
    const guideCone = new THREE.Mesh(guideConeGeo, guideConeMat);
    guideCone.rotation.x = Math.PI / 2; // points forward along local +Z
    guideCone.position.set(0, 0.14, 0.24);
    cadetGuideArrow.add(guideCone);

    // Arrow Shaft Body
    const guideShaftGeo = new THREE.BoxGeometry(0.12, 0.08, 0.34);
    const guideShaftMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x047857,
      emissiveIntensity: 1.1,
      roughness: 0.2,
    });
    const guideShaft = new THREE.Mesh(guideShaftGeo, guideShaftMat);
    guideShaft.position.set(0, 0.14, -0.06);
    cadetGuideArrow.add(guideShaft);

    // Side Stabilizer / Directional Wings
    const wingGeo = new THREE.BoxGeometry(0.38, 0.03, 0.14);
    const wingMesh = new THREE.Mesh(wingGeo, guideConeMat);
    wingMesh.position.set(0, 0.12, 0.02);
    cadetGuideArrow.add(wingMesh);

    scene.add(cadetGuideArrow);

    // Animation Clock
    const clock = new THREE.Clock();
    let animationFrameId: number;

    // Main Game Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = (Date.now() - playerState.current.startTime) / 1000;

      // Update Health Care Center lights & telemetry
      healthCareCenterRig.update(delta);

      // Emergency strobe pulse
      emergencyStrobe.intensity = 2.2 + Math.sin(Date.now() * 0.008) * 1.8;

      // 2. Animated wave flow along 3D floor chevron navigation arrows pointing to safety
      const pulsePhase = elapsed * 4.2;
      animatedFloorArrows.forEach((fa) => {
        if (fa.isGreenSafe) {
          const wave = (Math.sin(pulsePhase - (fa.globalPos.x + fa.globalPos.z) * 0.45) + 1) * 0.5;
          fa.mat.emissiveIntensity = 0.6 + wave * 1.8;
        }
      });

      // 3. Checkpoint animations & objective downward navigation arrow
      const activeCheckpointIndex = checkpointsRef.current.findIndex((c) => !c.reached);
      checkpointObjects.forEach((cpObj) => {
        const isReached = checkpointsRef.current[cpObj.index]?.reached;
        cpObj.group.visible = !isReached;
        if (!isReached) {
          cpObj.group.rotation.y += delta * 1.5;
          const isCurrentTarget = cpObj.index === activeCheckpointIndex;
          cpObj.downArrow.visible = isCurrentTarget;
          if (isCurrentTarget) {
            cpObj.downArrow.position.y = 3.2 + Math.sin(elapsed * 4.5) * 0.25;
            cpObj.downArrow.rotation.y += delta * 2.2;
          }
        }
      });

      // Smooth camera orbit angles with shortest-path angular interpolation
      cameraOrbit.current.yaw = lerpAngle(
        cameraOrbit.current.yaw,
        cameraOrbit.current.targetYaw,
        0.18
      );
      cameraOrbit.current.pitch = THREE.MathUtils.lerp(
        cameraOrbit.current.pitch,
        cameraOrbit.current.targetPitch,
        0.18
      );

      // --- PLAYER PHYSICS & CAMERA-RELATIVE MOVEMENT ---
      const p = playerState.current;

      // 1. Update all dynamic 3D hazard visual systems (billboard rotation, particle flow, light flickering)
      hazardRigs.forEach((hr) => {
        hr.update(delta, p.pos, camera.position);
      });

      // Update architectural building ceiling lighting & indicator pulses
      if (ceilingRigRef.current) {
        ceilingRigRef.current.update(delta);
      }

      // Update compound and road dynamic visuals (e.g. flashing emergency vehicle lightbars)
      if (compoundRigRef.current) {
        compoundRigRef.current.update(delta, elapsed);
      }

      // Update unique emergency ladder and tactical rope exit station
      if (ladderRopeRigRef.current) {
        ladderRopeRigRef.current.update(delta, elapsed);
      }

      // 2. Realistic Hazard interactions & proximity tracking
      interface HazardAlertItem {
        id: string;
        type: 'fire' | 'gas' | 'smoke' | 'debris' | 'chemical_leak' | 'electrical_arc';
        dist: number;
        radius: number;
        description: string;
        isInside: boolean;
        urgency: 'caution' | 'danger' | 'critical';
      }
      let nearestHazardObj: HazardAlertItem | null = null;
      let minHazardDist = 999;

      for (const hz of mapData.hazards) {
        if (!hz.active) continue;
        const distToHazard = new THREE.Vector2(p.pos.x, p.pos.z).distanceTo(
          new THREE.Vector2(hz.position[0], hz.position[2])
        );

        if (distToHazard < minHazardDist) {
          minHazardDist = distToHazard;
          const isInside = distToHazard <= hz.radius;
          const urgency = isInside
            ? 'critical'
            : distToHazard <= hz.radius + 1.8
            ? 'danger'
            : 'caution';

          nearestHazardObj = {
            id: hz.id,
            type: hz.type,
            dist: Math.round(distToHazard * 10) / 10,
            radius: hz.radius,
            description: hz.description,
            isInside,
            urgency,
          };
        }
      }

      // Proximity danger sensing level (0.0 safe to 1.0 imminent threat)
      const currentDangerLevel = minHazardDist < 8.5
        ? Math.max(0, Math.min(1, (8.5 - minHazardDist) / 5.5))
        : 0;
      p.dangerSensedLevel = currentDangerLevel;

      // Spatial hazard proximity audio update
      if (nearestHazardObj && minHazardDist < 9.0 && !p.isDead) {
        soundFX.updateHazardProximityAudio({
          type: nearestHazardObj.type,
          dist: minHazardDist,
          radius: nearestHazardObj.radius,
        });
      } else {
        soundFX.updateHazardProximityAudio(null);
      }

      // Update UI danger alert & sensory states (throttled)
      const nowMs = performance.now();
      if (nowMs - lastHazardAlertUpdate.current > 80) {
        lastHazardAlertUpdate.current = nowMs;
        if (nearestHazardObj && minHazardDist < 8.5 && !p.isDead) {
          setHazardAlert(nearestHazardObj);
          setDangerSenseLevel(currentDangerLevel);
        } else {
          setHazardAlert(null);
          setDangerSenseLevel(0);
        }
      }

      // --- CASUALTY STATE HANDLING (DEATH OVERRIDE) ---
      if (p.isDead) {
        p.velocity.set(0, 0, 0);

        // Update player model animation in death collapse pose
        playerRig.root.position.copy(p.pos);
        playerRig.root.rotation.y = p.rotationY;
        playerRig.updateAnimation(elapsed, 0, false, 1.0, 0, true);

        // Third-person camera maintains a dramatic low orbit looking down on fallen cadet
        const orbit = cameraOrbit.current;
        const targetY = p.pos.y + 0.35;
        const camDist = Math.max(2.4, Math.min(3.6, orbit.dist));
        const ceilingH = mapData.ceilingHeight || 4.2;
        const camX = p.pos.x - Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * camDist;
        const camY = Math.min(ceilingH - 0.35, targetY + Math.sin(Math.max(0.22, orbit.pitch)) * camDist);
        const camZ = p.pos.z - Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * camDist;

        camera.position.set(camX, camY, camZ);
        camera.lookAt(p.pos.x, targetY, p.pos.z);

        onStatsUpdateRef.current({
          elapsedTime: Math.floor(elapsed),
          health: 0,
          smokeInhalation: Math.floor(p.smokeInhalation),
          stamina: 0,
          currentScore: p.score,
          nearestCheckpointDist: 0,
          compassHeading: Math.round(((orbit.yaw * 180) / Math.PI + 360) % 360),
          currentFloor: p.pos.y > 1.8 ? 1 : 0,
          targetAngle: 0,
          playerPosition: [p.pos.x, p.pos.y, p.pos.z],
          playerRotation: p.rotationY,
        });

        renderer.render(scene, camera);
        return;
      }

      if (!p.completed) {
        // Read active real-time input from ref + direct keyboard listeners
        const input = movementInputRef.current;
        const kd = keysDown.current;

        let inX = input.x;
        let inY = input.y;

        // Merge keyboard controls: W (front), S (back), A (left), D (right)
        if (kd['w'] || kd['arrowup']) inY += 1;
        if (kd['s'] || kd['arrowdown']) inY -= 1;
        if (kd['d'] || kd['arrowright']) inX += 1;
        if (kd['a'] || kd['arrowleft']) inX -= 1;

        // Clamp combined vector magnitude
        const rawMag = Math.hypot(inX, inY);
        if (rawMag > 1) {
          inX /= rawMag;
          inY /= rawMag;
        }

        const isMoving = rawMag > 0.04;
        const isExhausted = p.stamina <= 3;
        // Sprinting disabled when stamina is exhausted
        const isSprinting = !isExhausted && (input.isSprinting || !!kd['shift']);
        const isCrouching = input.isCrouching || !!kd['c'];
        const isInteracting = input.interact || !!kd['e'];

        // --- CHARACTER DANGER SENSING & STAMINA CONSUMPTION ---
        const isInDangerZone = currentDangerLevel > 0 || (nearestHazardObj && nearestHazardObj.isInside);

        if (isInDangerZone) {
          // Character senses danger: elevated pulse / racing heart
          soundFX.playHeartbeat(Math.max(currentDangerLevel, (100 - p.stamina) / 100));

          // Danger zone: stamina decreases SLOWLY and steadily
          // Gradual depletion rate: ~2.2% to 5.4% per second based on stress level
          const slowDangerDrain = delta * (2.2 + currentDangerLevel * 3.2);
          p.stamina = Math.max(0, p.stamina - slowDangerDrain);

          // Sprinting while in danger zone adds a controlled extra drain
          if (isSprinting && isMoving) {
            p.stamina = Math.max(0, p.stamina - delta * 5.0);
          }
        } else {
          // Safe zone: stamina recovers if not sprinting
          if (isSprinting && isMoving) {
            p.stamina = Math.max(0, p.stamina - delta * 6.0);
          } else {
            p.stamina = Math.min(100, p.stamina + delta * 9.0);
          }
        }

        // Auditory cue when exhausted: labored panting / gasping for air
        if (isExhausted) {
          soundFX.playHeavyBreathing(0.85);
        }

        // Controlled, natural walking speed for realistic evacuation
        let baseSpeed = 2.6; // Steady walking pace
        if (isExhausted) {
          baseSpeed = 1.05; // Staggering, struggling for air, slowed down from lack of stamina
        } else if (isCrouching) {
          baseSpeed = 1.3; // Low crawl under smoke
        } else if (isSprinting && p.stamina > 8) {
          baseSpeed = 4.2; // Controlled sprint
        }

        // Movement strictly aligned to Camera Visual Direction
        const currentYaw = cameraOrbit.current.yaw;
        const forwardX = Math.sin(currentYaw);
        const forwardZ = Math.cos(currentYaw);
        // In this coordinate system, the rightward vector perpendicular to (sin yaw, cos yaw) is:
        const rightX = -Math.cos(currentYaw);
        const rightZ = Math.sin(currentYaw);

        const moveX = forwardX * inY + rightX * inX;
        const moveZ = forwardZ * inY + rightZ * inX;
        const moveMag = Math.hypot(moveX, moveZ);

        if (moveMag > 0.04) {
          const normX = moveX / moveMag;
          const normZ = moveZ / moveMag;

          p.velocity.x = normX * baseSpeed * Math.min(1, moveMag);
          p.velocity.z = normZ * baseSpeed * Math.min(1, moveMag);

          // Face movement direction smoothly
          const targetRotation = Math.atan2(normX, normZ);
          p.rotationY = lerpAngle(p.rotationY, targetRotation, 0.25);

          // Camera angle actively corresponds to character movements (camera moves in direction of character)
          if (!dragRef.current.isDragging) {
            // A (left) and D (right) keys actively steer the camera angle
            if (inX !== 0) {
              cameraOrbit.current.targetYaw += inX * delta * 2.2;
            }
            // Smoothly align camera orbit target behind the character's movement direction
            cameraOrbit.current.targetYaw = lerpAngle(
              cameraOrbit.current.targetYaw,
              p.rotationY,
              delta * 3.6
            );
          }

          // Footstep audio
          if (Math.random() < 0.04) {
            soundFX.playFootstep(isCrouching);
          }
        } else {
          p.velocity.x *= 0.55;
          p.velocity.z *= 0.55;
        }

        // Candidate next position
        const nextX = p.pos.x + p.velocity.x * delta;
        const nextZ = p.pos.z + p.velocity.z * delta;

        // Collision detection against 3D architectural walls (with wall-sliding)
        let canMoveX = true;
        let canMoveZ = true;
        const playerRadius = 0.32;

        for (const col of wallColliders) {
          const colMinY = col.minY !== undefined ? col.minY : 0;
          const colMaxY = col.maxY !== undefined ? col.maxY : 3.6;

          // Only collide if player's vertical extent overlaps collider vertical extent
          if (p.pos.y + 1.6 < colMinY || p.pos.y + 0.1 > colMaxY) {
            continue;
          }

          const colMidX = (col.minX + col.maxX) / 2;
          const colMidZ = (col.minZ + col.maxZ) / 2;

          // Check X movement
          if (
            nextX + playerRadius > col.minX &&
            nextX - playerRadius < col.maxX &&
            p.pos.z + playerRadius > col.minZ &&
            p.pos.z - playerRadius < col.maxZ
          ) {
            // Block only if moving closer to collider center
            if (Math.abs(nextX - colMidX) <= Math.abs(p.pos.x - colMidX)) {
              canMoveX = false;
            }
          }

          // Check Z movement
          if (
            p.pos.x + playerRadius > col.minX &&
            p.pos.x - playerRadius < col.maxX &&
            nextZ + playerRadius > col.minZ &&
            nextZ - playerRadius < col.maxZ
          ) {
            // Block only if moving closer to collider center
            if (Math.abs(nextZ - colMidZ) <= Math.abs(p.pos.z - colMidZ)) {
              canMoveZ = false;
            }
          }
        }

        // --- UNIQUE EMERGENCY LADDER & ROPE DESCENT INTERACTION & ANIMATION ---
        const elr = mapData.emergencyLadderRope;
        let nearRope = false;
        if (elr && p.pos.y > 1.8 && !ropeSlideState.current.isDescending) {
          const distToPlat = Math.hypot(
            p.pos.x - elr.platformPosition[0],
            p.pos.z - elr.platformPosition[2]
          );
          if (distToPlat < 2.5) {
            nearRope = true;
          }
        }

        if (nearRope !== isNearRopeExit) {
          setIsNearRopeExit(nearRope);
        }

        // Trigger Fast-Rope Slide on [E] key or Interact button
        if (nearRope && isInteracting && !prevInteractRef.current && !ropeSlideState.current.isDescending) {
          ropeSlideState.current = {
            isDescending: true,
            progress: 0,
            startY: p.pos.y,
            targetY: elr!.groundPosition[1],
            startX: p.pos.x,
            targetX: elr!.groundPosition[0],
            startZ: p.pos.z,
            targetZ: elr!.groundPosition[2],
          };
          soundFX.playRopeSlide();
          p.score += 350;
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.65 },
            colors: ['#22c55e', '#38bdf8', '#facc15', '#f97316'],
          });
        }

        // Handle Active Fast-Rope Smooth Descent Kinematics
        if (ropeSlideState.current.isDescending) {
          ropeSlideState.current.progress += delta / 1.35;
          const prog = Math.min(1, ropeSlideState.current.progress);
          const ease = (1 - Math.cos(prog * Math.PI)) / 2;
          p.pos.y = ropeSlideState.current.startY + (ropeSlideState.current.targetY - ropeSlideState.current.startY) * ease;
          p.pos.x = ropeSlideState.current.startX + (ropeSlideState.current.targetX - ropeSlideState.current.startX) * ease;
          p.pos.z = ropeSlideState.current.startZ + (ropeSlideState.current.targetZ - ropeSlideState.current.startZ) * ease;
          p.velocity.set(0, 0, 0);

          if (prog >= 1) {
            p.pos.y = ropeSlideState.current.targetY;
            p.pos.x = ropeSlideState.current.targetX;
            p.pos.z = ropeSlideState.current.targetZ;
            ropeSlideState.current.isDescending = false;
            soundFX.playCheckpoint();

            // Auto-advance intermediate interior stair checkpoints since cadet safely escaped to ground!
            checkpointsRef.current.forEach((cp, idx) => {
              if (!cp.reached && idx < checkpointsRef.current.length - 1) {
                cp.reached = true;
                onCheckpointReachedRef.current?.(idx, cp.points);
              }
            });
          }
        }

        // --- INTERACTIVE DOORS LOGIC & UPDATES ---
        doorsRef.current.forEach((door) => {
          door.update(delta);
        });

        let closestDoor: DoorRig | null = null;
        let minDoorDist = 999;
        doorsRef.current.forEach((door) => {
          // Check if door is on current floor level
          if (Math.abs(p.pos.y - door.position[1]) > 1.8) return;

          const dist = new THREE.Vector2(p.pos.x, p.pos.z).distanceTo(
            new THREE.Vector2(door.position[0], door.position[2])
          );
          if (dist < 3.4 && dist < minDoorDist) {
            closestDoor = door;
            minDoorDist = dist;
          }
        });
        activeDoorRef.current = closestDoor;

        // Toggle door on [E] key or Interact button press
        const justInteracted = isInteracting && !prevInteractRef.current;
        prevInteractRef.current = isInteracting;

        if (closestDoor && justInteracted) {
          const cd = closestDoor as DoorRig;
          const newOpen = cd.toggle();
          soundFX.playDoor(newOpen);
          nearbyDoorState.current = { id: cd.id, isOpen: newOpen, isEmergency: cd.isEmergency };
          setNearbyDoor({ ...nearbyDoorState.current });
        }

        // Auto push-to-open: walking directly into any closed door swings it open so cadet can go
        if (closestDoor && !(closestDoor as DoorRig).isOpen) {
          if (minDoorDist < 1.45) {
            (closestDoor as DoorRig).open();
            soundFX.playDoor(true);
            nearbyDoorState.current = { id: (closestDoor as DoorRig).id, isOpen: true, isEmergency: (closestDoor as DoorRig).isEmergency };
            setNearbyDoor({ ...nearbyDoorState.current });
          }
        }

        // Synchronize interactive UI prompt
        if (closestDoor) {
          const cd = closestDoor as DoorRig;
          if (
            !nearbyDoorState.current ||
            nearbyDoorState.current.id !== cd.id ||
            nearbyDoorState.current.isOpen !== cd.isOpen
          ) {
            nearbyDoorState.current = { id: cd.id, isOpen: cd.isOpen, isEmergency: cd.isEmergency };
            setNearbyDoor({ ...nearbyDoorState.current });
          }
        } else {
          if (nearbyDoorState.current !== null) {
            nearbyDoorState.current = null;
            setNearbyDoor(null);
          }
        }

        // Collision detection against closed doors (blocks passage only when shut and on same floor)
        for (const door of doorsRef.current) {
          if (!door.isOpen) {
            const col = door.collider;
            if (p.pos.y + 1.6 < col.minY || p.pos.y + 0.1 > col.maxY) {
              continue;
            }

            const colMidX = (col.minX + col.maxX) / 2;
            const colMidZ = (col.minZ + col.maxZ) / 2;

            if (
              nextX + playerRadius > col.minX &&
              nextX - playerRadius < col.maxX &&
              p.pos.z + playerRadius > col.minZ &&
              p.pos.z - playerRadius < col.maxZ
            ) {
              if (Math.abs(nextX - colMidX) <= Math.abs(p.pos.x - colMidX)) {
                canMoveX = false;
              }
            }

            if (
              p.pos.x + playerRadius > col.minX &&
              p.pos.x - playerRadius < col.maxX &&
              nextZ + playerRadius > col.minZ &&
              nextZ - playerRadius < col.maxZ
            ) {
              if (Math.abs(nextZ - colMidZ) <= Math.abs(p.pos.z - colMidZ)) {
                canMoveZ = false;
              }
            }
          }
        }

        if (canMoveX) p.pos.x = nextX;
        if (canMoveZ) p.pos.z = nextZ;

        // Calculate vertical surface elevation for smooth staircase traversal and multi-floor support
        let targetFloorY = 0;
        let isCadetOnStairs = false;

        // 1. Check staircases (Inside Stair & Outside Stair)
        if (mapData.staircases) {
          for (const stair of mapData.staircases) {
            const b = stair.bounds;
            if (
              p.pos.x >= b.minX - 0.4 &&
              p.pos.x <= b.maxX + 0.4 &&
              p.pos.z >= b.minZ - 0.3 &&
              p.pos.z <= b.maxZ + 0.3
            ) {
              const progress = Math.max(0, Math.min(1, (b.maxZ - p.pos.z) / (b.maxZ - b.minZ)));
              const stairH = (stair.topY || 3.6) - (stair.bottomY || 0);
              targetFloorY = (stair.bottomY || 0) + (stair.ascendDirection === '-z' ? progress * stairH : (1 - progress) * stairH);
              isCadetOnStairs = true;
              break;
            }
          }
        }

        // 2. Check exterior fire escape stairs
        if (!isCadetOnStairs && mapData.exteriorFireEscape) {
          const fe = mapData.exteriorFireEscape;
          const exitZ = fe.exitPosition[2];
          const landZ = fe.landingPosition[2];
          const minZ = Math.min(exitZ, landZ);
          const maxZ = Math.max(exitZ, landZ);
          const halfW = (fe.width || 3.2) / 2;
          if (
            Math.abs(p.pos.x - fe.exitPosition[0]) <= halfW + 0.3 &&
            p.pos.z >= minZ &&
            p.pos.z <= maxZ
          ) {
            const progress = Math.max(0, Math.min(1, (p.pos.z - minZ) / (maxZ - minZ)));
            targetFloorY = (1 - progress) * 3.6;
            isCadetOnStairs = true;
          }
        }

        // 2b. Check Unique Emergency Vertical Ladder
        if (!isCadetOnStairs && !ropeSlideState.current.isDescending && mapData.emergencyLadderRope) {
          const elrData = mapData.emergencyLadderRope;
          const distToLadder = Math.hypot(
            p.pos.x - elrData.ladderPosition[0],
            p.pos.z - elrData.ladderPosition[2]
          );
          if (distToLadder < 1.15) {
            const ladderFloorH = elrData.platformPosition[1];
            const span = Math.abs(elrData.platformPosition[0] - elrData.groundPosition[0]) || 1.0;
            const progress = Math.max(0, Math.min(1, (p.pos.x - (elrData.groundPosition[0] - 0.3)) / span));
            targetFloorY = progress * ladderFloorH;
            isCadetOnStairs = true;
            if (Math.random() < 0.04) {
              soundFX.playLadderClimb();
            }
          }
        }

        // 3. Determine if cadet is walking on 1st Floor or Ground Floor
        if (!isCadetOnStairs && !ropeSlideState.current.isDescending) {
          const inIndoorBounds =
            mapData.indoorBounds &&
            p.pos.x >= mapData.indoorBounds.minX &&
            p.pos.x <= mapData.indoorBounds.maxX &&
            p.pos.z >= mapData.indoorBounds.minZ &&
            p.pos.z <= mapData.indoorBounds.maxZ;

          const isOnLadderPlatform =
            mapData.emergencyLadderRope &&
            p.pos.y > 1.8 &&
            Math.abs(p.pos.x - mapData.emergencyLadderRope.platformPosition[0]) < 1.8 &&
            Math.abs(p.pos.z - mapData.emergencyLadderRope.platformPosition[2]) < 2.0;

          if (isOnLadderPlatform || (p.pos.y > 1.8 && inIndoorBounds)) {
            targetFloorY = 3.6; // 1st floor elevation
          } else {
            targetFloorY = 0;   // Ground floor elevation
          }
        }

        if (!ropeSlideState.current.isDescending) {
          // Smooth vertical climbing/descending transition
          p.pos.y = THREE.MathUtils.lerp(p.pos.y, targetFloorY, Math.min(1, delta * 18));
        }

        // Realistic Hazard interactions & damage with Stamina Exhaustion multiplier
        const staminaDamageMultiplier = isExhausted ? 2.2 : 1.0;

        for (const hz of mapData.hazards) {
          if (!hz.active) continue;
          const distToHazard = new THREE.Vector2(p.pos.x, p.pos.z).distanceTo(
            new THREE.Vector2(hz.position[0], hz.position[2])
          );

          if (distToHazard < hz.radius) {
            if (hz.type === 'fire' || hz.type === 'electrical_arc') {
              p.stamina = Math.max(0, p.stamina - delta * 4.5);
              p.health = Math.max(0, p.health - delta * 15 * staminaDamageMultiplier);
              p.hazardsHitCount++;
              soundFX.playHazardWarning();
            } else if (hz.type === 'gas' || hz.type === 'chemical_leak') {
              const currentGear = customizationRef.current.equipment;
              const hasMask = currentGear.headgear === 'gas_mask';
              p.stamina = Math.max(0, p.stamina - (hasMask ? delta * 1.5 : delta * 4.0));
              if (!hasMask) {
                p.smokeInhalation = Math.min(100, p.smokeInhalation + delta * 16);
                p.health = Math.max(0, p.health - delta * 8 * staminaDamageMultiplier);
                soundFX.playCoughWarning();
              }
            } else if (hz.type === 'smoke') {
              const currentGear = customizationRef.current.equipment;
              const hasSmokeProtection =
                currentGear.headgear === 'smoke_hood' ||
                currentGear.headgear === 'gas_mask' ||
                isCrouching;

              if (!hasSmokeProtection) {
                p.stamina = Math.max(0, p.stamina - delta * 3.5);
                p.smokeInhalation = Math.min(100, p.smokeInhalation + delta * 12);
                p.health = Math.max(0, p.health - delta * 4 * staminaDamageMultiplier);
                soundFX.playCoughWarning();
              } else {
                p.smokeInhalation = Math.max(0, p.smokeInhalation - delta * 2);
                p.stamina = Math.max(0, p.stamina - delta * 1.0);
              }
            }
          } else if (distToHazard < hz.radius + 1.8 && isExhausted) {
            // Exhaustion vulnerability: ambient smoke/heat in proximity deals continuous damage
            p.health = Math.max(0, p.health - delta * 4);
          }
        }

        // --- FATAL INCIDENT & CASUALTY COLLAPSE TRIGGER ---
        if (p.health <= 0 && !p.deathHandled) {
          p.health = 0;
          p.stamina = 0;
          p.isDead = true;
          p.completed = true;
          p.deathHandled = true;
          p.velocity.set(0, 0, 0);

          let cause = 'Hazard Overexposure & Critical Vital Signs Failure';
          if (nearestHazardObj?.type === 'fire') {
            cause = 'Fatal Thermal Burns & Conflagration Heat Stroke';
          } else if (nearestHazardObj?.type === 'gas' || nearestHazardObj?.type === 'chemical_leak') {
            cause = 'Acute Toxic Chemical Gas Asphyxiation & Poisoning';
          } else if (nearestHazardObj?.type === 'smoke') {
            cause = 'Lethal Smoke Suffocation & Critical Stamina Exhaustion';
          } else if (nearestHazardObj?.type === 'electrical_arc') {
            cause = 'Fatal High-Voltage Arc Flashover & Electrocution';
          }
          p.fatalCause = cause;

          soundFX.stopEmergencySiren();
          soundFX.stopHazardAudio();
          soundFX.playDeathCollapse();
          soundFX.playFlatline();

          setIsDead(true);
          setFatalCause(cause);

          deathTimeoutRef.current = setTimeout(() => {
            const report: DrillScoreReport = {
              drillId: 'drill_casualty_' + Date.now(),
              campusName: mapData.name,
              disasterType,
              playerName: customizationRef.current.name || 'Cadet',
              characterRole: customizationRef.current.role,
              completionTimeSeconds: Math.floor(elapsed),
              checkpointsReached: checkpointsRef.current.filter((c) => c.reached).length,
              totalCheckpoints: checkpointsRef.current.length,
              basePoints: Math.max(0, p.score - 400),
              timeBonus: 0,
              safetyScore: 0,
              totalScore: Math.max(0, p.score - 400),
              grade: 'F',
              hazardsEncountered: p.hazardsHitCount,
              smokeExposurePercent: Math.floor(p.smokeInhalation),
              peerAssisted: p.peerAssisted,
              evacuationEfficiency: 0,
              timestamp: new Date().toLocaleTimeString(),
              isCasualty: true,
              casualtyReason: cause,
            };

            onDrillCompleteRef.current(report);
          }, 2200);
        }


        // Checkpoint proximity checks along designated safety corridors
        let nearestDist = 999;
        checkpointsRef.current.forEach((cp, idx) => {
          if (!cp.reached) {
            const dist = new THREE.Vector2(p.pos.x, p.pos.z).distanceTo(
              new THREE.Vector2(cp.position[0], cp.position[2])
            );
            if (dist < nearestDist) nearestDist = dist;

            // Vertical floor level check so ground & 1st floor checkpoints don't cross-trigger
            const vertDist = Math.abs(p.pos.y - cp.position[1]);
            const isFloorMatched = vertDist < 2.4;

            // Alternative route fallback: If cadet is already outside on ground, auto-clear interior checkpoints
            const isOutsideGround = p.pos.y < 0.6 && (
              Math.abs(p.pos.x) > 18 || p.pos.z > 14 || p.pos.z < -16
            );
            const isInteriorBypass = isOutsideGround && idx < checkpointsRef.current.length - 1;

            if ((dist <= cp.radius && isFloorMatched) || isInteriorBypass) {
              const actionSatisfied =
                isInteriorBypass ||
                !cp.requiredAction ||
                (cp.requiredAction === 'low_crawl' && isCrouching) ||
                (cp.requiredAction === 'help_peer' && (isInteracting || p.peerAssisted)) ||
                (cp.requiredAction === 'clear_door' && (isInteracting || dist < 2.4)) ||
                cp.requiredAction === 'muster';

              if (actionSatisfied) {
                cp.reached = true;
                p.score += cp.points;
                p.currentCheckpointIndex = idx + 1;
                soundFX.playCheckpoint();
                onCheckpointReachedRef.current(idx, cp.points);
                confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
              }
            }
          }
        });

        // Safe Assembly Goal Reached
        const distToAssembly = new THREE.Vector2(p.pos.x, p.pos.z).distanceTo(
          new THREE.Vector2(mapData.safeAssemblyPosition[0], mapData.safeAssemblyPosition[2])
        );

        if (distToAssembly < 3.8 && !p.completed) {
          p.completed = true;
          soundFX.stopEmergencySiren();
          soundFX.playSuccessFanfare();
          confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });

          const timeBonus = Math.max(0, Math.floor((mapData.recommendedTimeSeconds - elapsed) * 10));
          const safetyPenalty = Math.floor(p.smokeInhalation * 4 + p.hazardsHitCount * 50);
          const finalScore = Math.max(200, p.score + timeBonus - safetyPenalty + (p.peerAssisted ? 500 : 0));
          const efficiencyPercent = Math.min(
            100,
            Math.max(20, Math.floor(((mapData.recommendedTimeSeconds / Math.max(elapsed, 20)) * 60) + (p.health * 0.4)))
          );

          let grade: 'S' | 'A' | 'B' | 'C' | 'D' = 'C';
          if (efficiencyPercent >= 90 && p.health > 85) grade = 'S';
          else if (efficiencyPercent >= 75) grade = 'A';
          else if (efficiencyPercent >= 60) grade = 'B';
          else if (efficiencyPercent >= 40) grade = 'C';
          else grade = 'D';

          const report: DrillScoreReport = {
            drillId: 'drill_' + Date.now(),
            campusName: mapData.name,
            disasterType,
            playerName: customizationRef.current.name || 'Cadet',
            characterRole: customizationRef.current.role,
            completionTimeSeconds: Math.floor(elapsed),
            checkpointsReached: checkpointsRef.current.filter(c => c.reached).length,
            totalCheckpoints: checkpointsRef.current.length,
            basePoints: p.score,
            timeBonus,
            safetyScore: Math.floor(p.health),
            totalScore: finalScore,
            grade,
            hazardsEncountered: p.hazardsHitCount,
            smokeExposurePercent: Math.floor(p.smokeInhalation),
            peerAssisted: p.peerAssisted,
            evacuationEfficiency: efficiencyPercent,
            timestamp: new Date().toLocaleTimeString(),
          };

          onDrillCompleteRef.current(report);
        }

        // Update player model animation with danger sensing, stamina exhaustion, and death collapse
        playerRig.root.position.copy(p.pos);
        playerRig.root.rotation.y = p.rotationY;
        playerRig.updateAnimation(
          elapsed,
          p.isDead ? 0 : p.velocity.length(),
          isCrouching,
          p.isDead ? 1.0 : currentDangerLevel,
          p.isDead ? 0 : p.stamina,
          p.isDead
        );

        if (playerRig.flashlight) {
          playerRig.flashlight.visible = flashlightEnabledRef.current;
        }


        // Update Camera Position according to Orbit Yaw, Pitch, Distance, and Ceiling/Wall Collision
        const orbit = cameraOrbit.current;
        const currentView = viewModeRef.current;

        // Sync ceiling structure visibility for tactical drone mode
        if (ceilingRigRef.current) {
          ceilingRigRef.current.setTacticalMode(currentView === 'tactical');
        }

        if (currentView === 'first') {
          const eyeHeight = isCrouching ? 0.65 : 1.35;
          camera.position.set(p.pos.x, eyeHeight, p.pos.z);
          camera.lookAt(
            p.pos.x + Math.sin(orbit.yaw) * 10,
            eyeHeight + Math.sin(orbit.pitch - 0.2) * 5,
            p.pos.z + Math.cos(orbit.yaw) * 10
          );
        } else if (currentView === 'tactical') {
          // Drone top-down tactical view (ceiling automatically hidden)
          camera.position.set(p.pos.x, 26, p.pos.z + 12);
          camera.lookAt(p.pos.x, 0, p.pos.z);
        } else {
          // Perfect Indoor Third-Person Follow Camera with Ceiling & Wall Collision
          const isGroundFloor = p.pos.y < 1.8;
          // Effective ceiling above character: mezzanine underside at 3.38m on ground, roof at 7.0m on 1st floor
          const ceilingH = isGroundFloor ? 3.38 : (mapData.ceilingHeight || 7.0);
          const bounds = mapData.indoorBounds || { minX: -20, maxX: 20, minZ: -16, maxZ: 14 };
          const isIndoors =
            p.pos.x >= bounds.minX - 0.5 &&
            p.pos.x <= bounds.maxX + 0.5 &&
            p.pos.z >= bounds.minZ - 0.5 &&
            p.pos.z <= bounds.maxZ + 0.5;

          const targetY = isCrouching ? p.pos.y + 0.75 : p.pos.y + 1.15;
          let camPitch = Math.max(0.08, orbit.pitch);
          let camDist = isIndoors ? Math.min(3.8, orbit.dist) : orbit.dist;

          // Ceiling clearance: prevent camera eye from penetrating or clipping the ceiling
          if (isIndoors) {
            const maxAllowedCamY = ceilingH - 0.35;
            const proposedCamY = targetY + Math.sin(camPitch) * camDist;
            if (proposedCamY > maxAllowedCamY) {
              const maxSin = (maxAllowedCamY - targetY) / camDist;
              if (maxSin > 0 && maxSin < 1) {
                camPitch = Math.asin(maxSin);
              } else {
                camDist = Math.max(1.6, (maxAllowedCamY - targetY) / Math.max(0.12, Math.sin(camPitch)));
              }
            }
          }

          // Camera vector from cadet target
          const camDirX = -Math.sin(orbit.yaw) * Math.cos(camPitch);
          const camDirY = Math.sin(camPitch);
          const camDirZ = -Math.cos(orbit.yaw) * Math.cos(camPitch);

          // Spring-arm collision: clamp distance against walls so camera is never occluded
          let safeDist = camDist;
          for (const wc of wallColliders) {
            const colMinY = wc.minY !== undefined ? wc.minY : 0;
            const colMaxY = wc.maxY !== undefined ? wc.maxY : 3.6;
            // Only test colliders near camera's vertical field
            if (targetY + 0.5 < colMinY || targetY - 0.5 > colMaxY) {
              continue;
            }

            const t = testRayBoxCollision(
              p.pos.x, targetY, p.pos.z,
              camDirX, camDirY, camDirZ,
              wc,
              safeDist
            );
            if (t !== null && t > 0.4 && t < safeDist) {
              safeDist = Math.max(1.4, t - 0.25);
            }
          }

          // If cadet is indoors, ensure camera eye stays strictly inside building bounds
          if (isIndoors) {
            const pad = 0.4;
            const innerBox = {
              minX: bounds.minX + pad,
              maxX: bounds.maxX - pad,
              minZ: bounds.minZ + pad,
              maxZ: bounds.maxZ - pad,
            };
            const testX = p.pos.x + camDirX * safeDist;
            const testZ = p.pos.z + camDirZ * safeDist;
            if (testX < innerBox.minX || testX > innerBox.maxX || testZ < innerBox.minZ || testZ > innerBox.maxZ) {
              const tClip = clipRayInsideBox(
                p.pos.x, p.pos.z,
                camDirX, camDirZ,
                innerBox,
                safeDist
              );
              if (tClip < safeDist) {
                safeDist = Math.max(1.4, tClip);
              }
            }
          }

          const camX = p.pos.x + camDirX * safeDist;
          let camY = targetY + camDirY * safeDist;
          if (isIndoors) {
            camY = Math.min(ceilingH - 0.32, camY);
          }
          const camZ = p.pos.z + camDirZ * safeDist;

          camera.position.set(camX, camY, camZ);
          camera.lookAt(p.pos.x, targetY, p.pos.z);
        }

        // Camera compass heading in degrees
        const headingDeg = Math.round(((orbit.yaw * 180) / Math.PI + 360) % 360);

        // Compute horizontal target bearing to next unreached objective
        const activeCpForNav = checkpointsRef.current.find((c) => !c.reached);
        let targetAngleDeg = headingDeg;
        if (activeCpForNav) {
          const tdx = activeCpForNav.position[0] - p.pos.x;
          const tdz = activeCpForNav.position[2] - p.pos.z;
          targetAngleDeg = Math.round(((Math.atan2(tdx, tdz) * 180) / Math.PI + 360) % 360);
        }

        onStatsUpdateRef.current({
          elapsedTime: Math.floor(elapsed),
          health: Math.floor(p.health),
          smokeInhalation: Math.floor(p.smokeInhalation),
          stamina: Math.floor(p.stamina),
          currentScore: p.score,
          nearestCheckpointDist: Math.round(nearestDist * 10) / 10,
          compassHeading: headingDeg,
          currentFloor: p.pos.y > 1.8 ? 1 : 0,
          targetAngle: targetAngleDeg,
          playerPosition: [p.pos.x, p.pos.y, p.pos.z],
          playerRotation: p.rotationY,
        });

        // Update Real-Time Dynamic Cadet Navigation Guide Arrow in 3D world
        if (activeCpForNav && !p.completed && !p.isDead) {
          cadetGuideArrow.visible = true;

          const tdx = activeCpForNav.position[0] - p.pos.x;
          const tdz = activeCpForNav.position[2] - p.pos.z;
          const distToTarget = Math.hypot(tdx, tdz);

          const dirX = distToTarget > 0.05 ? tdx / distToTarget : 0;
          const dirZ = distToTarget > 0.05 ? tdz / distToTarget : 1;

          // Position guide arrow ~1.1m in front of cadet pointing towards objective
          const arrowDist = Math.min(1.2, Math.max(0.65, distToTarget * 0.35));
          const bobY = p.pos.y + 0.16 + Math.sin(elapsed * 4.5) * 0.05;

          cadetGuideArrow.position.set(
            p.pos.x + dirX * arrowDist,
            bobY,
            p.pos.z + dirZ * arrowDist
          );

          cadetGuideArrow.rotation.y = Math.atan2(dirX, dirZ);

          const floorRing = cadetGuideArrow.children[0] as THREE.Mesh;
          if (floorRing && floorRing.material) {
            (floorRing.material as THREE.MeshBasicMaterial).opacity =
              0.55 + Math.sin(elapsed * 6.0) * 0.3;
          }
          const arrowCone = cadetGuideArrow.children[1] as THREE.Mesh;
          if (arrowCone && arrowCone.material) {
            (arrowCone.material as THREE.MeshStandardMaterial).emissiveIntensity =
              1.1 + Math.sin(elapsed * 5.0) * 0.6;
          }
        } else {
          cadetGuideArrow.visible = false;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Window resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Recenter camera behind player
    const handleRecenter = () => {
      cameraOrbit.current.targetYaw = playerState.current.rotationY;
      cameraOrbit.current.targetPitch = 0.22;
    };
    window.addEventListener('aegis:recenterCamera', handleRecenter);

    // Switch floor toggle event
    const handleSwitchFloor = (e: Event) => {
      const customEvent = e as CustomEvent<{ floor?: number }>;
      const currentLevel = playerState.current.pos.y > 1.8 ? 1 : 0;
      const targetLevel = customEvent.detail?.floor !== undefined ? customEvent.detail.floor : (currentLevel === 0 ? 1 : 0);
      if (targetLevel === 1) {
        playerState.current.pos.set(-16, 3.6, -12);
      } else {
        playerState.current.pos.set(-16, 0, -12);
      }
      playerState.current.velocity.set(0, 0, 0);
    };
    window.addEventListener('aegis:switchFloor', handleSwitchFloor);

    // Custom room spawn location change event
    const handleSetSpawnLocation = (e: Event) => {
      const customEvent = e as CustomEvent<{ position: [number, number, number]; name?: string }>;
      if (customEvent.detail && customEvent.detail.position) {
        const [x, y, z] = customEvent.detail.position;
        playerState.current.pos.set(x, y, z);
        playerState.current.velocity.set(0, 0, 0);
        playerState.current.health = 100;
        playerState.current.smokeInhalation = 0;
        playerState.current.stamina = 100;
        playerState.current.isDead = false;
        playerState.current.deathHandled = false;
        setIsDead(false);
        soundFX.playDoor(true);
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#06b6d4', '#10b981', '#f59e0b'],
        });
      }
    };
    window.addEventListener('aegis:setSpawnLocation', handleSetSpawnLocation);

    // Keyboard controls (direct listener)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;
      keysDown.current[e.key.toLowerCase()] = true;

      if (e.key === 'ArrowLeft') {
        cameraOrbit.current.targetYaw -= 0.12;
      } else if (e.key === 'ArrowRight') {
        cameraOrbit.current.targetYaw += 0.12;
      } else if (e.key.toLowerCase() === 'r') {
        handleRecenter();
      } else if (e.key.toLowerCase() === 'f') {
        const currentLevel = playerState.current.pos.y > 1.8 ? 1 : 0;
        if (currentLevel === 0) {
          playerState.current.pos.set(-16, 3.6, -12);
        } else {
          playerState.current.pos.set(-16, 0, -12);
        }
        playerState.current.velocity.set(0, 0, 0);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (deathTimeoutRef.current) {
        clearTimeout(deathTimeoutRef.current);
        deathTimeoutRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('aegis:recenterCamera', handleRecenter);
      window.removeEventListener('aegis:switchFloor', handleSwitchFloor);
      window.removeEventListener('aegis:setSpawnLocation', handleSetSpawnLocation);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      hazardRigs.forEach((hr) => hr.dispose());
      ceilingRigRef.current?.dispose();
      soundFX.stopEmergencySiren();
      soundFX.stopHazardAudio();
      renderer.dispose();
    };
  }, [mapData, disasterType, isARMode]);

  // Pointer Drag Handlers for Camera Orbit Control
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startYaw: cameraOrbit.current.targetYaw,
      startPitch: cameraOrbit.current.targetPitch,
      pointerId: e.pointerId,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging || dragRef.current.pointerId !== e.pointerId) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    const yawSpeed = 0.006;
    const pitchSpeed = 0.005;

    cameraOrbit.current.targetYaw = dragRef.current.startYaw + deltaX * yawSpeed;
    cameraOrbit.current.targetPitch = Math.max(
      0.06,
      Math.min(0.65, dragRef.current.startPitch - deltaY * pitchSpeed)
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId === e.pointerId) {
      dragRef.current.isDragging = false;
      dragRef.current.pointerId = null;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    cameraOrbit.current.dist = Math.max(2.2, Math.min(6.0, cameraOrbit.current.dist + e.deltaY * 0.0035));
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-slate-950 touch-none cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* AR Live Camera Video Pass-Through */}
      {isARMode && (
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none filter contrast-125"
        />
      )}

      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-10" />

      {/* Dynamic Screen-Edge Danger Vignettes (Fire Heat, Toxic Gas Haze, Smoke Obscuration, Arc Flash) */}
      {hazardAlert && (
        <div
          className={`pointer-events-none absolute inset-0 z-15 transition-all duration-300 ${
            hazardAlert.type === 'fire'
              ? hazardAlert.urgency === 'critical'
                ? 'shadow-[inset_0_0_120px_rgba(239,68,68,0.85)] animate-pulse'
                : 'shadow-[inset_0_0_80px_rgba(249,115,22,0.6)]'
              : hazardAlert.type === 'gas' || hazardAlert.type === 'chemical_leak'
              ? hazardAlert.urgency === 'critical'
                ? 'shadow-[inset_0_0_120px_rgba(132,204,22,0.85)] animate-pulse'
                : 'shadow-[inset_0_0_80px_rgba(163,230,53,0.55)]'
              : hazardAlert.type === 'smoke'
              ? hazardAlert.urgency === 'critical'
                ? 'shadow-[inset_0_0_140px_rgba(15,23,42,0.92)] animate-pulse'
                : 'shadow-[inset_0_0_90px_rgba(30,41,59,0.75)]'
              : 'shadow-[inset_0_0_80px_rgba(56,189,248,0.65)] animate-pulse'
          }`}
        />
      )}

      {/* Tactical Hazard Proximity Warning HUD Banner */}
      {hazardAlert && (
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-25 pointer-events-none w-[94%] max-w-md transition-all duration-200">
          <div
            className={`flex items-center gap-3 p-3 rounded-2xl shadow-2xl backdrop-blur-xl border ${
              hazardAlert.urgency === 'critical'
                ? 'bg-rose-950/90 border-rose-500 text-rose-100 ring-4 ring-rose-500/40 animate-pulse'
                : hazardAlert.urgency === 'danger'
                ? 'bg-amber-950/90 border-amber-500 text-amber-100 ring-2 ring-amber-500/30'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            {/* Animated Hazard Icon */}
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                hazardAlert.type === 'fire'
                  ? 'bg-orange-500/30 text-orange-400'
                  : hazardAlert.type === 'gas' || hazardAlert.type === 'chemical_leak'
                  ? 'bg-lime-500/30 text-lime-400'
                  : hazardAlert.type === 'smoke'
                  ? 'bg-slate-700/60 text-slate-300'
                  : 'bg-sky-500/30 text-sky-400'
              }`}
            >
              {hazardAlert.type === 'fire' ? (
                <Flame className="w-6 h-6 animate-bounce" />
              ) : hazardAlert.type === 'gas' || hazardAlert.type === 'chemical_leak' ? (
                <Biohazard className="w-6 h-6 animate-spin" />
              ) : hazardAlert.type === 'smoke' ? (
                <Wind className="w-6 h-6 animate-pulse" />
              ) : (
                <Zap className="w-6 h-6 animate-pulse" />
              )}
            </div>

            {/* Warning Text & Distance Radar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-black tracking-widest uppercase text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {hazardAlert.urgency === 'critical'
                    ? 'CRITICAL LETHAL DANGER'
                    : hazardAlert.urgency === 'danger'
                    ? 'HAZARD NEARBY'
                    : 'PROXIMITY WARNING'}
                </span>
                <span
                  className={`text-xs font-mono font-black px-2 py-0.5 rounded-md border ${
                    hazardAlert.urgency === 'critical'
                      ? 'bg-rose-500/30 text-rose-200 border-rose-400 animate-pulse'
                      : hazardAlert.urgency === 'danger'
                      ? 'bg-amber-500/30 text-amber-200 border-amber-400'
                      : 'bg-black/40 text-slate-200 border-white/15'
                  }`}
                >
                  {hazardAlert.dist}m
                </span>
              </div>

              <h4 className="text-xs sm:text-sm font-black truncate mt-0.5">
                {hazardAlert.type === 'fire'
                  ? 'Active Fire & Thermal Conflagration'
                  : hazardAlert.type === 'gas' || hazardAlert.type === 'chemical_leak'
                  ? 'Toxic Chemical Vapor Plume'
                  : hazardAlert.type === 'smoke'
                  ? 'Dense Smoke Stratification'
                  : 'High-Voltage Arc Rupture'}
              </h4>

              <p className="text-[11px] text-slate-300 truncate mt-0.5 font-medium">
                {hazardAlert.type === 'fire'
                  ? 'Extreme heat radiation! Turn around immediately.'
                  : hazardAlert.type === 'gas' || hazardAlert.type === 'chemical_leak'
                  ? 'Corrosive chemical fumes! Evacuate upwind / equip gas mask.'
                  : hazardAlert.type === 'smoke'
                  ? 'Suffocation danger! Hold [C] or tap Crouch to low crawl.'
                  : 'Arc flash flashover! Do not touch metal railings.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Danger Sensing Adrenaline Feedback Pill */}
      {dangerSenseLevel > 0 && !isDead && (
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-25 pointer-events-none transition-all duration-200">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/60 shadow-lg shadow-rose-950/50 backdrop-blur-md animate-pulse">
            <Activity className="w-3.5 h-3.5 text-rose-400 animate-spin" />
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-rose-200">
              DANGER ZONE • SLOW STAMINA DRAIN ({Math.round(dangerSenseLevel * 100)}% STRESS)
            </span>
          </div>
        </div>
      )}

      {/* Critical Casualty & Flatline Collapse Cinematic Overlay */}
      {isDead && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-all duration-500">
          {/* Intense Crimson Flash Vignette */}
          <div className="absolute inset-0 shadow-[inset_0_0_160px_rgba(225,29,72,0.95)] animate-pulse" />

          {/* Incident Telemetry Card */}
          <div className="relative z-10 w-[92%] max-w-lg bg-slate-950/95 border-2 border-rose-600 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/80 text-center ring-4 ring-rose-500/30">
            {/* Blinking Critical Alert Icons */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-900/60 border border-rose-500/60 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950 animate-bounce">
                <Skull className="w-7 h-7" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-500 shadow-lg animate-pulse">
                <HeartCrack className="w-7 h-7" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold tracking-wider uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              CADET CASUALTY INCIDENT
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-rose-100 tracking-tight">
              VITAL SIGNS FLATLINED
            </h3>

            {/* Lethal Cause Breakdown */}
            <div className="my-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-left">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400 mb-1">
                FATAL CAUSE OF FAILURE:
              </div>
              <p className="text-sm font-semibold text-rose-200 leading-snug">
                {fatalCause || 'Severe Environmental Hazard Overexposure & Stamina Exhaustion'}
              </p>
            </div>

            {/* Vital Statistics at Moment of Collapse */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs font-mono mb-5">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">HEALTH CAPACITY</span>
                <span className="text-rose-400 font-bold text-sm">0% (TERMINATED)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">STAMINA ENERGY</span>
                <span className="text-amber-400 font-bold text-sm">0% (EXHAUSTED)</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
              <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              Compiling Incident Diagnostics & Scorecard...
            </p>
          </div>
        </div>
      )}

      {/* Interactive Door Control Prompt */}
      {nearbyDoor && (
        <div className="absolute bottom-28 md:bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={handleToggleDoor}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-2xl backdrop-blur-md transition-all active:scale-95 border ${
              nearbyDoor.isOpen
                ? 'bg-slate-900/90 hover:bg-slate-800 text-amber-300 border-amber-500/50 ring-2 ring-amber-500/20'
                : nearbyDoor.isEmergency
                ? 'bg-emerald-600/95 hover:bg-emerald-500 text-white border-emerald-400 ring-4 ring-emerald-500/25 animate-pulse'
                : 'bg-blue-600/95 hover:bg-blue-500 text-white border-blue-400 ring-2 ring-blue-500/25'
            }`}
          >
            {nearbyDoor.isOpen ? (
              <DoorOpen className="w-5 h-5 text-amber-300" />
            ) : (
              <DoorClosed className="w-5 h-5 text-white" />
            )}
            <span>
              {nearbyDoor.isOpen
                ? 'Close Door [E]'
                : nearbyDoor.isEmergency
                ? 'Push Open Exit [E]'
                : 'Open Door [E]'}
            </span>
          </button>
        </div>
      )}

      {/* Interactive Emergency Ladder & Tactical Rope Descent Prompt */}
      {isNearRopeExit && (
        <div className="absolute bottom-36 md:bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center gap-2 animate-bounce">
          <button
            type="button"
            onClick={handleTriggerRopeSlide}
            className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl font-black text-sm tracking-wide shadow-2xl backdrop-blur-md bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 border-2 border-amber-300 ring-4 ring-amber-500/40 transition-all active:scale-95"
          >
            <span className="text-2xl">🪢</span>
            <div className="text-left">
              <div className="font-black text-[11px] uppercase tracking-wider text-slate-950 flex items-center gap-2">
                <span>UNIQUE 1ST-FLOOR ESCAPE</span>
                <span className="bg-slate-950 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
                  +350 PTS
                </span>
              </div>
              <div className="text-sm font-black text-slate-950">
                Slide Down Tactical Rope [E]
              </div>
            </div>
          </button>
          <span className="text-[11px] font-mono font-bold text-amber-300 bg-slate-950/90 px-3.5 py-1 rounded-full border border-amber-500/50 shadow-xl">
            Or step onto the Steel Safety Ladder to climb down rungs
          </span>
        </div>
      )}

      {/* Interactive Health Care Center & Medical Triage Prompt */}
      {isNearHealthCenter && (
        <div className="absolute bottom-40 md:bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center gap-1.5 animate-bounce">
          <button
            type="button"
            onClick={handleOpenHealthCareCenter}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm tracking-wide shadow-2xl backdrop-blur-md bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white border-2 border-red-300 ring-4 ring-red-500/35 transition-all active:scale-95"
          >
            <span className="text-xl">🏥</span>
            <div className="text-left">
              <div className="font-mono text-[10px] text-red-200 uppercase tracking-widest font-bold">
                SAFE MUSTER • FIELD MEDICAL TRIAGE
              </div>
              <div className="text-sm font-black text-white">
                Enter Health Care Center & Check Up Report [H]
              </div>
            </div>
          </button>
          <span className="text-[10px] font-mono text-emerald-300 bg-slate-950/90 px-3 py-0.5 rounded-full border border-emerald-500/40">
            Full vital signs checkup, ECG telemetry & official discharge clearance
          </span>
        </div>
      )}
    </div>
  );
};
