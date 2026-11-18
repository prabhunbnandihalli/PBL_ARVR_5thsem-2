import React from 'react';
import { MapPin, Shuffle, Check, ArrowRight, ShieldAlert, Sparkles, X, Layers } from 'lucide-react';
import { CampusMapData, StartingLocation } from '../types';

interface StartingLocationModalProps {
  mapData: CampusMapData;
  currentLocationId: string;
  onSelectLocation: (location: StartingLocation) => void;
  onClose: () => void;
}

export const StartingLocationModal: React.FC<StartingLocationModalProps> = ({
  mapData,
  currentLocationId,
  onSelectLocation,
  onClose,
}) => {
  const locations: StartingLocation[] = mapData.startingLocations || [
    {
      id: 'default_start',
      name: 'Default Origin Point',
      roomName: mapData.rooms[0]?.name || 'Origin Room',
      floorLevel: mapData.initialPlayerPosition[1] > 1.8 ? 1 : 0,
      floorLabel: mapData.initialPlayerPosition[1] > 1.8 ? '1st Floor (Upper)' : 'Ground Floor',
      position: mapData.initialPlayerPosition,
      description: 'Standard drill starting location.',
      difficulty: 'Moderate',
      recommendedRoute: 'Follow illuminated safe green pathway.',
    },
  ];

  const handleRandomSelect = () => {
    const unpicked = locations.filter((l) => l.id !== currentLocationId);
    const pool = unpicked.length > 0 ? unpicked : locations;
    const random = pool[Math.floor(Math.random() * pool.length)];
    if (random) {
      onSelectLocation(random);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-4 sm:p-6 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider block">
                ORIGIN SPATIAL SIMULATION
              </span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                {locations.length} ROOMS AVAILABLE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
              Choose Character Starting Location
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select any classroom, laboratory, or corridor in <span className="text-slate-200 font-semibold">{mapData.name}</span> to practice evacuation from different origin points.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Random Action Bar */}
        <div className="mb-4 flex items-center justify-between bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/60">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Test unprepared emergency readiness from an unknown origin:</span>
          </div>
          <button
            onClick={handleRandomSelect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Pick Random Room</span>
          </button>
        </div>

        {/* Starting Locations Grid */}
        <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
          {locations.map((loc) => {
            const isSelected = loc.id === currentLocationId;
            const isUpper = loc.floorLevel === 1;

            return (
              <div
                key={loc.id}
                onClick={() => onSelectLocation(loc)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-cyan-600/15 border-cyan-400 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                        isUpper
                          ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      <Layers className="w-2.5 h-2.5 inline mr-1" />
                      {loc.floorLabel}
                    </span>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        loc.difficulty === 'Easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : loc.difficulty === 'Moderate'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {loc.difficulty}
                    </span>

                    <span className="text-[10px] font-mono text-slate-400">
                      Coordinates: [{loc.position[0]}, {loc.position[1]}, {loc.position[2]}]
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{loc.name}</span>
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {loc.description}
                  </p>

                  <div className="mt-2 text-[11px] font-mono text-cyan-300/90 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    <span>Route: {loc.recommendedRoute}</span>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex items-center justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLocation(loc);
                    }}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>CURRENT SPAWN</span>
                      </>
                    ) : (
                      <span>SPAWN HERE</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-4 text-[11px] font-mono text-slate-400">
          <span>Character will instantly spawn in selected room with updated HUD & Guidance Map</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
