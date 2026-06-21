import React from 'react';
import { PenTool, Eraser, EyeOff } from 'lucide-react';
import { GestureType } from '../utils/gesture';

interface LegendProps {
  activeGesture: GestureType;
  brushColor: string;
  brushSize: number;
}

export default function Legend({ activeGesture, brushColor, brushSize }: LegendProps) {
  const modes = [
    {
      id: 'DRAW' as GestureType,
      label: 'DRAW',
      desc: 'Extend your index finger upright keep other fingers folded.',
      icon: PenTool,
      activeColor: brushColor,
      badge: 'Index Up',
    },
    {
      id: 'ERASE' as GestureType,
      label: 'ERASE',
      desc: 'Hover with your palm completely open to clear lines.',
      icon: Eraser,
      activeColor: '#ec4899',
      badge: 'Open Palm',
    },
    {
      id: 'IDLE' as GestureType,
      label: 'IDLE',
      desc: 'Close your hand into a fist to suspend drawing.',
      icon: EyeOff,
      activeColor: '#f59e0b',
      badge: 'Fist Closed',
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="font-sans font-medium text-xs tracking-[0.2em] text-[#f5f5f5] uppercase">
          GESTURES
        </h3>
        <span className="font-mono text-[9px] text-neutral-400 py-1 px-2.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${activeGesture !== 'undetected' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`}></span>
          {activeGesture === 'undetected' ? 'No Hand' : 'Sensor Active'}
        </span>
      </div>

      {/* Mode List */}
      <div className="space-y-2.5">
        {modes.map((mode) => {
          const isActive = activeGesture === mode.id;
          const Icon = mode.icon;

          return (
            <div
              key={mode.id}
              className={`p-3.5 rounded-2xl transition-all duration-200 border ${
                isActive
                  ? 'bg-white/[0.03] border-white/15'
                  : 'bg-transparent border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl border ${
                      isActive
                        ? 'text-[#f5f5f5] bg-white/5 border-white/20'
                        : 'bg-white/5 border-white/10 text-neutral-500'
                    }`}
                    style={isActive && mode.id === 'DRAW' ? { borderColor: brushColor, color: brushColor } : {}}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4
                      className="font-sans font-semibold text-[10px] tracking-wider text-white"
                      style={isActive && mode.id === 'DRAW' ? { color: brushColor } : {}}
                    >
                      {mode.label}
                    </h4>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                      {mode.desc}
                    </p>
                  </div>
                </div>

                <span
                  className="font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded text-neutral-500 border border-white/5"
                  style={isActive ? { color: mode.id === 'DRAW' ? brushColor : mode.id === 'ERASE' ? '#ec4899' : '#f59e0b', borderColor: 'currentColor', backgroundColor: 'rgba(255,255,255,0.02)' } : {}}
                >
                  {mode.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Keyboard Shortcuts Section */}
      <div className="pt-4 border-t border-white/5 space-y-2.5">
        <h3 className="font-sans font-medium text-[10px] tracking-[0.2em] text-[#f5f5f5] uppercase">
          SHORTCUTS
        </h3>
        
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center justify-between p-1.5 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-neutral-400 font-sans">Undo Draw</span>
            <kbd className="font-mono text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-neutral-300">Ctrl+Z / U</kbd>
          </div>
          <div className="flex items-center justify-between p-1.5 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-neutral-400 font-sans">Redo Draw</span>
            <kbd className="font-mono text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-neutral-300">Ctrl+Y / R</kbd>
          </div>
          <div className="flex items-center justify-between p-1.5 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-neutral-400 font-sans">Clear Canvas</span>
            <kbd className="font-mono text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-neutral-300">C</kbd>
          </div>
          <div className="flex items-center justify-between p-1.5 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="text-neutral-400 font-sans">Toggle Fullscreen</span>
            <kbd className="font-mono text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-neutral-300">F</kbd>
          </div>
          <div className="flex items-center justify-between p-1.5 bg-white/[0.02] border border-white/5 rounded-xl col-span-2">
            <span className="text-neutral-400 font-sans">Download artwork PNG</span>
            <kbd className="font-mono text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-neutral-300">Ctrl+S</kbd>
          </div>
        </div>
      </div>
      
      <div className="pt-2 text-center border-t border-white/5">
        <p className="text-[9px] font-mono text-neutral-500 leading-normal">
          Keep hand 1.5 - 3 feet away with good lighting.
        </p>
      </div>
    </div>
  );
}
