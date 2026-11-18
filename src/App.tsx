import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Sparkles, MapPin, Users, Trophy, Video, VideoOff, Volume2, VolumeX, Eye, HelpCircle, CheckCircle2, Map as MapIcon } from 'lucide-react';
import { CampusMapData, CampusType, CharacterCustomization, DisasterType, DrillScoreReport, PeerUser, StartingLocation } from './types';
import { CAMPUS_MAPS } from './data/maps';
import { Simulator3D } from './components/Simulator3D';
import { AROverlay } from './components/AROverlay';
import { GuidanceMap } from './components/GuidanceMap';
import { MobileControls } from './components/MobileControls';
import { CharacterCustomizer } from './components/CharacterCustomizer';
import { SocialHub } from './components/SocialHub';
import { CampusSelector } from './components/CampusSelector';
import { DebriefModal } from './components/DebriefModal';
import { StartingLocationModal } from './components/StartingLocationModal';
import { soundFX } from './utils/audio';

const DEFAULT_CUSTOMIZATION: CharacterCustomization = {
  name: 'Cadet Riley',
  role: 'Student',
  gender: 'neutral',
  clothingStyle: 'padded_vest',
  clothingColor: '#557a46',
  skinTone: '#f8d9b6',
  hairColor: '#1e293b',
  hairStyle: 'stylish',
  equipment: {
    headgear: 'none',
    vest: 'none',
    backpack: 'none',
    tool: 'flashlight',
  },
  hasGlasses: false,
};

