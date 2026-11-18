import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { User, Shield, Sparkles, HardHat, Backpack, Flashlight, Check, RefreshCw } from 'lucide-react';
import { CharacterCustomization, CharacterEquipment } from '../types';
import { createCharacterRig } from '../utils/characterModel';

interface CharacterCustomizerProps {
  customization: CharacterCustomization;
  onChange: (updated: CharacterCustomization) => void;
  onSave: () => void;
  onClose: () => void;
}

const SKIN_TONES = ['#f8d9b6', '#e2a87a', '#b97a56', '#874d2b', '#4a2c1d'];
const HAIR_COLORS = ['#1e293b', '#451a03', '#b45309', '#fef08a', '#dc2626', '#3b82f6'];
const CLOTHING_COLORS = ['#557a46', '#1e3a8a', '#2563eb', '#0f172a', '#334155', '#dc2626', '#16a34a', '#d97706', '#7c2d12'];

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({
  customization,
  onChange,
  onSave,
  onClose,
}) => {
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // 3D Avatar Turntable Preview
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 1.1, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.0);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(-3, 3, -2);
    scene.add(rimLight);

    // Character Rig
    const rig = createCharacterRig(customization);
    scene.add(rig.root);

    // Pedestal platform
    const platformGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.15, 32);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.5 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.075;
    scene.add(platform);

    let animationId: number;
    let clock = new THREE.Clock();

    const renderLoop = () => {
      animationId = requestAnimationFrame(renderLoop);
      const elapsed = clock.getElapsedTime();
      rig.root.rotation.y = elapsed * 0.7; // Slow gentle rotation
      rig.updateAnimation(elapsed, 0, false);
      renderer.render(scene, camera);
    };

    renderLoop();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [customization]);

  const updateEquipment = <K extends keyof CharacterEquipment>(key: K, val: CharacterEquipment[K]) => {
    onChange({
      ...customization,
      equipment: {
        ...customization.equipment,
        [key]: val,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Left: 3D Turntable Preview */}
        <div className="w-full md:w-5/12 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center justify-between p-4 border-b md:border-b-0 md:border-r border-slate-800 relative">
          <div className="w-full flex items-center justify-between z-10">
            <span className="text-xs font-mono text-cyan-400 font-bold tracking-wider uppercase">
              3D CADET RIG PREVIEW
            </span>
            <span className="text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
              360° ROTATION
            </span>
          </div>

          <div ref={previewContainerRef} className="w-full h-64 md:h-96 my-auto relative" />

          <div className="w-full text-center z-10">
            <div className="text-sm font-bold text-slate-100">{customization.name || 'Unnamed Cadet'}</div>
            <div className="text-xs text-cyan-400 font-mono mt-0.5">{customization.role}</div>
          </div>
        </div>

        {/* Right: Customization Controls Panel */}
        <div className="w-full md:w-7/12 p-5 overflow-y-auto flex flex-col gap-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Evacuation Gear & Avatar Customizer
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure personal protection gear, high-visibility clothing, and emergency tools.
            </p>
          </div>

          {/* Identity & Role */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
              Identity & Campus Role
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Cadet Name</label>
                <input
                  type="text"
                  value={customization.name}
                  onChange={(e) => onChange({ ...customization, name: e.target.value })}
                  placeholder="e.g., Alex Vance"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Role Designation</label>
                <select
                  value={customization.role}
                  onChange={(e) => onChange({ ...customization, role: e.target.value as any })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Student">Student (General Evacuee)</option>
                  <option value="Teacher">Teacher / Faculty Lead</option>
                  <option value="Safety Warden">Safety Warden (Evacuation Marshal)</option>
                  <option value="Lab Specialist">Lab Specialist (Hazmat Qualified)</option>
                  <option value="Campus Paramedic">Campus Paramedic (First Aid Lead)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clothing Style & Colors */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
              Clothing Style & Appearance
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'padded_vest', label: 'Padded Vest (Mannequin Style)' },
                { id: 'student_uniform', label: 'Student Uniform' },
                { id: 'teacher_suit', label: 'Teacher Formal Suit' },
                { id: 'casual_hoodie', label: 'Casual Hoodie' },
                { id: 'lab_coat', label: 'Science Lab Coat' },
                { id: 'warden_uniform', label: 'Warden Uniform' },
                { id: 'paramedic_suit', label: 'Paramedic Suit' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => onChange({ ...customization, clothingStyle: style.id as any })}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    customization.clothingStyle === style.id
                      ? 'bg-cyan-600/20 border-cyan-400 text-cyan-200 font-semibold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>

            {/* Colors: Outfit, Skin, Hair */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Outfit Color</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {CLOTHING_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => onChange({ ...customization, clothingColor: c })}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        customization.clothingColor === c ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Skin Tone</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SKIN_TONES.map((c) => (
                    <button
                      key={c}
                      onClick={() => onChange({ ...customization, skinTone: c })}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        customization.skinTone === c ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Hair Style</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['stylish', 'parted', 'short', 'ponytail', 'curly', 'buzz'] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => onChange({ ...customization, hairStyle: h })}
                      className={`px-1.5 py-1 text-[10px] rounded-lg border capitalize text-center ${
                        customization.hairStyle === h
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Glasses / Spectacles Accessory Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-200 font-medium">Stylish Glasses / Spectacles</span>
                <span className="text-[10px] text-slate-400">(Teacher & Studious Cadet)</span>
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...customization, hasGlasses: !customization.hasGlasses })}
                className={`px-3 py-1 text-xs rounded-lg border font-semibold transition-all ${
                  customization.hasGlasses || customization.role === 'Teacher'
                    ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {customization.hasGlasses || customization.role === 'Teacher' ? 'Equipped' : 'None'}
              </button>
            </div>
          </div>

          {/* Protective Equipment */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Safety & Evacuation Equipment
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Headgear */}
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Headgear Protection</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'none', label: 'None' },
                    { id: 'smoke_hood', label: 'Smoke Hood' },
                    { id: 'gas_mask', label: 'Gas Mask' },
                    { id: 'safety_helmet', label: 'Safety Helmet' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => updateEquipment('headgear', item.id as any)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] border text-center ${
                        customization.equipment.headgear === item.id
                          ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vest */}
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">High-Vis Body Vest</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'none', label: 'None' },
                    { id: 'high_vis_vest', label: 'High-Vis Vest' },
                    { id: 'tactical_harness', label: 'Harness' },
                    { id: 'hazard_suit', label: 'Hazmat Vest' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => updateEquipment('vest', item.id as any)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] border text-center ${
                        customization.equipment.vest === item.id
                          ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Backpack */}
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Backpack / Survival Kit</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'none', label: 'None' },
                    { id: 'first_aid_kit', label: 'First Aid Kit' },
                    { id: 'fire_extinguisher', label: 'Extinguisher' },
                    { id: 'survival_pack', label: 'Survival Pack' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => updateEquipment('backpack', item.id as any)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] border text-center ${
                        customization.equipment.backpack === item.id
                          ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hand Tool */}
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Equipped Hand Tool</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'flashlight', label: 'Flashlight' },
                    { id: 'thermal_camera', label: 'Thermal Sensor' },
                    { id: 'emergency_whistle', label: 'Whistle' },
                    { id: 'megaphone', label: 'Megaphone' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => updateEquipment('tool', item.id as any)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] border text-center ${
                        customization.equipment.tool === item.id
                          ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 transition-all"
            >
              <Check className="w-4 h-4" />
              Save & Apply Character
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
