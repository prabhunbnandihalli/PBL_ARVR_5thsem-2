export type CampusType = 'school' | 'college' | 'university';

export type DisasterType = 'fire' | 'earthquake' | 'chemical';

export interface CharacterEquipment {
  headgear: 'none' | 'smoke_hood' | 'gas_mask' | 'safety_helmet';
  vest: 'none' | 'high_vis_vest' | 'tactical_harness' | 'hazard_suit';
  backpack: 'none' | 'first_aid_kit' | 'fire_extinguisher' | 'survival_pack';
  tool: 'flashlight' | 'thermal_camera' | 'emergency_whistle' | 'megaphone';
}

export interface CharacterCustomization {
  name: string;
  role: 'Student' | 'Teacher' | 'Safety Warden' | 'Lab Specialist' | 'Campus Paramedic';
  gender: 'neutral' | 'masculine' | 'feminine';
  clothingStyle:
    | 'student_uniform'
    | 'padded_vest'
    | 'teacher_suit'
    | 'casual_hoodie'
    | 'lab_coat'
    | 'warden_uniform'
    | 'paramedic_suit';
  clothingColor: string;
  skinTone: string;
  hairColor: string;
  hairStyle: 'stylish' | 'short' | 'ponytail' | 'curly' | 'buzz' | 'parted';
  equipment: CharacterEquipment;
  hasGlasses?: boolean;
}

export interface Checkpoint {
  id: string;
  name: string;
  description: string;
  position: [number, number, number]; // x, y, z
  radius: number;
  points: number;
  reached: boolean;
  requiredAction?: 'low_crawl' | 'extinguish' | 'clear_door' | 'help_peer' | 'muster';
}

export interface HazardZone {
  id: string;
  type: 'fire' | 'smoke' | 'gas' | 'debris' | 'chemical_leak' | 'electrical_arc';
  position: [number, number, number];
  radius: number;
  severity: number; // 1 to 5
  description: string;
  isBlockage: boolean; // blocks path completely
  active: boolean;
}

export interface PathNode {
  id: string;
  position: [number, number, number];
  isSafe: boolean; // true = green safe path, false = red danger path
  connectedTo: string[];
  label?: string;
}

export interface PeerUser {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  position: [number, number, number];
  targetCheckpointIndex: number;
  status: 'evacuating' | 'needs_help' | 'crawling' | 'safe';
  health: number;
  message?: string;
}

export interface WalkableStaircase {
  id: string;
  name: string;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  ascendDirection: '+z' | '-z' | '+x' | '-x';
  bottomY: number; // 0.9 (standing elevation on ground floor)
  topY: number;    // 4.5 (standing elevation on 1st floor)
  bottomLevel: number; // 0
  topLevel: number;    // 1
  label?: string;
  isBlocked?: boolean;
  isOutside?: boolean;
}

export interface CampusMapData {
  id: CampusType;
  name: string;
  subtitle: string;
  description: string;
  recommendedTimeSeconds: number;
  initialPlayerPosition: [number, number, number];
  safeAssemblyPosition: [number, number, number];
  checkpoints: Checkpoint[];
  hazards: HazardZone[];
  safePathNodes: PathNode[];
  dangerPathNodes: PathNode[];
  walls: {
    start: [number, number];
    end: [number, number];
    height: number;
    baseY?: number;
    floorLevel?: number;
    color?: string;
    label?: string;
  }[];
  rooms: {
    name: string;
    center: [number, number];
    size: [number, number];
    floorColor?: string;
    elevation?: number;
    floorLevel?: number;
  }[];
  doors: {
    position: [number, number, number];
    isOpen: boolean;
    isEmergencyExit: boolean;
    rotationY?: number;
    floorLevel?: number;
    label?: string;
    infoBoard?: string;
  }[];
  ceilingHeight?: number;
  indoorBounds?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  staircases?: WalkableStaircase[];
  exteriorFireEscape?: {
    exitPosition: [number, number, number];
    landingPosition: [number, number, number];
    width?: number;
  };
  compound?: CampusCompoundData;
  road?: CampusRoadData;
  emergencyLadderRope?: EmergencyLadderRopeData;
  startingLocations?: StartingLocation[];
  healthCareCenter?: HealthCareCenterData;
}

export interface StartingLocation {
  id: string;
  name: string;
  roomName: string;
  floorLevel: number;
  floorLabel: string;
  position: [number, number, number];
  description: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  recommendedRoute: string;
}

export interface EmergencyLadderRopeData {
  platformPosition: [number, number, number]; // 1st floor exterior platform [x, y, z]
  groundPosition: [number, number, number];   // ground rescue pad [x, y, z]
  ladderPosition: [number, number, number];   // vertical ladder [x, y, z]
  ropePosition: [number, number, number];     // fast rope [x, y, z]
  wallOpening: {
    x: number;
    minZ: number;
    maxZ: number;
  };
  label: string;
}

export interface CampusCompoundData {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  wallHeight?: number;
  mainGate: {
    position: [number, number]; // [x, z] center of gate
    width: number;
    label: string;
  };
  emergencyGate?: {
    position: [number, number]; // [x, z] center of emergency gate
    width: number;
    label: string;
  };
}

export interface CampusRoadData {
  axis: 'x' | 'z';
  position: number; // coordinate along orthogonal axis (e.g. Z = 32)
  width: number;    // roadway width (e.g. 10m)
  length: number;   // roadway span (e.g. 120m)
  sidewalkWidth?: number;
  label?: string;
  crosswalks?: {
    position: number; // coordinate along road span
    width: number;
  }[];
}

export interface DrillScoreReport {
  drillId: string;
  campusName: string;
  disasterType: DisasterType;
  playerName: string;
  characterRole: string;
  completionTimeSeconds: number;
  checkpointsReached: number;
  totalCheckpoints: number;
  basePoints: number;
  timeBonus: number;
  safetyScore: number; // 0-100
  totalScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  hazardsEncountered: number;
  smokeExposurePercent: number;
  peerAssisted: boolean;
  evacuationEfficiency: number; // 0 - 100%
  timestamp: string;
  isCasualty?: boolean;
  casualtyReason?: string;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  campusId: CampusType;
  disasterType: DisasterType;
  score: number;
  timeSeconds: number;
  efficiency: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  role: string;
  date: string;
  isSelf?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  badge?: string;
  campus: string;
  message: string;
  timestamp: string;
  isEmergencyAlert?: boolean;
  isSystem?: boolean;
}

export interface HealthReportData {
  reportId: string;
  drillId: string;
  cadetName: string;
  cadetRole: string;
  campusName: string;
  disasterType: DisasterType;
  evacuationTimeSeconds: number;
  routeUsed: string;
  triageTag: 'GREEN' | 'YELLOW' | 'RED';
  triageCategory: string;
  vitals: {
    heartRateBpm: number;
    bloodPressure: string;
    spo2Percent: number;
    respiratoryRateBpm: number;
    bodyTempC: number;
    carbonMonoxideCoHb: number;
  };
  clinicalFindings: {
    airwayLungsStatus: string;
    thermalBurnStatus: string;
    musculoskeletalStatus: string;
    psychologicalShock: string;
  };
  treatmentAdministered: string[];
  physicianNotes: string;
  doctorName: string;
  paramedicName: string;
  dischargeStatus: 'Fit for Normal Duty' | 'Observation Recommended' | 'Urgent Hospital Transfer';
  timestamp: string;
  evacuationScore: number;
  evacuationGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface HealthCareCenterData {
  position: [number, number, number];
  name: string;
  tentColor?: string;
  label?: string;
}

