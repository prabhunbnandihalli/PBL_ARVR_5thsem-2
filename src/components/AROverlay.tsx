import React from 'react';
import {
  Shield,
  AlertTriangle,
  Wind,
  Heart,
  Compass,
  CheckCircle2,
  Navigation,
  Flame,
  Volume2,
  VolumeX,
  Eye,
  Video,
  VideoOff,
  RotateCcw,
  ArrowUp,
  Map as MapIcon,
  MapPin,
} from 'lucide-react';
import { CampusMapData, Checkpoint, PeerUser } from '../types';

interface AROverlayProps {
  mapData: CampusMapData;
  isARMode: boolean;
  onToggleAR: () => void;
  viewMode: 'third' | 'first' | 'tactical';
  onCycleViewMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onRestartDrill?: () => void;
  onToggleGuidanceMap?: () => void;
  stats: {
    elapsedTime: number;
    health: number;
    smokeInhalation: number;
    stamina: number;
    currentScore: number;
    nearestCheckpointDist: number;
    compassHeading: number;
    currentFloor: number;
    targetAngle: number;
    playerPosition?: [number, number, number];
    playerRotation?: number;
  };
  activeCheckpoint?: Checkpoint;
  completedCheckpointsCount: number;
  totalCheckpointsCount: number;
  peers: PeerUser[];
  onOpenDebrief?: () => void;
  currentStartLocationName?: string;
  onOpenStartLocationModal?: () => void;
}

