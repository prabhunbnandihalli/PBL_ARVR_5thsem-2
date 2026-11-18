import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Map as MapIcon,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Crosshair,
  Flame,
  AlertTriangle,
  DoorOpen,
  ArrowRight,
  Shield,
  X,
  Compass,
  Footprints,
} from 'lucide-react';
import { CampusMapData, Checkpoint, HazardZone, PathNode } from '../types';

interface GuidanceMapProps {
  mapData: CampusMapData;
  playerPosition: [number, number, number];
  playerRotation: number;
  currentFloor: number;
  activeCheckpoint?: Checkpoint;
  checkpoints: Checkpoint[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onCloseExpanded?: () => void;
}

export const GuidanceMap: React.FC<GuidanceMapProps> = ({
  mapData,
  playerPosition,
  playerRotation,
  currentFloor,
  activeCheckpoint,
  checkpoints,
  isExpanded = false,
  onToggleExpand,
  onCloseExpanded,
}) => {
  // Selected floor view filter: 'auto' (follow cadet), 0 (Ground), 1 (First Fl), 'all' (overlay)
  const [selectedFloor, setSelectedFloor] = useState<'auto' | 0 | 1 | 'all'>('auto');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [followCadet, setFollowCadet] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  const activeFloor = selectedFloor === 'auto' ? currentFloor : selectedFloor;

  // Campus bounds calculation
  const compoundBounds = mapData.compound?.bounds || {
    minX: -32,
    maxX: 36,
    minZ: -26,
    maxZ: 30,
  };

  const roadData = mapData.road || {
    axis: 'x',
    position: 33,
    width: 10,
    length: 120,
    sidewalkWidth: 2.5,
  };

  // Map world boundaries including road and compound
  const worldMinX = Math.min(compoundBounds.minX - 4, -40);
  const worldMaxX = Math.max(compoundBounds.maxX + 4, 42);
  const worldMinZ = Math.min(compoundBounds.minZ - 4, -28);
  const worldMaxZ = Math.max(roadData.position + roadData.width / 2 + 5, 42);

  const worldWidth = worldMaxX - worldMinX;
  const worldHeight = worldMaxZ - worldMinZ;

  // ViewBox dimensions for SVG
  const svgWidth = 800;
  const svgHeight = (svgWidth * worldHeight) / worldWidth;

  // Coordinate transforms: world [x, z] -> SVG [px, py]
  const worldToSvg = (x: number, z: number): [number, number] => {
    const px = ((x - worldMinX) / worldWidth) * svgWidth;
    const py = ((z - worldMinZ) / worldHeight) * svgHeight;
    return [px, py];
  };

  // Filter elements by active floor
  const visibleRooms = useMemo(() => {
    return mapData.rooms.filter((room) => {
      if (room.floorLevel === undefined) return true; // exterior / common
      if (activeFloor === 'all') return true;
      return room.floorLevel === activeFloor;
    });
  }, [mapData.rooms, activeFloor]);

  const visibleWalls = useMemo(() => {
    return mapData.walls.filter((w) => {
      if (w.floorLevel === undefined) return true;
      if (activeFloor === 'all') return true;
      return w.floorLevel === activeFloor;
    });
  }, [mapData.walls, activeFloor]);

  const visibleDoors = useMemo(() => {
    return mapData.doors.filter((d) => {
      if (d.floorLevel === undefined) return true;
      if (activeFloor === 'all') return true;
      return d.floorLevel === activeFloor;
    });
  }, [mapData.doors, activeFloor]);

  // Center pan on cadet when followCadet is active
  useEffect(() => {
    if (followCadet && isExpanded) {
      const [cadetPx, cadetPy] = worldToSvg(playerPosition[0], playerPosition[2]);
      const centerX = svgWidth / 2;
      const centerY = svgHeight / 2;
      setPanOffset({
        x: (centerX - cadetPx) * (zoomLevel - 1),
        y: (centerY - cadetPy) * (zoomLevel - 1),
      });
    }
  }, [playerPosition, followCadet, zoomLevel, isExpanded]);

  // Cadet position in SVG
  const [cadetSvgX, cadetSvgY] = worldToSvg(playerPosition[0], playerPosition[2]);

  // Heading angle in SVG degrees (Three.js rotationY -> 2D SVG rotation)
  // In Three.js: yaw 0 is looking +Z, rotationY is clockwise from +Z around Y
  const cadetHeadingDeg = ((-playerRotation * 180) / Math.PI + 180) % 360;

  // Render SVG content shared between MiniMap and Expanded Modal
  const renderMapContent = (isMini: boolean) => {
    const [cMinX, cMinZ] = worldToSvg(compoundBounds.minX, compoundBounds.minZ);
    const [cMaxX, cMaxZ] = worldToSvg(compoundBounds.maxX, compoundBounds.maxZ);
    const cWidth = cMaxX - cMinX;
    const cHeight = cMaxZ - cMinZ;

    // Road dimensions
    const roadHalfW = roadData.width / 2;
    const [rMinX, rMinZ] = worldToSvg(-roadData.length / 2, roadData.position - roadHalfW);
    const [rMaxX, rMaxZ] = worldToSvg(roadData.length / 2, roadData.position + roadHalfW);
    const rWidth = rMaxX - rMinX;
    const rHeight = rMaxZ - rMinZ;

    // Road centerline
    const [, rCenterZ] = worldToSvg(0, roadData.position);

    return (
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle blueprint grid pattern */}
          <pattern id="guidance-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="0.8" />
          </pattern>

          {/* Safe path glow filter */}
          <filter id="safe-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Hazard glow filter */}
          <filter id="hazard-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Map Background */}
        <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#090d16" />
        <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#guidance-grid)" />

        {/* 1. PERIMETER ROAD & STREET INFRASTRUCTURE */}
        <g id="road-layer">
          {/* Asphalt Roadway */}
          <rect
            x={rMinX}
            y={rMinZ}
            width={rWidth}
            height={rHeight}
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1.5"
            rx="2"
          />

          {/* Sidewalks (near side & far side) */}
          <rect
            x={rMinX}
            y={rMinZ - 8}
            width={rWidth}
            height="8"
            fill="#334155"
            stroke="#475569"
            strokeWidth="0.8"
          />
          <rect
            x={rMinX}
            y={rMaxZ}
            width={rWidth}
            height="8"
            fill="#334155"
            stroke="#475569"
            strokeWidth="0.8"
          />

          {/* Dashed Center White Line */}
          <line
            x1={rMinX}
            y1={rCenterZ}
            x2={rMaxX}
            y2={rCenterZ}
            stroke="#f8fafc"
            strokeWidth="2"
            strokeDasharray="14 10"
            opacity="0.9"
          />

          {/* Solid White Road Shoulder Lines */}
          <line
            x1={rMinX}
            y1={rMinZ + 3}
            x2={rMaxX}
            y2={rMinZ + 3}
            stroke="#f8fafc"
            strokeWidth="1.2"
            opacity="0.8"
          />
          <line
            x1={rMinX}
            y1={rMaxZ - 3}
            x2={rMaxX}
            y2={rMaxZ - 3}
            stroke="#f8fafc"
            strokeWidth="1.2"
            opacity="0.8"
          />

          {/* Road Crosswalks (Zebra Crossing) */}
          {mapData.road?.crosswalks?.map((cw, idx) => {
            const [cwPx, cwPy] = worldToSvg(cw.position, roadData.position);
            const cwW = (cw.width / worldWidth) * svgWidth;
            return (
              <g key={`cw_${idx}`} transform={`translate(${cwPx - cwW / 2}, ${rMinZ + 1})`}>
                <rect width={cwW} height={rHeight - 2} fill="none" />
                {Array.from({ length: 6 }).map((_, barIdx) => (
                  <rect
                    key={barIdx}
                    x={0}
                    y={barIdx * ((rHeight - 2) / 6) + 1}
                    width={cwW}
                    height={(rHeight - 2) / 12}
                    fill="#f8fafc"
                    opacity="0.95"
                  />
                ))}
                {!isMini && (
                  <text
                    x={cwW / 2}
                    y={rHeight / 2}
                    fill="#38bdf8"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    CROSSWALK
                  </text>
                )}
              </g>
            );
          })}

          {/* Road Label */}
          {!isMini && (
            <text
              x={svgWidth / 2}
              y={rCenterZ + 16}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="2"
              textAnchor="middle"
            >
              {mapData.road?.label || 'PUBLIC ACCESS ROAD & EMERGENCY EVACUATION ROUTE'}
            </text>
          )}
        </g>

        {/* 2. CAMPUS COMPOUND BOUNDARY PERIMETER */}
        <g id="compound-layer">
          {/* Campus Grounds Background */}
          <rect
            x={cMinX}
            y={cMinZ}
            width={cWidth}
            height={cHeight}
            fill="#0f172a"
            fillOpacity="0.4"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeDasharray="8 4"
            rx="6"
          />

          {/* Compound Gates */}
          {mapData.compound?.mainGate && (() => {
            const mg = mapData.compound.mainGate;
            const [mgPx, mgPy] = worldToSvg(mg.position[0], mg.position[1]);
            const mgW = (mg.width / worldWidth) * svgWidth;
            return (
              <g key="main_gate">
                {/* Gate opening cutout in boundary */}
                <line
                  x1={mgPx - mgW / 2}
                  y1={mgPy}
                  x2={mgPx + mgW / 2}
                  y2={mgPy}
                  stroke="#22c55e"
                  strokeWidth="4"
                />
                {/* Gate Posts */}
                <circle cx={mgPx - mgW / 2} cy={mgPy} r="4" fill="#facc15" stroke="#1e293b" strokeWidth="1" />
                <circle cx={mgPx + mgW / 2} cy={mgPy} r="4" fill="#facc15" stroke="#1e293b" strokeWidth="1" />
                {!isMini && (
                  <text
                    x={mgPx}
                    y={mgPy - 7}
                    fill="#4ade80"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    MAIN SECURITY GATE
                  </text>
                )}
              </g>
            );
          })()}

          {mapData.compound?.emergencyGate && (() => {
            const eg = mapData.compound.emergencyGate;
            const [egPx, egPy] = worldToSvg(eg.position[0], eg.position[1]);
            const egW = (eg.width / worldWidth) * svgWidth;
            return (
              <g key="emergency_gate">
                <line
                  x1={egPx - egW / 2}
                  y1={egPy}
                  x2={egPx + egW / 2}
                  y2={egPy}
                  stroke="#ef4444"
                  strokeWidth="3.5"
                />
                <circle cx={egPx - egW / 2} cy={egPy} r="3.5" fill="#ef4444" stroke="#1e293b" strokeWidth="1" />
                <circle cx={egPx + egW / 2} cy={egPy} r="3.5" fill="#ef4444" stroke="#1e293b" strokeWidth="1" />
                {!isMini && (
                  <text
                    x={egPx}
                    y={egPy - 6}
                    fill="#f87171"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    EMERGENCY GATE
                  </text>
                )}
              </g>
            );
          })()}

          {/* Compound boundary label */}
          {!isMini && (
            <text
              x={cMinX + 10}
              y={cMinZ + 14}
              fill="#38bdf8"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="1"
            >
              CAMPUS BOUNDARY (COMPOUND WALL)
            </text>
          )}
        </g>

        {/* 3. BUILDING ROOMS & SPACES */}
        <g id="rooms-layer">
          {visibleRooms.map((room, idx) => {
            const [minPx, minPy] = worldToSvg(
              room.center[0] - room.size[0] / 2,
              room.center[1] - room.size[1] / 2
            );
            const [maxPx, maxPy] = worldToSvg(
              room.center[0] + room.size[0] / 2,
              room.center[1] + room.size[1] / 2
            );
            const rw = maxPx - minPx;
            const rh = maxPy - minPy;
            const isOutdoor = room.name.toLowerCase().includes('field') ||
              room.name.toLowerCase().includes('plaza') ||
              room.name.toLowerCase().includes('quad');
            const isUpper = (room.floorLevel ?? 0) === 1;

            return (
              <g key={`room_${idx}`}>
                <rect
                  x={minPx}
                  y={minPy}
                  width={rw}
                  height={rh}
                  fill={isOutdoor ? '#14532d' : isUpper ? '#1e1b4b' : '#1e293b'}
                  fillOpacity={isOutdoor ? 0.45 : isUpper ? 0.65 : 0.5}
                  stroke={isUpper ? '#818cf8' : '#475569'}
                  strokeWidth="1"
                  rx="3"
                />
                {!isMini && (
                  <text
                    x={(minPx + maxPx) / 2}
                    y={(minPy + maxPy) / 2}
                    fill={isOutdoor ? '#86efac' : isUpper ? '#c7d2fe' : '#cbd5e1'}
                    fontSize={rw > 70 ? '9' : '7.5'}
                    fontWeight="600"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {room.name.split(' (')[0]}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* 3b. AVAILABLE STARTING ORIGIN LOCATIONS IN BUILDING */}
        {!isMini && mapData.startingLocations && (
          <g id="starting-locations-layer">
            {mapData.startingLocations.map((loc) => {
              if (activeFloor !== 'all' && loc.floorLevel !== activeFloor) return null;
              const [lx, lz] = worldToSvg(loc.position[0], loc.position[2]);
              return (
                <g key={loc.id} transform={`translate(${lx}, ${lz})`}>
                  <circle cx="0" cy="0" r="4.5" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 1.5" />
                  <circle cx="0" cy="0" r="2" fill="#22d3ee" />
                  <text x="0" y="-6" fill="#67e8f9" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    ORIGIN: {loc.roomName}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* 4. ARCHITECTURAL WALLS */}
        <g id="walls-layer">
          {visibleWalls.map((wall, idx) => {
            const [x1, y1] = worldToSvg(wall.start[0], wall.start[1]);
            const [x2, y2] = worldToSvg(wall.end[0], wall.end[1]);
            const isUpper = (wall.floorLevel ?? 0) === 1;
            return (
              <line
                key={`wall_${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isUpper ? '#a5b4fc' : '#e2e8f0'}
                strokeWidth={isUpper ? '2.8' : '3.2'}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* 5. STAIRCASES (INSIDE & OUTSIDE) */}
        <g id="stairs-layer">
          {mapData.staircases?.map((stair) => {
            const [sMinX, sMinZ] = worldToSvg(stair.bounds.minX, stair.bounds.minZ);
            const [sMaxX, sMaxZ] = worldToSvg(stair.bounds.maxX, stair.bounds.maxZ);
            const sw = sMaxX - sMinX;
            const sh = sMaxZ - sMinZ;
            const isOutside = stair.isOutside;

            return (
              <g key={stair.id}>
                {/* Stairwell boundary */}
                <rect
                  x={sMinX}
                  y={sMinZ}
                  width={sw}
                  height={sh}
                  fill={isOutside ? '#451a03' : '#1e3a8a'}
                  fillOpacity="0.75"
                  stroke={isOutside ? '#f97316' : '#38bdf8'}
                  strokeWidth="1.8"
                  rx="2"
                />
                {/* Step lines */}
                {Array.from({ length: 7 }).map((_, stepIdx) => (
                  <line
                    key={stepIdx}
                    x1={sMinX}
                    y1={sMinZ + (stepIdx + 1) * (sh / 8)}
                    x2={sMaxX}
                    y2={sMinZ + (stepIdx + 1) * (sh / 8)}
                    stroke={isOutside ? '#fdba74' : '#bae6fd'}
                    strokeWidth="1"
                    strokeDasharray="2 1"
                  />
                ))}
                {!isMini && (
                  <text
                    x={(sMinX + sMaxX) / 2}
                    y={(sMinZ + sMaxZ) / 2 - 2}
                    fill={isOutside ? '#ffedd5' : '#e0f2fe'}
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {isOutside ? 'OUTSIDE STAIR' : 'INSIDE STAIR'}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* 6. DOORS FITTED TO WALL OPENINGS (ARCHITECTURAL SWING & FRAME) */}
        <g id="doors-layer">
          {visibleDoors.map((door, idx) => {
            const [dx, dz] = worldToSvg(door.position[0], door.position[2]);
            const isEmergency = door.isEmergencyExit;
            const rot = door.rotationY || 0;
            const isRotated = Math.abs(rot - Math.PI / 2) < 0.2;
            const spanPx = (3.0 / worldWidth) * svgWidth;

            return (
              <g key={`door_${idx}`} transform={`translate(${dx}, ${dz})`}>
                <g transform={`rotate(${isRotated ? 90 : 0})`}>
                  {/* Left & Right Door Frame Jambs snugly fitted to wall endpoints */}
                  <rect x={-spanPx / 2} y="-2" width="2.5" height="4" fill="#334155" stroke="#64748b" strokeWidth="0.8" rx="0.5" />
                  <rect x={spanPx / 2 - 2.5} y="-2" width="2.5" height="4" fill="#334155" stroke="#64748b" strokeWidth="0.8" rx="0.5" />

                  {/* Architectural 90-degree Door Swing Arc */}
                  <path
                    d={`M ${-spanPx / 2 + 1.5} 0 A ${spanPx - 3} ${spanPx - 3} 0 0 1 ${spanPx / 2 - 1.5} ${-(spanPx - 3)}`}
                    fill="none"
                    stroke={isEmergency ? '#22c55e' : '#0284c7'}
                    strokeWidth="1.2"
                    strokeDasharray="2.5 2"
                    opacity="0.85"
                  />
                  {/* Door Leaf Slab fitting between jambs */}
                  <line
                    x1={-spanPx / 2 + 1.5}
                    y1="0"
                    x2={spanPx / 2 - 1.5}
                    y2={-(spanPx - 3)}
                    stroke={isEmergency ? '#4ade80' : '#38bdf8'}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </g>

                {/* Central Status Indicator Beacon */}
                <circle
                  cx="0"
                  cy="0"
                  r={isEmergency ? '5' : '3.5'}
                  fill={isEmergency ? '#22c55e' : '#0284c7'}
                  stroke="#f8fafc"
                  strokeWidth="1.2"
                />
                {!isMini && (
                  <g transform="translate(0, -10)">
                    {isEmergency ? (
                      <g>
                        <rect x="-28" y="-6" width="56" height="12" rx="3" fill="#0f172a" stroke="#22c55e" strokeWidth="1.2" />
                        <text
                          x="0"
                          y="2.5"
                          fill="#4ade80"
                          fontSize="6.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {door.label ? `EXIT • ${door.label.toUpperCase()}` : 'EMERGENCY EXIT'}
                        </text>
                      </g>
                    ) : (
                      door.label && (
                        <g>
                          <rect x="-26" y="-5" width="52" height="10" rx="2" fill="#0f172a" stroke="#0ea5e9" strokeWidth="0.9" />
                          <text
                            x="0"
                            y="2.2"
                            fill="#38bdf8"
                            fontSize="5.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {door.label.toUpperCase()}
                          </text>
                        </g>
                      )
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 6b. UNIQUE 1ST-FLOOR EMERGENCY LADDER & TACTICAL ROPE EXIT STATION */}
        {mapData.emergencyLadderRope && (() => {
          const elr = mapData.emergencyLadderRope;
          const [px, pz] = worldToSvg(elr.platformPosition[0], elr.platformPosition[2]);
          const [gx, gz] = worldToSvg(elr.groundPosition[0], elr.groundPosition[2]);
          const [lx, lz] = worldToSvg(elr.ladderPosition[0], elr.ladderPosition[2]);
          const [rx, rz] = worldToSvg(elr.ropePosition[0], elr.ropePosition[2]);

          const platW = (2.8 / worldWidth) * svgWidth;
          const platH = (3.6 / worldHeight) * svgHeight;

          return (
            <g id="emergency-ladder-rope-layer">
              {/* Ground Landing Pad / Rescue Cushion */}
              <g transform={`translate(${gx}, ${gz})`}>
                <circle cx="0" cy="0" r="11" fill="#e11d48" fillOpacity="0.45" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 2" />
                <circle cx="0" cy="0" r="6" fill="#be123c" stroke="#ffffff" strokeWidth="1" />
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#ffffff" strokeWidth="1.2" />
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#ffffff" strokeWidth="1.2" />
                {!isMini && (
                  <text x="0" y="15" fill="#fb7185" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    RESCUE CUSHION (GROUND)
                  </text>
                )}
              </g>

              {/* Descent Connection Path from Balcony Platform to Ground Rescue Pad */}
              <line
                x1={px}
                y1={pz}
                x2={gx}
                y2={gz}
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="4 3"
                opacity="0.9"
              />

              {/* 1st Floor Steel Cantilever Platform */}
              <rect
                x={px - platW / 2}
                y={pz - platH / 2}
                width={platW}
                height={platH}
                fill="#334155"
                stroke="#f59e0b"
                strokeWidth="2"
                rx="2"
              />

              {/* Tactical Braided Descent Rope Anchor & Cord */}
              <g transform={`translate(${rx}, ${rz})`}>
                <circle cx="0" cy="0" r="4.5" fill="#d97706" stroke="#ffffff" strokeWidth="1.2" />
                <circle cx="0" cy="0" r="2" fill="#fef3c7" />
                {!isMini && (
                  <text x="-7" y="-4" fill="#fbbf24" fontSize="6.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                    FAST-ROPE
                  </text>
                )}
              </g>

              {/* Fixed Steel Safety Cage Ladder */}
              <g transform={`translate(${lx}, ${lz})`}>
                <rect x="-3" y="-5" width="6" height="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" rx="1" />
                <line x1="-3" y1="-2.5" x2="3" y2="-2.5" stroke="#38bdf8" strokeWidth="0.8" />
                <line x1="-3" y1="0" x2="3" y2="0" stroke="#38bdf8" strokeWidth="0.8" />
                <line x1="-3" y1="2.5" x2="3" y2="2.5" stroke="#38bdf8" strokeWidth="0.8" />
                {!isMini && (
                  <text x="-7" y="12" fill="#38bdf8" fontSize="6.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                    CAGE LADDER
                  </text>
                )}
              </g>

              {/* Unique Exit Marker Badge on Full Map */}
              {!isMini ? (
                <g transform={`translate(${px - platW / 2 - 4}, ${pz})`}>
                  <rect x="-92" y="-10" width="90" height="20" rx="4" fill="#0f172a" fillOpacity="0.95" stroke="#f59e0b" strokeWidth="1.2" />
                  <text x="-47" y="3" fill="#fde047" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    🪢 1ST FL ROPE & LADDER EXIT
                  </text>
                </g>
              ) : (
                /* Glowing radar beacon icon on Minimap */
                <g transform={`translate(${px}, ${pz})`}>
                  <circle cx="0" cy="0" r="8" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" className="animate-pulse" />
                  <circle cx="0" cy="0" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                </g>
              )}
            </g>
          );
        })()}

        {/* 7. SAFE EVACUATION PATH (Green Route) */}
        <g id="safe-path-layer">
          {mapData.safePathNodes.map((node) => {
            const [x1, y1] = worldToSvg(node.position[0], node.position[2]);
            return node.connectedTo.map((targetId) => {
              const targetNode = mapData.safePathNodes.find((n) => n.id === targetId);
              if (!targetNode) return null;
              const [x2, y2] = worldToSvg(targetNode.position[0], targetNode.position[2]);
              return (
                <line
                  key={`${node.id}_${targetId}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                  filter="url(#safe-glow)"
                  opacity="0.9"
                />
              );
            });
          })}
        </g>

        {/* 7b. DANGER / BLOCKED HAZARD ROUTE (Red Path) */}
        <g id="danger-path-layer">
          {mapData.dangerPathNodes.map((node) => {
            const [x1, y1] = worldToSvg(node.position[0], node.position[2]);
            return node.connectedTo.map((targetId) => {
              const targetNode = mapData.dangerPathNodes.find((n) => n.id === targetId);
              if (!targetNode) return null;
              const [x2, y2] = worldToSvg(targetNode.position[0], targetNode.position[2]);
              return (
                <g key={`danger_${node.id}_${targetId}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#ef4444"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeDasharray="5 3"
                    filter="url(#hazard-glow)"
                    opacity="0.9"
                  />
                  {/* Midpoint caution skull / cross icon */}
                  {!isMini && (
                    <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                      <circle cx="0" cy="0" r="4.5" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" />
                      <text x="0" y="2.5" fill="#fca5a5" fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        ✕
                      </text>
                    </g>
                  )}
                </g>
              );
            });
          })}
          {/* Danger Path Nodes */}
          {mapData.dangerPathNodes.map((node) => {
            const [nx, ny] = worldToSvg(node.position[0], node.position[2]);
            return (
              <g key={`dpad_${node.id}`} transform={`translate(${nx}, ${ny})`}>
                <rect x="-3" y="-3" width="6" height="6" fill="#dc2626" stroke="#fecaca" strokeWidth="1" rx="1" />
                {!isMini && node.label && (
                  <text x="0" y="9" fill="#f87171" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    {node.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* 8. HAZARD DANGER ZONES (Fire, Smoke, Gas, Electrical) */}
        <g id="hazards-layer">
          {mapData.hazards.map((haz) => {
            const [hx, hz] = worldToSvg(haz.position[0], haz.position[2]);
            const rPx = (haz.radius / worldWidth) * svgWidth;
            const isFire = haz.type === 'fire';
            const isSmoke = haz.type === 'smoke';
            const isElectrical = haz.type === 'electrical_arc';

            return (
              <g key={haz.id}>
                <circle
                  cx={hx}
                  cy={hz}
                  r={rPx}
                  fill={isFire ? '#ef4444' : isSmoke ? '#78716c' : isElectrical ? '#f59e0b' : '#eab308'}
                  fillOpacity="0.35"
                  stroke={isFire ? '#f87171' : isSmoke ? '#a8a29e' : '#fbbf24'}
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  filter="url(#hazard-glow)"
                />
                <circle
                  cx={hx}
                  cy={hz}
                  r="3.5"
                  fill={isFire ? '#dc2626' : isSmoke ? '#57534e' : '#d97706'}
                />
              </g>
            );
          })}
        </g>

        {/* 9. CHECKPOINTS & ASSEMBLY MUSTER STATION */}
        <g id="checkpoints-layer">
          {checkpoints.map((cp, idx) => {
            const [cx, cz] = worldToSvg(cp.position[0], cp.position[2]);
            const isReached = cp.reached;
            const isActive = activeCheckpoint?.id === cp.id;
            const isMuster = cp.requiredAction === 'muster' || idx === checkpoints.length - 1;
            const isUpper = cp.position[1] > 1.8;
            const radiusPx = (cp.radius / worldWidth) * svgWidth;
            const isDimmed = activeFloor !== 'all' && ((activeFloor === 1 && !isUpper) || (activeFloor === 0 && isUpper));

            return (
              <g key={cp.id} transform={`translate(${cx}, ${cz})`} opacity={isDimmed ? 0.35 : 1}>
                {/* Safe zone boundary capture perimeter */}
                {!isMini && (
                  <circle
                    cx="0"
                    cy="0"
                    r={radiusPx}
                    fill={isReached ? 'rgba(34, 197, 94, 0.08)' : isActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(148, 163, 184, 0.05)'}
                    stroke={isReached ? '#22c55e' : isActive ? '#38bdf8' : '#64748b'}
                    strokeWidth="1"
                    strokeDasharray="3 2"
                  />
                )}

                {isActive && (
                  <circle
                    cx="0"
                    cy="0"
                    r="12"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                    className="animate-spin"
                  />
                )}
                <circle
                  cx="0"
                  cy="0"
                  r={isMuster ? '8' : '6.5'}
                  fill={isReached ? '#22c55e' : isActive ? '#0284c7' : '#475569'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="2.5"
                  fill="#ffffff"
                  fontSize="7.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {isMuster ? '★' : idx + 1}
                </text>

                {/* Floor Level Label Badge in Full Tactical Map */}
                {!isMini && (
                  <text
                    x="0"
                    y={isMuster ? -11 : -9}
                    fill={isUpper ? '#c7d2fe' : '#94a3b8'}
                    fontSize="6.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {isUpper ? '1F' : 'G'}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* 9b. EMERGENCY HEALTH CARE CENTER & TRIAGE STATION AT ASSEMBLY GOAL */}
        {(() => {
          const hcc = mapData.healthCareCenter;
          const pos = hcc?.position || mapData.safeAssemblyPosition;
          const [hx, hz] = worldToSvg(pos[0], pos[2]);
          const hccW = (13 / worldWidth) * svgWidth;
          const hccH = (10 / worldHeight) * svgHeight;

          return (
            <g id="health-care-center-layer" transform={`translate(${hx}, ${hz})`}>
              {/* Sterile Field Marquee Tent Footprint */}
              <rect
                x={-hccW / 2}
                y={-hccH / 2}
                width={hccW}
                height={hccH}
                rx="4"
                fill="#0f172a"
                fillOpacity="0.92"
                stroke="#10b981"
                strokeWidth="1.8"
                strokeDasharray="4 2"
              />
              {/* Medical Red Cross Badge */}
              <circle cx="0" cy="0" r="10" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="-2" y="-7" width="4" height="14" fill="#ffffff" rx="0.5" />
              <rect x="-7" y="-2" width="14" height="4" fill="#ffffff" rx="0.5" />

              {/* Tent Canopy & Label */}
              {!isMini ? (
                <g transform="translate(0, 16)">
                  <rect x="-72" y="-8" width="144" height="18" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1.2" />
                  <text x="0" y="4.5" fill="#6ee7b7" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    🏥 HEALTH CARE CENTER & TRIAGE
                  </text>
                </g>
              ) : (
                <text x="0" y="14" fill="#4ade80" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  🏥 HEALTH CENTER
                </text>
              )}
            </g>
          );
        })()}

        {/* 10. REAL-TIME CHARACTER BEACON & ORIENTATION HEADING CONE */}
        <g id="character-layer" transform={`translate(${cadetSvgX}, ${cadetSvgY})`}>
          {/* Animated radar sonar pulse ring */}
          <circle
            cx="0"
            cy="0"
            r="16"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            opacity="0.6"
            className="animate-ping"
          />

          {/* Heading FOV Visual Cone showing where character is facing */}
          <g transform={`rotate(${cadetHeadingDeg})`}>
            <path
              d="M 0 0 L -12 -28 A 30 30 0 0 1 12 -28 Z"
              fill="rgba(56, 189, 248, 0.35)"
              stroke="rgba(56, 189, 248, 0.7)"
              strokeWidth="1"
            />
            {/* Forward directional arrowhead */}
            <polygon points="0,-16 -4,-9 0,-11 4,-9" fill="#38bdf8" />
          </g>

          {/* Cadet Center Dot */}
          <circle cx="0" cy="0" r="5.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
          <circle cx="0" cy="0" r="2.5" fill="#38bdf8" />

          {/* Cadet Label Badge in full map */}
          {!isMini && (
            <g transform="translate(0, 16)">
              <rect
                x="-36"
                y="-7"
                width="72"
                height="14"
                rx="7"
                fill="#0f172a"
                fillOpacity="0.9"
                stroke="#38bdf8"
                strokeWidth="1"
              />
              <text
                x="0"
                y="3"
                fill="#38bdf8"
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                YOU ({currentFloor === 1 ? '1ST FL' : 'GROUND'})
              </text>
            </g>
          )}
        </g>
      </svg>
    );
  };

  return (
    <>
      {/* --- 1. HUD CORNER MINIMAP (RADAR) --- */}
      <div className="absolute top-16 right-3 sm:right-5 z-30 pointer-events-auto flex flex-col items-end gap-1.5">
        <div className="w-48 sm:w-56 h-48 sm:h-56 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col relative group transition-all">
          {/* Minimap Header Bar */}
          <div className="h-6 px-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-400">
            <div className="flex items-center gap-1 font-bold">
              <Compass className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>GUIDANCE RADAR</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setSelectedFloor((prev) => (prev === 'auto' ? 0 : prev === 0 ? 1 : 'auto'))
                }
                title="Switch Floor view (Auto / Ground / 1st Fl)"
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold border border-slate-700 transition-colors"
              >
                {selectedFloor === 'auto'
                  ? `AUTO (${currentFloor === 1 ? '1F' : 'G'})`
                  : selectedFloor === 1
                  ? '1ST FL'
                  : 'GND'}
              </button>
              <button
                onClick={onToggleExpand}
                title="Open Full Tactical Guidance Map"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white transition-colors"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Minimap SVG Viewport */}
          <div
            onClick={onToggleExpand}
            className="flex-1 cursor-pointer relative overflow-hidden flex items-center justify-center p-1 bg-slate-950"
            title="Click to expand Tactical Map"
          >
            {renderMapContent(true)}
            {/* Quick click-to-expand overlay hint on hover */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="px-2 py-1 rounded-md bg-slate-900/90 border border-cyan-500/40 text-[9px] font-mono font-bold text-cyan-300 shadow">
                EXPAND TACTICAL MAP
              </span>
            </div>
          </div>

          {/* Minimap Footer: Live Character Coordinates & Current Floor */}
          <div className="h-5 px-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span className="truncate max-w-[120px]">
              X:{playerPosition[0].toFixed(1)} Z:{playerPosition[2].toFixed(1)}
            </span>
            <span className={currentFloor === 1 ? 'text-indigo-400 font-bold' : 'text-emerald-400 font-bold'}>
              {currentFloor === 1 ? '1ST FLOOR' : 'GROUND'}
            </span>
          </div>
        </div>
      </div>

      {/* --- 2. FULL TACTICAL GUIDANCE MAP MODAL --- */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[88vh] max-h-[820px] bg-slate-900 border border-cyan-500/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-slate-100">
                      {mapData.name} — Tactical Evacuation Blueprint
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      LIVE CADET TRACKING
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Interactive Building Blueprint, Compound Perimeter & Emergency Road Guide
                  </p>
                </div>
              </div>

              {/* Floor Switcher & Close */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 text-xs font-mono">
                  <button
                    onClick={() => setSelectedFloor('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      selectedFloor === 'all'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    All Floors
                  </button>
                  <button
                    onClick={() => setSelectedFloor(0)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      selectedFloor === 0
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Ground (L0)
                  </button>
                  <button
                    onClick={() => setSelectedFloor(1)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      selectedFloor === 1
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    1st Floor (L1)
                  </button>
                  <button
                    onClick={() => setSelectedFloor('auto')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      selectedFloor === 'auto'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Auto ({currentFloor === 1 ? '1F' : 'G'})
                  </button>
                </div>

                <button
                  onClick={onCloseExpanded || onToggleExpand}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Map Viewport & Legend Panel */}
            <div className="flex-1 relative overflow-hidden bg-slate-950 flex flex-col md:flex-row">
              {/* Map Canvas / SVG Viewport */}
              <div className="flex-1 h-full relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  }}
                >
                  {renderMapContent(false)}
                </div>

                {/* Floating Map Controls in bottom-left */}
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-xl text-xs">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                    title="Zoom In"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                    title="Zoom Out"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setZoomLevel(1);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    title="Reset Zoom & Pan"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-slate-700 mx-1" />
                  <button
                    onClick={() => setFollowCadet((f) => !f)}
                    className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 font-mono text-xs font-semibold ${
                      followCadet
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>{followCadet ? 'Tracking Cadet' : 'Free Pan'}</span>
                  </button>
                </div>

                {/* Current Cadet Position Badge */}
                <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/40 text-xs font-mono flex items-center gap-2 shadow-lg">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-slate-300">Cadet Coordinates:</span>
                  <span className="text-cyan-300 font-bold">
                    X: {playerPosition[0].toFixed(1)}, Y: {playerPosition[1].toFixed(1)}, Z:{' '}
                    {playerPosition[2].toFixed(1)}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className={currentFloor === 1 ? 'text-indigo-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {currentFloor === 1 ? '1ST FLOOR (ELEVATION 3.6m)' : 'GROUND FLOOR (ELEVATION 0m)'}
                  </span>
                </div>
              </div>

              {/* Side Legend & Navigation Insights Panel */}
              <div className="w-full md:w-72 bg-slate-900/95 border-t md:border-t-0 md:border-l border-slate-800 p-3 sm:p-4 overflow-y-auto flex flex-col justify-between text-xs font-sans">
                <div className="flex flex-col gap-3">
                  <h3 className="font-bold text-slate-200 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>Map Symbols & Guidance</span>
                  </h3>

                  {/* Legend Grid */}
                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white shadow" />
                      <span className="text-slate-200 font-semibold">Your Character (Live)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-5 h-1.5 bg-emerald-400 rounded-full shadow" />
                      <span className="text-emerald-300 font-semibold">Safe Route (Green - Stairs & Rope)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-5 h-1.5 bg-rose-500 border border-red-300 rounded-full" />
                      <span className="text-rose-400 font-semibold">Danger Route (Red - Blocked/Fire)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-300" />
                      <span className="text-rose-300">Hazard / Fire Zone</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-blue-900 border border-cyan-400 rounded-sm" />
                      <span className="text-cyan-200">Inside Stair (West Corridor)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-amber-950 border border-amber-500 rounded-sm" />
                      <span className="text-amber-200">Outside Stair (East Fire Escape)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-emerald-950 border border-emerald-400 flex items-center justify-center text-[10px]">
                        🚪
                      </div>
                      <span className="text-emerald-200 font-semibold">Doors (Wall-Fitted Swing Doors)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-400 flex items-center justify-center text-[10px]">
                        🪢
                      </div>
                      <span className="text-amber-300 font-semibold">1st Fl Emergency Rope & Ladder Exit</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-white flex items-center justify-center text-[9px] text-white">
                        +
                      </div>
                      <span className="text-rose-300">Ground Rescue Landing Pad (Cushion)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-950 border border-emerald-400 flex items-center justify-center text-[11px] text-red-400 font-bold">
                        ✚
                      </div>
                      <span className="text-emerald-300 font-bold">Health Care Center (Triage Check-Up)</span>
                    </div>
                  </div>

                  {/* Active Goal Info */}
                  {activeCheckpoint && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-800/80 border border-cyan-500/30 font-mono">
                      <span className="text-[10px] text-cyan-400 font-bold block mb-1">
                        CURRENT ACTIVE OBJECTIVE
                      </span>
                      <div className="text-slate-200 font-bold text-xs">{activeCheckpoint.name}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">{activeCheckpoint.description}</div>
                    </div>
                  )}

                  {/* Multi-Floor Evacuation Guidance Instructions */}
                  <div className="p-2.5 rounded-xl bg-slate-800/90 border border-amber-500/40 text-[10px] font-mono text-slate-300 leading-relaxed space-y-1.5">
                    <span className="font-bold block text-amber-300 text-[11px] flex items-center gap-1.5">
                      <span>⚡ 3 ESCAPE ROUTES FROM 1ST FLOOR:</span>
                    </span>
                    <p className="text-amber-200">
                      <strong>1. Unique Rope & Ladder:</strong> Head west to Balcony (Z=-2) &rarr; Fast-rope slide down ([E]) or climb down cage ladder to ground!
                    </p>
                    <p className="text-orange-200">
                      <strong>2. Outside Fire Escape:</strong> Exit east door to exterior industrial steel stair directly into muster field!
                    </p>
                    <p className="text-cyan-200">
                      <strong>3. Inside Staircase:</strong> West hallway stairs leading to ground level corridors and main entrance doors!
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
                  AEGIS AR &middot; REAL-TIME SPATIAL BLUEPRINT
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