export default function App() {
  // Navigation & Modals
  const [selectedCampus, setSelectedCampus] = useState<CampusType>('school');
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType>('fire');
  const [isCampusModalOpen, setIsCampusModalOpen] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [isSocialOpen, setIsSocialOpen] = useState<boolean>(false);
  const [isStartLocationModalOpen, setIsStartLocationModalOpen] = useState<boolean>(false);
  const [selectedStartLocationId, setSelectedStartLocationId] = useState<string>('');
  const [debriefReport, setDebriefReport] = useState<DrillScoreReport | null>(null);

  // Character Customization
  const [customization, setCustomization] = useState<CharacterCustomization>(() => {
    const saved = localStorage.getItem('aegis_ar_character');
    return saved ? JSON.parse(saved) : DEFAULT_CUSTOMIZATION;
  });

  // Simulator controls & views
  const [isARMode, setIsARMode] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [flashlightEnabled, setFlashlightEnabled] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'third' | 'first' | 'tactical'>('third');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Movement input
  const [movementInput, setMovementInput] = useState({
    x: 0,
    y: 0,
    isSprinting: false,
    isCrouching: false,
    interact: false,
    jump: false,
  });

  // Real-time Simulation Stats
  const [simStats, setSimStats] = useState({
    elapsedTime: 0,
    health: 100,
    smokeInhalation: 0,
    stamina: 100,
    currentScore: 0,
    nearestCheckpointDist: 0,
    compassHeading: 0,
    currentFloor: 1,
    targetAngle: 0,
    playerPosition: CAMPUS_MAPS[selectedCampus].initialPlayerPosition,
    playerRotation: 0,
  });

  // Guidance Map Fullscreen view toggle
  const [isGuidanceMapExpanded, setIsGuidanceMapExpanded] = useState<boolean>(false);

  // Drill session key for full clean restart / retry
  const [drillSession, setDrillSession] = useState<number>(0);

  // Current map data and starting origin location
  const mapData = CAMPUS_MAPS[selectedCampus];
  const currentStartLocation =
    mapData.startingLocations?.find(l => l.id === selectedStartLocationId) ||
    mapData.startingLocations?.[0];
  const currentSpawnPosition: [number, number, number] = currentStartLocation
    ? currentStartLocation.position
    : mapData.initialPlayerPosition;
  const [checkpoints, setCheckpoints] = useState(mapData.checkpoints);
  const completedCount = checkpoints.filter(c => c.reached).length;
  const activeCheckpoint = checkpoints.find(c => !c.reached);

  // Solo cadet simulation (no other character NPCs)
  const peers: PeerUser[] = [];

  // Handle AR Mode toggle with Camera API
  const handleToggleAR = async () => {
    if (!isARMode) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          setCameraStream(stream);
        }
      } catch (err) {
        console.warn('Camera stream inaccessible, using synthetic AR spatial passthrough mode:', err);
      }
      setIsARMode(true);
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setIsARMode(false);
    }
  };

  // Cycle Camera View Mode (Third person -> First person -> Tactical drone overview)
  const handleCycleViewMode = () => {
    setViewMode((prev) => {
      if (prev === 'third') return 'first';
      if (prev === 'first') return 'tactical';
      return 'third';
    });
  };

  // Sound mute toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundFX.setMuted(nextMuted);
  };

  // Checkpoint reached event
  const handleCheckpointReached = (index: number, points: number) => {
    setCheckpoints(prev => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], reached: true };
      return next;
    });
  };

  // Drill completed event
  const handleDrillComplete = (report: DrillScoreReport) => {
    setDebriefReport(report);

    // Save to local leaderboard
    try {
      const saved = localStorage.getItem('aegis_ar_leaderboard');
      const list = saved ? JSON.parse(saved) : [];
      const newEntry = {
        id: 'user_run_' + Date.now(),
        playerName: report.playerName,
        campusId: selectedCampus,
        disasterType: selectedDisaster,
        score: report.totalScore,
        timeSeconds: report.completionTimeSeconds,
        efficiency: report.evacuationEfficiency,
        grade: report.grade,
        role: report.characterRole,
        date: 'Just now',
        isSelf: true,
      };
      const updated = [newEntry, ...list].sort((a, b) => b.score - a.score);
      localStorage.setItem('aegis_ar_leaderboard', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleRestartDrill = () => {
    setDebriefReport(null);
    setCheckpoints(mapData.checkpoints.map(c => ({ ...c, reached: false })));
    setSimStats({
      elapsedTime: 0,
      health: 100,
      smokeInhalation: 0,
      stamina: 100,
      currentScore: 0,
      nearestCheckpointDist: 0,
      compassHeading: 0,
      currentFloor: currentStartLocation ? currentStartLocation.floorLevel : (mapData.initialPlayerPosition[1] > 1.8 ? 1 : 0),
      targetAngle: 0,
      playerPosition: currentSpawnPosition,
      playerRotation: 0,
    });
    setDrillSession(prev => prev + 1);
  };

  // Select new character origin/start location in the building
  const handleSelectStartLocation = (location: StartingLocation) => {
    setSelectedStartLocationId(location.id);
    setIsStartLocationModalOpen(false);
    window.dispatchEvent(
      new CustomEvent('aegis:setSpawnLocation', {
        detail: { position: location.position, name: location.name },
      })
    );
    setSimStats(prev => ({
      ...prev,
      playerPosition: location.position,
      currentFloor: location.floorLevel,
    }));
  };

  // Save character changes
  const handleSaveCharacter = () => {
    localStorage.setItem('aegis_ar_character', JSON.stringify(customization));
  };

  // Reset checkpoints and starting location when campus changes
  useEffect(() => {
    const campusMap = CAMPUS_MAPS[selectedCampus];
    setCheckpoints(campusMap.checkpoints.map(c => ({ ...c, reached: false })));
    const firstLoc = campusMap.startingLocations?.[0];
    if (firstLoc) {
      setSelectedStartLocationId(firstLoc.id);
      setSimStats(prev => ({
        ...prev,
        playerPosition: firstLoc.position,
        currentFloor: firstLoc.floorLevel,
      }));
    } else {
      setSelectedStartLocationId('');
      setSimStats(prev => ({
        ...prev,
        playerPosition: campusMap.initialPlayerPosition,
        currentFloor: campusMap.initialPlayerPosition[1] > 1.8 ? 1 : 0,
      }));
    }
  }, [selectedCampus]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* Top Application Bar */}
      <header className="absolute top-0 inset-x-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
        {/* Logo & App Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Shield className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-slate-100 flex items-center gap-1.5">
                AegisAR
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-mono font-normal">
                  3D DRILL
                </span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Disaster Evacuation & Spatial Training System
            </span>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Campus Map Selector Button */}
          <button
            onClick={() => setIsCampusModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[80px] sm:max-w-none truncate">{mapData.name}</span>
          </button>

          {/* Starting Origin Room Button */}
          <button
            onClick={() => setIsStartLocationModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-cyan-500/40 text-xs font-semibold text-cyan-300 transition-all shadow-sm"
            title="Choose character starting origin location in building"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[75px] sm:max-w-[130px] truncate">
              {currentStartLocation?.roomName || 'Start Room'}
            </span>
          </button>

          {/* Tactical Guidance Map Button */}
          <button
            onClick={() => setIsGuidanceMapExpanded(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-cyan-500/40 text-xs font-semibold text-cyan-300 transition-all shadow-sm"
            title="Open Tactical Guidance Map (Building Blueprint, Character Location, Compound & Road)"
          >
            <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Guidance Map</span>
          </button>

          {/* Character Gear Customizer Button */}
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Cadet Gear</span>
          </button>

          {/* Social Leaderboard & Chat */}
          <button
            onClick={() => setIsSocialOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Leaderboard & Radio</span>
          </button>
        </div>
      </header>

      {/* 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 pt-14">
        <Simulator3D
          key={`${selectedCampus}_${selectedDisaster}_${drillSession}`}
          mapData={mapData}
          disasterType={selectedDisaster}
          customization={customization}
          isARMode={isARMode}
          cameraStream={cameraStream}
          onDrillComplete={handleDrillComplete}
          onCheckpointReached={handleCheckpointReached}
          movementInput={movementInput}
          flashlightEnabled={flashlightEnabled}
          viewMode={viewMode}
          onStatsUpdate={setSimStats}
          startPosition={currentSpawnPosition}
        />

        {/* Holographic AR Overlay (Compass, Objectives, Vitals, Path Legend) */}
        <AROverlay
          mapData={mapData}
          isARMode={isARMode}
          onToggleAR={handleToggleAR}
          viewMode={viewMode}
          onCycleViewMode={handleCycleViewMode}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onRestartDrill={handleRestartDrill}
          onToggleGuidanceMap={() => setIsGuidanceMapExpanded(prev => !prev)}
          stats={simStats}
          activeCheckpoint={activeCheckpoint}
          completedCheckpointsCount={completedCount}
          totalCheckpointsCount={checkpoints.length}
          peers={peers}
          onOpenDebrief={() => debriefReport && setDebriefReport(debriefReport)}
          currentStartLocationName={currentStartLocation?.roomName || currentStartLocation?.name}
          onOpenStartLocationModal={() => setIsStartLocationModalOpen(true)}
        />

        {/* Interactive Guidance Map (HUD Radar & Full Tactical Blueprint Modal) */}
        <GuidanceMap
          mapData={mapData}
          playerPosition={simStats.playerPosition || mapData.initialPlayerPosition}
          playerRotation={simStats.playerRotation || 0}
          currentFloor={simStats.currentFloor}
          activeCheckpoint={activeCheckpoint}
          checkpoints={checkpoints}
          isExpanded={isGuidanceMapExpanded}
          onToggleExpand={() => setIsGuidanceMapExpanded(prev => !prev)}
          onCloseExpanded={() => setIsGuidanceMapExpanded(false)}
        />

        {/* On-Screen Mobile Joystick & Stance Controls */}
        <MobileControls
          onMovementChange={setMovementInput}
          flashlightEnabled={flashlightEnabled}
          onToggleFlashlight={() => setFlashlightEnabled(prev => !prev)}
        />
      </div>

      {/* Campus & Scenario Selector Modal */}
      {isCampusModalOpen && (
        <CampusSelector
          currentCampus={selectedCampus}
          currentDisaster={selectedDisaster}
          selectedStartLocationId={selectedStartLocationId}
          onSelectCampus={(camp) => {
            setSelectedCampus(camp);
            const firstLoc = CAMPUS_MAPS[camp].startingLocations?.[0];
            if (firstLoc) setSelectedStartLocationId(firstLoc.id);
            setIsCampusModalOpen(false);
          }}
          onSelectDisaster={(dis) => {
            setSelectedDisaster(dis);
            setIsCampusModalOpen(false);
          }}
          onSelectStartLocation={handleSelectStartLocation}
          onClose={() => setIsCampusModalOpen(false)}
        />
      )}

      {/* Origin Starting Location in Building Modal */}
      {isStartLocationModalOpen && (
        <StartingLocationModal
          mapData={mapData}
          currentLocationId={currentStartLocation?.id || ''}
          onSelectLocation={handleSelectStartLocation}
          onClose={() => setIsStartLocationModalOpen(false)}
        />
      )}

      {/* Character Gear Customization Modal */}
      {isCustomizerOpen && (
        <CharacterCustomizer
          customization={customization}
          onChange={setCustomization}
          onSave={handleSaveCharacter}
          onClose={() => setIsCustomizerOpen(false)}
        />
      )}

      {/* Social Hub (Leaderboard & Community Drill Radio) */}
      {isSocialOpen && (
        <SocialHub
          currentScore={simStats.currentScore}
          playerName={customization.name}
          playerRole={customization.role}
          onClose={() => setIsSocialOpen(false)}
        />
      )}

      {/* Post-Drill Evaluation Debrief Modal */}
      {debriefReport && (
        <DebriefModal
          report={debriefReport}
          onRestart={handleRestartDrill}
          onOpenLeaderboard={() => {
            setDebriefReport(null);
            setIsSocialOpen(true);
          }}
          onClose={() => setDebriefReport(null)}
        />
      )}
    </div>
  );
}
