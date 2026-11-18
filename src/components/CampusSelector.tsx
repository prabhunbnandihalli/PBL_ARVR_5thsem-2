import React from 'react';
import { School, GraduationCap, Building2, Flame, AlertOctagon, Activity, Sparkles, MapPin, Clock } from 'lucide-react';
import { CampusMapData, CampusType, DisasterType } from '../types';
import { CAMPUS_MAPS } from '../data/maps';

interface CampusSelectorProps {
  currentCampus: CampusType;
  currentDisaster: DisasterType;
  selectedStartLocationId?: string;
  onSelectCampus: (campus: CampusType) => void;
  onSelectDisaster: (disaster: DisasterType) => void;
  onSelectStartLocation?: (location: any) => void;
  onClose: () => void;
}

export const CampusSelector: React.FC<CampusSelectorProps> = ({
  currentCampus,
  currentDisaster,
  selectedStartLocationId,
  onSelectCampus,
  onSelectDisaster,
  onSelectStartLocation,
  onClose,
}) => {
  const activeMapData = CAMPUS_MAPS[currentCampus];
  const startingLocations = activeMapData.startingLocations || [];
  const campuses: { id: CampusType; icon: any; difficulty: string; time: string }[] = [
    { id: 'school', icon: School, difficulty: 'Cadet (Introductory)', time: '2 mins' },
    { id: 'college', icon: GraduationCap, difficulty: 'Intermediate (Multi-Wing)', time: '2.5 mins' },
    { id: 'university', icon: Building2, difficulty: 'Advanced (Complex Atrium)', time: '3 mins' },
  ];

  const disasters: { id: DisasterType; label: string; icon: any; desc: string; color: string }[] = [
    {
      id: 'fire',
      label: 'Flash Fire & Smoke',
      icon: Flame,
      desc: 'Ceiling smoke layer requires low crawling; burning corridors block main exits.',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'earthquake',
      label: 'Seismic Earthquake & Debris',
      icon: Activity,
      desc: 'Shattered ceiling beams, fallen furniture obstacles, and floor fissures.',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    },
    {
      id: 'chemical',
      label: 'Toxic Chemical / Gas Spill',
      icon: AlertOctagon,
      desc: 'Corrosive vapors from science lab rupture; requires sealed doors and gas filters.',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-5 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider block">
              CAMPUS LAYOUT & EMERGENCY PROTOCOL
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
              Select Disaster Evacuation Scenario
            </h2>
            <p className="text-xs text-slate-400">
              Choose an educational institution layout and specific emergency threat to simulate.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Campuses List */}
        <div className="space-y-3 mb-6">
          <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            1. Choose Educational Institution Campus
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {campuses.map((c) => {
              const data = CAMPUS_MAPS[c.id];
              const Icon = c.icon;
              const isSelected = currentCampus === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCampus(c.id)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-cyan-600/15 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`p-2 rounded-xl ${
                          isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {c.time}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100">{data.name}</h3>
                    <p className="text-[11px] text-cyan-300/80 font-mono mt-0.5">{data.subtitle}</p>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {data.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">{c.difficulty}</span>
                    <span className={`font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`}>
                      {isSelected ? 'SELECTED' : 'SELECT'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Disaster Type List */}
        <div className="space-y-3 mb-6">
          <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            2. Disaster Scenario Threat
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {disasters.map((d) => {
              const Icon = d.icon;
              const isSelected = currentDisaster === d.id;

              return (
                <button
                  key={d.id}
                  onClick={() => onSelectDisaster(d.id)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400 ring-1 ring-cyan-400'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl border ${d.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-100">{d.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{d.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Starting Location in Building */}
        {startingLocations.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                3. Character Origin Location in Building ({startingLocations.length} Rooms)
              </span>
              <span className="text-[10px] text-cyan-400 font-mono font-normal">
                Click room to change start point
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {startingLocations.map((loc) => {
                const isSelected = selectedStartLocationId ? loc.id === selectedStartLocationId : loc.position === activeMapData.initialPlayerPosition;

                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => onSelectStartLocation?.(loc)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 ring-1 ring-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                            loc.floorLevel === 1
                              ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {loc.floorLabel}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold ${
                            loc.difficulty === 'Easy'
                              ? 'text-emerald-400'
                              : loc.difficulty === 'Moderate'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {loc.difficulty}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100">{loc.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {loc.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500 truncate max-w-[120px]">{loc.roomName}</span>
                      <span className={`font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`}>
                        {isSelected ? '✓ ACTIVE' : 'SELECT'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all text-center"
          >
            Launch Selected Campus Drill
          </button>
        </div>
      </div>
    </div>
  );
};