export const AROverlay: React.FC<AROverlayProps> = ({
  mapData,
  isARMode,
  onToggleAR,
  viewMode,
  onCycleViewMode,
  isMuted,
  onToggleMute,
  onRestartDrill,
  onToggleGuidanceMap,
  stats,
  activeCheckpoint,
  completedCheckpointsCount,
  totalCheckpointsCount,
  peers,
  currentStartLocationName,
  onOpenStartLocationModal,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCompassDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(deg / 45) % 8;
    return directions[idx];
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Top HUD: Status, Compass & Navigation Header */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Campus and Scenario Banner */}
          <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-emerald-500/40 rounded-xl px-3 py-1.5 shadow-lg shadow-emerald-950/30">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <span className="text-[10px] font-mono tracking-wider text-emerald-400 font-semibold block uppercase">
                {isARMode ? 'AR SPATIAL DRILL' : 'SIMULATOR MODE'}
              </span>
              <h1 className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[150px] sm:max-w-xs">
                {mapData.name}
              </h1>
            </div>
          </div>

          {/* Compass & Heading Widget */}
          <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 shadow-lg">
            <Compass className="w-4 h-4 text-cyan-400" />
            <div className="text-center">
              <div className="text-[10px] text-slate-400 font-mono">HEADING</div>
              <div className="text-xs font-bold text-slate-200 font-mono">
                {stats.compassHeading}° {getCompassDirection(stats.compassHeading)}
              </div>
            </div>
          </div>

          {/* Timer & Live Score */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-900/85 backdrop-blur-md border border-amber-500/40 rounded-xl px-3 py-1.5 shadow-lg text-right">
              <span className="text-[10px] font-mono text-amber-400 font-semibold block">ELAPSED</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-300">
                {formatTime(stats.elapsedTime)}
              </span>
            </div>

            <div className="bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3 py-1.5 shadow-lg text-right">
              <span className="text-[10px] font-mono text-cyan-400 font-semibold block">PTS</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-cyan-200">
                {stats.currentScore}
              </span>
            </div>

            {/* Quick Control buttons */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              {/* Character Starting Location Selector Button */}
              {onOpenStartLocationModal && (
                <button
                  type="button"
                  onClick={onOpenStartLocationModal}
                  title="Change Character Origin / Starting Room in Building"
                  className="px-2.5 py-1.5 rounded-xl border border-cyan-500/50 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="max-w-[100px] sm:max-w-[140px] truncate">
                    {currentStartLocationName || 'Origin Room'}
                  </span>
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-200 px-1 py-0.2 rounded font-sans">
                    Change ▾
                  </span>
                </button>
              )}

              {/* Floor Switcher Button */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aegis:switchFloor'))}
                title="Switch Floor: 1st Floor / Ground Floor (Key: F)"
                className={`px-2.5 py-1.5 rounded-xl border font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md ${
                  stats.currentFloor === 1
                    ? 'bg-indigo-600/90 hover:bg-indigo-500 text-white border-indigo-400 shadow-indigo-500/20'
                    : 'bg-emerald-700/90 hover:bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/20'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>{stats.currentFloor === 1 ? '1ST FLOOR (UPPER)' : 'GROUND FLOOR (LVL 0)'}</span>
                <span className="text-[9px] opacity-75 hidden sm:inline">(F)</span>
              </button>

              <button
                onClick={onToggleAR}
                title={isARMode ? 'Disable AR Passthrough' : 'Enable AR Camera Passthrough'}
                className={`p-2 rounded-xl transition-all border ${
                  isARMode
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {isARMode ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              <button
                onClick={onCycleViewMode}
                title={`Current view: ${viewMode}. Click to switch.`}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aegis:recenterCamera'))}
                title="Recenter Camera Behind Cadet (R)"
                className="p-2 rounded-xl bg-slate-800/80 text-cyan-300 border border-slate-700 hover:bg-slate-700 hover:text-cyan-200 transition-all"
              >
                <Navigation className="w-4 h-4" />
              </button>

              <button
                onClick={onToggleMute}
                title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {onToggleGuidanceMap && (
                <button
                  onClick={onToggleGuidanceMap}
                  title="Open Tactical Guidance Map (Building Blueprint & Character Location)"
                  className="p-2 rounded-xl bg-slate-800/80 text-cyan-300 border border-slate-700 hover:bg-slate-700 hover:text-cyan-200 transition-all shadow-sm"
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              )}

              {onRestartDrill && (
                <button
                  onClick={onRestartDrill}
                  title="Retry / Restart Drill From Beginning"
                  className="p-2 rounded-xl bg-slate-800/80 text-amber-300 border border-slate-700 hover:bg-slate-700 hover:text-amber-200 transition-all shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Current Objective & Active Checkpoint Card with Dynamic Navigation Arrow Guidance */}
        {activeCheckpoint && (
          <div className="self-start max-w-md bg-slate-900/90 backdrop-blur-md border-l-4 border-cyan-400 rounded-r-xl p-2.5 shadow-xl border-y border-r border-slate-800 pointer-events-auto">
            <div className="flex items-center justify-between gap-3 text-xs mb-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold font-mono">
                <Navigation className="w-3.5 h-3.5 animate-pulse" />
                <span>OBJECTIVE {completedCheckpointsCount + 1}/{totalCheckpointsCount}</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                +{activeCheckpoint.points} PTS
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-100">{activeCheckpoint.name}</h2>
            <p className="text-[11px] text-slate-300 leading-snug mt-0.5">{activeCheckpoint.description}</p>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-cyan-300 font-mono">
              <span>Distance to Beacon:</span>
              <span className="font-bold text-slate-100">{stats.nearestCheckpointDist}m</span>
              {activeCheckpoint.requiredAction === 'low_crawl' && (
                <span className="text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 text-[10px]">
                  Requires Low Crawl
                </span>
              )}
            </div>

            {/* Dynamic Real-Time Directional Navigation Arrow Guidance */}
            <div className="flex items-center gap-2.5 mt-2 pt-2 border-t border-slate-800/80">
              <div
                className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm transition-transform duration-200"
                style={{
                  transform: `rotate(${Math.round(
                    ((stats.targetAngle ?? stats.compassHeading) - stats.compassHeading + 360) % 360
                  )}deg)`,
                }}
                title="Direction to active objective relative to camera heading"
              >
                <ArrowUp className="w-4 h-4 font-bold stroke-[3]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-emerald-300 font-bold tracking-wide flex items-center gap-1">
                  <span>NAVIGATION GUIDANCE ARROW</span>
                  <span className="text-slate-500">•</span>
                  <span>{stats.nearestCheckpointDist}m</span>
                </span>
                <span className="text-[9px] text-slate-400">
                  Follow the 3D dynamic guide arrow & illuminated green floor arrows
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center AR Reticle & Spatial Crosshairs (in AR Mode or First person) */}
      {(isARMode || viewMode === 'first') && (
        <div className="self-center flex flex-col items-center justify-center opacity-60">
          <div className="w-16 h-16 border-2 border-dashed border-cyan-400/70 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-[9px] font-mono text-cyan-300 tracking-widest mt-1">AR EVAC RETICLE</span>
        </div>
      )}

      {/* Bottom HUD: Vitals Bar, Smoke Inhalation, Path Legend & Peer Squad Status */}
      <div className="w-full flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
        {/* Vitals and Physical Meters */}
        <div className="w-full sm:w-80 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {/* Health */}
            <div className="bg-slate-800/60 rounded-xl p-1.5 border border-slate-700/50">
              <div className="flex items-center justify-center gap-1 text-rose-400 text-[10px] font-mono font-semibold">
                <Heart className="w-3 h-3" />
                <span>HEALTH</span>
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">{stats.health}%</div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-300 ${
                    stats.health > 50 ? 'bg-emerald-500' : stats.health > 25 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                  }`}
                  style={{ width: `${stats.health}%` }}
                />
              </div>
            </div>

            {/* Smoke / Gas Inhalation */}
            <div className="bg-slate-800/60 rounded-xl p-1.5 border border-slate-700/50">
              <div className="flex items-center justify-center gap-1 text-amber-400 text-[10px] font-mono font-semibold">
                <Wind className="w-3 h-3" />
                <span>SMOKE</span>
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">{stats.smokeInhalation}%</div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${stats.smokeInhalation}%` }}
                />
              </div>
            </div>

            {/* Stamina */}
            <div className="bg-slate-800/60 rounded-xl p-1.5 border border-slate-700/50">
              <div className="flex items-center justify-center gap-1 text-cyan-400 text-[10px] font-mono font-semibold">
                <Shield className="w-3 h-3" />
                <span>STAMINA</span>
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">{stats.stamina}%</div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${stats.stamina}%` }}
                />
              </div>
            </div>
          </div>

          {/* AR Path Guide Legend */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow shadow-emerald-400/50" />
              <span className="text-emerald-300 font-medium">Green: Safe Evac Path</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow shadow-rose-500/50" />
              <span className="text-rose-300 font-medium">Red: Fire & Hazard</span>
            </div>
          </div>
        </div>

        {/* Multi-Floor Escape Strategy Card (1 Inside Stair + 1 Outside Stair) */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 rounded-2xl p-2.5 shadow-2xl max-w-sm pointer-events-auto">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono font-bold text-indigo-300 border-b border-slate-800 pb-1 mb-1.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              STAIR ROUTE SELECTION
            </span>
            <span className="text-emerald-400 font-semibold">1 INSIDE &middot; 1 OUTSIDE</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
            <div className="bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
              <span className="text-amber-400 font-bold block">1 INSIDE STAIR</span>
              <span className="text-slate-300 text-[9px]">Interior West Stair (Floor Transit)</span>
            </div>
            <div className="bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
              <span className="text-cyan-400 font-bold block">1 OUTSIDE STAIR</span>
              <span className="text-slate-300 text-[9px]">Exterior East Stair to Field</span>
            </div>
          </div>
          <div className="mt-1.5 text-[9px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/80 pt-1">
            <span className="text-amber-300 font-semibold">Cadet Choice:</span>
            <span className="text-slate-200">Inside Descent or Outside Fire Stairs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
