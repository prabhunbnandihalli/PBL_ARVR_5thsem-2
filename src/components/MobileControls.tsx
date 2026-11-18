import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, Flashlight, Hand, UserCheck } from 'lucide-react';

interface MobileControlsProps {
  onMovementChange: (input: {
    x: number;
    y: number;
    isSprinting: boolean;
    isCrouching: boolean;
    interact: boolean;
    jump: boolean;
  }) => void;
  flashlightEnabled: boolean;
  onToggleFlashlight: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMovementChange,
  flashlightEnabled,
  onToggleFlashlight,
}) => {
  const [joystickVector, setJoystickVector] = useState({ x: 0, y: 0 });
  const [isSprinting, setIsSprinting] = useState(false);
  const [isCrouching, setIsCrouching] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

  // Joystick touch tracking
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  // Keyboard controls state
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      keysPressed.current[e.key.toLowerCase()] = true;

      if (e.key === 'Shift') setIsSprinting(true);
      if (e.key.toLowerCase() === 'c') setIsCrouching(prev => !prev);
      if (e.key.toLowerCase() === 'e') setIsInteracting(true);
      if (e.key.toLowerCase() === 'l' || e.key.toLowerCase() === 't') onToggleFlashlight();
      if (e.key.toLowerCase() === 'f') window.dispatchEvent(new CustomEvent('aegis:switchFloor'));
      if (e.code === 'Space') setIsJumping(true);

      updateMovementFromKeys();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;

      if (e.key === 'Shift') setIsSprinting(false);
      if (e.key.toLowerCase() === 'e') setIsInteracting(false);
      if (e.code === 'Space') setIsJumping(false);

      updateMovementFromKeys();
    };

    const updateMovementFromKeys = () => {
      let x = 0;
      let y = 0;

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) y += 1;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) y -= 1;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) x += 1;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) x -= 1;

      // Normalize if diagonal
      if (x !== 0 && y !== 0) {
        x *= 0.7071;
        y *= 0.7071;
      }

      setJoystickVector({ x, y });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onToggleFlashlight]);

  // Synchronize state with parent
  useEffect(() => {
    onMovementChange({
      x: joystickVector.x,
      y: joystickVector.y,
      isSprinting,
      isCrouching,
      interact: isInteracting,
      jump: isJumping,
    });
  }, [joystickVector, isSprinting, isCrouching, isInteracting, isJumping, onMovementChange]);

  // Virtual Analog Joystick Touch Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!joystickBaseRef.current || touchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        const rect = joystickBaseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        const radius = rect.width / 2;

        const distance = Math.min(radius, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
        const angle = Math.atan2(deltaY, deltaX);

        const normalizedX = (Math.cos(angle) * distance) / radius;
        const normalizedY = -(Math.sin(angle) * distance) / radius; // inverted for forward

        setJoystickVector({ x: normalizedX, y: normalizedY });
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setJoystickVector({ x: 0, y: 0 });
        break;
      }
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none z-30 flex items-end justify-between p-4 sm:p-6 select-none">
      {/* Virtual Analog Joystick (Left Side) */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-cyan-500/40 flex items-center justify-center shadow-xl touch-none"
        >
          {/* Directional ticks */}
          <div className="absolute top-1 text-cyan-500/50 text-[10px]">▲</div>
          <div className="absolute bottom-1 text-cyan-500/50 text-[10px]">▼</div>
          <div className="absolute left-1 text-cyan-500/50 text-[10px]">◀</div>
          <div className="absolute right-1 text-cyan-500/50 text-[10px]">▶</div>

          {/* Stick thumb */}
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 border-2 border-white/80 shadow-lg shadow-cyan-500/50 transition-transform duration-75"
            style={{
              transform: `translate(${joystickVector.x * 38}px, ${-joystickVector.y * 38}px)`,
            }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-400 font-medium">MOVE (WASD)</span>
      </div>

      {/* Central Visual Camera Direction Hint */}
      <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 backdrop-blur-md shadow-lg mb-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>Drag screen to rotate camera • Moves toward camera visual direction</span>
      </div>

      {/* Action Buttons (Right Side) */}
      <div className="flex flex-col items-end gap-3 pointer-events-auto">
        {/* Flashlight & Utility Row */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFlashlight}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all shadow-md ${
              flashlightEnabled
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Flashlight (L)"
          >
            <Flashlight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsInteracting(prev => !prev)}
            onTouchStart={() => setIsInteracting(true)}
            onTouchEnd={() => setIsInteracting(false)}
            className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border transition-all shadow-md ${
              isInteracting
                ? 'bg-cyan-500 text-white border-cyan-300 ring-2 ring-cyan-400'
                : 'bg-slate-800/80 text-cyan-300 border-cyan-700 hover:bg-slate-700'
            }`}
            title="Interact / Help Peer (E)"
          >
            <Hand className="w-5 h-5" />
            <span className="text-[8px] font-mono mt-0.5">INTERACT</span>
          </button>
        </div>

        {/* Primary Stance Row: Sprint & Crouch */}
        <div className="flex items-center gap-2.5">
          {/* Crouch / Low-Crawl button */}
          <button
            onClick={() => setIsCrouching(prev => !prev)}
            className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl flex items-center gap-1.5 text-xs font-mono font-bold border transition-all shadow-lg ${
              isCrouching
                ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400 shadow-amber-600/40'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Low-Crawl Under Smoke (C)"
          >
            <ChevronDown className="w-4 h-4" />
            <span>{isCrouching ? 'CRAWLING' : 'CROUCH [C]'}</span>
          </button>

          {/* Sprint button */}
          <button
            onTouchStart={() => setIsSprinting(true)}
            onTouchEnd={() => setIsSprinting(false)}
            onMouseDown={() => setIsSprinting(true)}
            onMouseUp={() => setIsSprinting(false)}
            className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl flex items-center gap-1.5 text-xs font-mono font-bold border transition-all shadow-lg ${
              isSprinting
                ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400 shadow-emerald-600/40'
                : 'bg-slate-800/80 text-emerald-400 border-emerald-800 hover:bg-slate-700'
            }`}
            title="Hold to Sprint (Shift)"
          >
            <Zap className="w-4 h-4" />
            <span>SPRINT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
