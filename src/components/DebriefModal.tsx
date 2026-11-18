import React from 'react';
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Award,
  RotateCcw,
  Share2,
  Users,
  Star,
  Skull,
  Activity,
  HeartCrack,
} from 'lucide-react';
import { DrillScoreReport } from '../types';

interface DebriefModalProps {
  report: DrillScoreReport;
  onRestart: () => void;
  onOpenLeaderboard: () => void;
  onClose: () => void;
}

export const DebriefModal: React.FC<DebriefModalProps> = ({
  report,
  onRestart,
  onOpenLeaderboard,
  onClose,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S':
        return 'from-amber-400 to-yellow-500 text-slate-950 border-amber-300 shadow-amber-500/50';
      case 'A':
        return 'from-emerald-400 to-teal-500 text-slate-950 border-emerald-300 shadow-emerald-500/50';
      case 'B':
        return 'from-cyan-400 to-blue-500 text-slate-950 border-cyan-300 shadow-cyan-500/50';
      case 'C':
        return 'from-orange-400 to-amber-600 text-slate-950 border-orange-300 shadow-orange-500/50';
      case 'D':
        return 'from-rose-500 to-red-700 text-white border-rose-400 shadow-rose-500/50';
      default:
        return 'from-red-600 to-rose-950 text-white border-red-500 shadow-red-600/60 ring-2 ring-red-500/50';
    }
  };

  const isCasualty = report.isCasualty || report.grade === 'F' || report.safetyScore <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className={`w-full max-w-2xl bg-slate-900 border rounded-3xl shadow-2xl overflow-hidden flex flex-col p-5 sm:p-7 ${
        isCasualty ? 'border-rose-700/80 ring-1 ring-rose-500/30' : 'border-slate-800'
      }`}>
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider block ${
              isCasualty ? 'text-rose-400' : 'text-cyan-400'
            }`}>
              {isCasualty ? 'CRITICAL INCIDENT DEBRIEF • CASUALTY REPORT' : 'POST-DRILL PERFORMANCE DEBRIEF'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 mt-0.5 flex items-center gap-2">
              {isCasualty ? (
                <>
                  <Skull className="w-6 h-6 text-rose-500 animate-pulse" />
                  <span>Evacuation Drill Failed</span>
                </>
              ) : (
                'Evacuation Drill Assessment'
              )}
            </h1>
            <p className="text-xs text-slate-400">
              Campus: {report.campusName} • Scenario: {report.disasterType.toUpperCase()}
            </p>
          </div>

          {/* Grade Badge */}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center border-2 shadow-xl ${getGradeColor(
              report.grade
            )}`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">GRADE</span>
            <span className="text-3xl sm:text-4xl font-black leading-none mt-1">{report.grade}</span>
          </div>
        </div>

        {/* Casualty Banner if deceased */}
        {isCasualty && (
          <div className="bg-rose-950/70 border border-rose-600/70 rounded-2xl p-3.5 mb-5 flex items-start gap-3 text-rose-100">
            <HeartCrack className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold tracking-wide uppercase text-rose-300 block mb-0.5 font-mono">
                CADET OVERCOME BY HAZARD EXPOSURE
              </span>
              <p className="text-rose-200/90 leading-relaxed">
                {report.casualtyReason ||
                  'The cadet succumbed to severe hazard exposure after depleted stamina prevented evasive action. Remember to sense hazard warnings early, conserve stamina by not sprinting into danger, and low crawl under smoke.'}
              </p>
            </div>
          </div>
        )}

        {/* Score & Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-mono text-cyan-400 block font-semibold">TOTAL SCORE</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-cyan-200 mt-1 block">
              {report.totalScore}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-mono text-amber-400 block font-semibold">COMPLETION TIME</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-amber-300 mt-1 block">
              {formatTime(report.completionTimeSeconds)}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-mono text-emerald-400 block font-semibold">CHECKPOINTS</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-300 mt-1 block">
              {report.checkpointsReached}/{report.totalCheckpoints}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-mono text-purple-400 block font-semibold">EFFICIENCY</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-purple-300 mt-1 block">
              {report.evacuationEfficiency}%
            </span>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-5 space-y-2.5 text-xs">
          <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Safety Protocol Compliance Audit
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Illuminated Safe Path Followed:
            </span>
            <span className={`font-mono font-semibold ${isCasualty ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isCasualty ? 'INTERRUPTED' : '100% COMPLIANT'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Remaining Cadet Health & Vitals:
            </span>
            <span className={`font-mono font-semibold ${isCasualty ? 'text-rose-400' : 'text-cyan-300'}`}>
              {report.safetyScore}% Vitals {isCasualty && '(FLATLINE)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Ceiling Smoke Exposure Index:
            </span>
            <span className="font-mono font-semibold text-amber-300">
              {report.smokeExposurePercent}% Inhalation
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Peer Buddy System Assistance:
            </span>
            <span className="font-mono font-semibold text-purple-300">
              {report.peerAssisted ? 'COMPLETED (+500 PTS)' : 'NOT ENGAGED'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={onOpenLeaderboard}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboards</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onRestart}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all ${
                isCasualty
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Drill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
