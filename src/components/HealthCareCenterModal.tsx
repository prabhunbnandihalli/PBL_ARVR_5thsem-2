import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  ShieldCheck,
  Thermometer,
  Wind,
  Droplets,
  Printer,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  X,
  RotateCcw,
  AlertTriangle,
  Award,
  Clock,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { HealthReportData } from '../types';
import confetti from 'canvas-confetti';

interface HealthCareCenterModalProps {
  report: HealthReportData;
  onClose: () => void;
  onRestart: () => void;
  onOpenDebrief?: () => void;
}

export const HealthCareCenterModal: React.FC<HealthCareCenterModalProps> = ({
  report,
  onClose,
  onRestart,
  onOpenDebrief,
}) => {
  const [activeTab, setActiveTab] = useState<'vitals' | 'clinical' | 'certificate'>('vitals');
  const [oxygenAdministered, setOxygenAdministered] = useState(false);
  const [stethoscopeActive, setStethoscopeActive] = useState(false);
  const [currentVitals, setCurrentVitals] = useState(report.vitals);
  const [ecgPhase, setEcgPhase] = useState(0);

  // Animate ECG pulse line
  useEffect(() => {
    const timer = setInterval(() => {
      setEcgPhase((p) => (p + 1) % 60);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Oxygen treatment effect
  const handleAdministerOxygen = () => {
    if (oxygenAdministered) return;
    setOxygenAdministered(true);
    setCurrentVitals((prev) => ({
      ...prev,
      spo2Percent: Math.min(100, prev.spo2Percent + 3),
      heartRateBpm: Math.max(72, prev.heartRateBpm - 18),
      carbonMonoxideCoHb: Math.max(0.6, +(prev.carbonMonoxideCoHb * 0.4).toFixed(1)),
      respiratoryRateBpm: Math.max(14, prev.respiratoryRateBpm - 4),
    }));
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  const handleToggleStethoscope = () => {
    setStethoscopeActive((prev) => !prev);
  };

  const handlePrint = () => {
    window.print();
  };

  const isGreen = report.triageTag === 'GREEN';
  const isYellow = report.triageTag === 'YELLOW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white text-slate-100 print:text-slate-900">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-b border-red-900/40 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-500/10 text-red-400">
              <span className="text-2xl font-black">✚</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-red-400 uppercase font-bold bg-red-950/60 px-2 py-0.5 rounded-full border border-red-800/50">
                  DISASTER MEDICINE FIELD CLINIC
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  UNIT: TRIAGE-MUSTER-01
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2 mt-0.5">
                Health Care Center & Medical Triage Report
              </h2>
              <p className="text-xs text-slate-400">
                Post-Evacuation Clinical Assessment & Incident Physical Check-Up
              </p>
            </div>
          </div>

          {/* Action buttons & Close */}
          <div className="flex items-center gap-2 self-end sm:self-center print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm"
              title="Print or Save Certificate"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Print Record</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Patient Badge & Navigation Tabs */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 font-mono">
            <div className="flex items-center gap-1.5 text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Patient: <strong className="text-white font-bold">{report.cadetName}</strong></span>
              <span className="text-slate-500">({report.cadetRole})</span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{report.campusName}</span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Egress Time: <strong className="text-white font-bold">{report.evacuationTimeSeconds}s</strong></span>
            </div>
          </div>

          {/* START Triage Tag */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Triage Classification:</span>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-md ${
                isGreen
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : isYellow
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full animate-pulse bg-current" />
              <span>{report.triageTag} TAG: {report.triageCategory}</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-4 sm:px-6 gap-2 bg-slate-900/40 print:hidden">
          <button
            onClick={() => setActiveTab('vitals')}
            className={`py-2.5 px-4 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'vitals'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Vital Signs & Telemetry</span>
          </button>
          <button
            onClick={() => setActiveTab('clinical')}
            className={`py-2.5 px-4 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'clinical'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Clinical Findings & Treatments</span>
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`py-2.5 px-4 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'certificate'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Official Medical Discharge Certificate</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'vitals' && (
            <div className="space-y-6">
              {/* Animated ECG Heart Rhythm Oscilloscope */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-emerald-950/60 relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">
                      Continuous Cardiac Telemetry Rhythm Lead II
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400">PULSE:</span>
                    <span className="text-emerald-400 font-black text-sm">{currentVitals.heartRateBpm} BPM</span>
                  </div>
                </div>

                {/* SVG Oscilloscope wave */}
                <div className="h-20 w-full relative flex items-center">
                  <svg className="w-full h-full" viewBox="0 0 800 80" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ecgGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                        <stop offset="70%" stopColor="#10b981" stopOpacity="1" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M 0 40 
                          L ${100 + (ecgPhase * 5) % 80} 40 
                          L ${110 + (ecgPhase * 5) % 80} 35 
                          L ${115 + (ecgPhase * 5) % 80} 40 
                          L ${130 + (ecgPhase * 5) % 80} 40 
                          L ${135 + (ecgPhase * 5) % 80} 10 
                          L ${145 + (ecgPhase * 5) % 80} 70 
                          L ${155 + (ecgPhase * 5) % 80} 25 
                          L ${165 + (ecgPhase * 5) % 80} 40 
                          L ${190 + (ecgPhase * 5) % 80} 32 
                          L ${210 + (ecgPhase * 5) % 80} 40 
                          L 800 40`}
                      fill="none"
                      stroke="url(#ecgGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute right-3 top-2 text-[10px] font-mono text-emerald-500/80">
                    SINUS RHYTHM • NORMAL AXIS
                  </div>
                </div>
              </div>

              {/* Vital Signs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {/* Heart Rate */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span className="font-semibold">Heart Rate</span>
                    <Heart className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-100 font-mono">
                    {currentVitals.heartRateBpm} <span className="text-xs font-normal text-slate-400">BPM</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {currentVitals.heartRateBpm > 100 ? 'Reactive sinus tachycardia (exertion)' : 'Normal resting pulse'}
                  </p>
                </div>

                {/* Oxygen Saturation */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span className="font-semibold">Blood Oxygen (SpO2)</span>
                    <Wind className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">
                    {currentVitals.spo2Percent}%
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${currentVitals.spo2Percent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {currentVitals.spo2Percent >= 96 ? 'Optimal pulmonary gas exchange' : 'Mild hypoxia (smoke exposure)'}
                  </p>
                </div>

                {/* Blood Pressure */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span className="font-semibold">Blood Pressure</span>
                    <Droplets className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-100 font-mono">
                    {currentVitals.bloodPressure}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Transient reactive elevation due to adrenaline
                  </p>
                </div>

                {/* Respiratory Rate */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span className="font-semibold">Respiratory Rate</span>
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-100 font-mono">
                    {currentVitals.respiratoryRateBpm} <span className="text-xs font-normal text-slate-400">bpm</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Clear airway; spontaneous unlabored ventilation
                  </p>
                </div>

                {/* Body Temperature */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span className="font-semibold">Body Core Temp</span>
                    <Thermometer className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-100 font-mono">
                    {currentVitals.bodyTempC}°C
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Normothermic; zero thermal hyperthermia
                  </p>
                </div>

                {/* Carbon Monoxide */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span className="font-semibold">Carbon Monoxide (COHb)</span>
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-100 font-mono">
                    {currentVitals.carbonMonoxideCoHb}%
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {currentVitals.carbonMonoxideCoHb < 2.5 ? 'Safe baseline level' : 'Marginal smoke ingestion'}
                  </p>
                </div>
              </div>

              {/* Interactive Medical Interventions */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Field Paramedic Immediate Care Station
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Administer 100% humidified oxygen and electrolyte rehydration to stabilize vitals post-drill.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleToggleStethoscope}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      stethoscopeActive
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{stethoscopeActive ? 'Stethoscope: Active' : 'Listen with Stethoscope'}</span>
                  </button>

                  <button
                    onClick={handleAdministerOxygen}
                    disabled={oxygenAdministered}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${
                      oxygenAdministered
                        ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 cursor-default'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 active:scale-95'
                    }`}
                  >
                    <Wind className="w-3.5 h-3.5" />
                    <span>{oxygenAdministered ? '✓ Oxygen Therapy Administered' : 'Administer 100% O2'}</span>
                  </button>
                </div>
              </div>

              {/* Stethoscope Diagnostic Auscultation Panel */}
              {stethoscopeActive && (
                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs text-cyan-300 font-mono font-bold">
                    <span>🩺 BILATERAL PULMONARY AUSCULTATION (LUNG SOUNDS)</span>
                    <span className="text-emerald-400">STATUS: CLEAR</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Vesicular breath sounds clear bilaterally across all lung fields. No wheezes, crackles, or stridor detected. Upper airway patent; cilia active.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'clinical' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Airway & Pulmonary */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase">
                    <Wind className="w-4 h-4" />
                    Airway & Respiratory Tract
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.clinicalFindings.airwayLungsStatus}
                  </p>
                </div>

                {/* Thermal Burns & Skin */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300 uppercase">
                    <Thermometer className="w-4 h-4" />
                    Integumentary & Thermal Screen
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.clinicalFindings.thermalBurnStatus}
                  </p>
                </div>

                {/* Musculoskeletal / Trauma */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase">
                    <Activity className="w-4 h-4" />
                    Musculoskeletal & Egress Biomechanics
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.clinicalFindings.musculoskeletalStatus}
                  </p>
                </div>

                {/* Psychological Response */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase">
                    <ShieldCheck className="w-4 h-4" />
                    Acute Stress & Psychological Stability
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.clinicalFindings.psychologicalShock}
                  </p>
                </div>
              </div>

              {/* Treatments Administered */}
              <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Procedures & Field Treatments Performed:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  {report.treatmentAdministered.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                  {oxygenAdministered && (
                    <div className="flex items-center gap-2 bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/50 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Supplemental 100% O2 therapy & oral isotonic rehydration</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Physician Clinical Notes */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 uppercase tracking-wide">
                    Chief Physician Prognosis & Clinical Notes
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    DISCHARGE: {report.dischargeStatus.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{report.physicianNotes}"
                </p>
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                  <span>Examining Physician: <strong>{report.doctorName}</strong></span>
                  <span>Triage Officer: <strong>{report.paramedicName}</strong></span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'certificate' && (
            <div className="space-y-4 print:space-y-6">
              {/* Printable Official Medical Clearance Certificate */}
              <div className="border-4 border-double border-slate-700 bg-slate-950 p-6 sm:p-8 rounded-3xl relative overflow-hidden print:border-slate-800 print:bg-white print:text-black">
                {/* Watermark Logo */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                  <span className="text-[160px] font-black font-serif text-slate-100">✚</span>
                </div>

                <div className="text-center space-y-1 mb-6 border-b border-slate-800 pb-4">
                  <div className="text-[11px] font-mono tracking-widest text-red-400 uppercase font-bold">
                    DEPARTMENT OF EMERGENCY DISASTER SERVICES & OCCUPATIONAL HEALTH
                  </div>
                  <h3 className="text-2xl font-serif font-black text-slate-100 print:text-slate-900 tracking-tight">
                    OFFICIAL EMERGENCY EVACUATION & MEDICAL HEALTH CLEARANCE
                  </h3>
                  <p className="text-xs text-slate-400 print:text-slate-600">
                    Certified Clinical Report for Incident Drill Participation & Safety Zone Egress
                  </p>
                </div>

                {/* Certificate Details */}
                <div className="space-y-4 text-xs leading-relaxed">
                  <p className="text-center text-sm text-slate-200 print:text-slate-800">
                    This document certifies that Cadet <strong className="text-white print:text-black underline font-bold">{report.cadetName}</strong> (Role: <em>{report.cadetRole}</em>) has successfully evacuated from the disaster zone at <strong className="text-white print:text-black">{report.campusName}</strong> and underwent comprehensive post-evacuation medical triage check-up at the field health care center.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 print:bg-slate-100 p-3.5 rounded-2xl border border-slate-800 print:border-slate-300 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Evacuation Time</span>
                      <strong className="text-slate-200 print:text-black text-sm">{report.evacuationTimeSeconds}s</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Triage Status</span>
                      <strong className="text-emerald-400 print:text-emerald-700 text-sm">{report.triageTag} TAG</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Drill Score</span>
                      <strong className="text-cyan-400 print:text-cyan-700 text-sm">{report.evacuationScore} pts</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Discharge Grade</span>
                      <strong className="text-amber-400 print:text-amber-700 text-sm">GRADE {report.evacuationGrade}</strong>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 print:bg-slate-50 p-4 rounded-2xl border border-slate-800/80 print:border-slate-200">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                      Post-Drill Clinical Clearance Verdict:
                    </span>
                    <p className="text-slate-300 print:text-slate-700 text-xs">
                      Patient vitals have been inspected and confirmed stable. Zero major thermal injury or structural musculoskeletal trauma sustained. Pulmonary auscultation clear. Cadet is officially designated <strong className="text-emerald-400 print:text-emerald-800 font-bold">{report.dischargeStatus.toUpperCase()}</strong>.
                    </p>
                  </div>

                  {/* Signatures */}
                  <div className="flex items-end justify-between pt-6 border-t border-slate-800 print:border-slate-300 mt-6">
                    <div>
                      <div className="w-40 border-b border-slate-600 print:border-slate-400 font-serif italic text-cyan-400 print:text-slate-800 pb-0.5">
                        {report.doctorName}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block mt-1">Chief Disaster Medicine Physician</span>
                    </div>

                    <div className="text-right">
                      <div className="w-40 border-b border-slate-600 print:border-slate-400 font-serif italic text-cyan-400 print:text-slate-800 pb-0.5 ml-auto">
                        {report.paramedicName}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block mt-1">Field Triage Paramedic Supervisor</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950/80 border-t border-slate-800 p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Health Care Center Report certified. All vitals stored in incident archive.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onOpenDebrief && (
              <button
                onClick={onOpenDebrief}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
              >
                View Drill Debrief Score
              </button>
            )}
            <button
              onClick={onRestart}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Re-run Drill</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              Return to Campus
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
