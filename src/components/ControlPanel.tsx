import React from 'react';
import { Undo2, Redo2, Trash2, HelpCircle, Download, Maximize2, Minimize2 } from 'lucide-react';

interface ControlPanelProps {
  brushColor: string;
  setBrushColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  eraserSize: number;
  setEraserSize: (size: number) => void;
  glowIntensity: number;
  setGlowIntensity: (intensity: number) => void;
  onClear: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  onDownload: () => void;
  onToggleGuide: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const PALETTE_COLORS = [
  { name: 'cyan', value: '#06b6d4' },
  { name: 'pink', value: '#ec4899' },
  { name: 'green', value: '#10b981' },
  { name: 'blue', value: '#3b82f6' },
  { name: 'red', value: '#ef4444' },
  { name: 'yellow', value: '#f59e0b' },
  { name: 'purple', value: '#8b5cf6' },
  { name: 'white', value: '#ffffff' },
];

export default function ControlPanel({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  eraserSize,
  setEraserSize,
  glowIntensity,
  setGlowIntensity,
  onClear,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  onDownload,
  onToggleGuide,
  isFullscreen,
  onToggleFullscreen,
}: ControlPanelProps) {
  return (
    <div 
      className="fixed right-6 top-1/2 -translate-y-1/2 w-[156px] bg-[#080808]/70 backdrop-blur-[24px] border border-white/[0.08] rounded-[24px] p-4 z-50 text-white select-none pointer-events-auto flex flex-col gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.7)]"
      id="canvas-control-panel"
    >
      
      {/* COLORS SECTION */}
      <div className="space-y-2.5">
        <h3 className="font-sans font-medium text-[8px] tracking-[0.25em] text-neutral-400 uppercase text-center block">
          COLORS
        </h3>
        <div className="grid grid-cols-4 gap-1.5 justify-items-center">
          {PALETTE_COLORS.map((c) => {
            const isSelected = brushColor.toLowerCase() === c.value.toLowerCase();
            return (
              <button
                key={c.value}
                onClick={() => setBrushColor(c.value)}
                title={`Select ${c.name}`}
                className="w-5 h-5 rounded-full relative transition-all duration-200 hover:scale-110 cursor-pointer"
                style={{
                  backgroundColor: c.value,
                  boxShadow: isSelected
                    ? `0 0 8px ${c.value}, inset 0 0 0 1px rgba(255,255,255,0.9)`
                    : 'inset 0 0 0 1px rgba(255,255,255,0.12)',
                }}
              >
                {isSelected && (
                  <span className="absolute inset-0 m-auto w-1 h-1 rounded-full bg-black/60"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* COMPACT TRIPLE ADJUSTMENTS */}
      <div className="grid grid-cols-3 gap-1 py-3 border-y border-white/[0.06] my-0">
        
        {/* Thickness Vertical Slider */}
        <div className="flex flex-col items-center space-y-1.5">
          <span className="font-sans font-semibold text-[7px] tracking-[0.05em] text-neutral-400 uppercase text-center block">
            BRUSH
          </span>
          
          <div className="h-20 flex items-center justify-center p-1 rounded-xl bg-black/40 border border-white/[0.04] w-8 relative">
            <input
              type="range"
              min="2"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
              className="accent-cyan-400 cursor-ns-resize"
              style={{
                WebkitAppearance: 'slider-vertical',
                appearance: 'slider-vertical',
                width: '3.5px',
                height: '100%',
              }}
            />
          </div>

          <span className="font-mono text-[7px] font-bold text-cyan-400 tracking-wider">
            {brushSize}px
          </span>
        </div>

        {/* Eraser Size Vertical Slider */}
        <div className="flex flex-col items-center space-y-1.5">
          <span className="font-sans font-semibold text-[7px] tracking-[0.05em] text-neutral-400 uppercase text-center block">
            ERASER
          </span>
          
          <div className="h-20 flex items-center justify-center p-1 rounded-xl bg-black/40 border border-white/[0.04] w-8 relative">
            <input
              type="range"
              min="4"
              max="100"
              value={eraserSize}
              onChange={(e) => setEraserSize(parseInt(e.target.value, 10))}
              className="accent-pink-400 cursor-ns-resize"
              style={{
                WebkitAppearance: 'slider-vertical',
                appearance: 'slider-vertical',
                width: '3.5px',
                height: '100%',
              }}
            />
          </div>

          <span className="font-mono text-[7px] font-bold text-pink-400 tracking-wider">
            {eraserSize}px
          </span>
        </div>

        {/* Glow Intensity Vertical Slider */}
        <div className="flex flex-col items-center space-y-1.5">
          <span className="font-sans font-semibold text-[7px] tracking-[0.05em] text-neutral-400 uppercase text-center block">
            GLOW
          </span>
          
          <div className="h-20 flex items-center justify-center p-1 rounded-xl bg-black/40 border border-white/[0.04] w-8 relative">
            <input
              type="range"
              min="0"
              max="40"
              value={glowIntensity}
              onChange={(e) => setGlowIntensity(parseInt(e.target.value, 10))}
              className="accent-cyan-400 cursor-ns-resize"
              style={{
                WebkitAppearance: 'slider-vertical',
                appearance: 'slider-vertical',
                width: '3.5px',
                height: '100%',
              }}
            />
          </div>

          <span className="font-mono text-[7px] font-bold text-cyan-400 tracking-wider">
            {Math.round(glowIntensity * 2.5)}%
          </span>
        </div>

      </div>

      {/* QUICK WORKSPACE CONTROLS */}
      <div className="grid grid-cols-2 gap-1.5">
        
        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-200 h-8 ${
            canUndo
              ? 'bg-white/5 border-white/[0.08] hover:bg-white/10 hover:border-white/15 active:scale-95 text-white cursor-pointer'
              : 'bg-transparent border-transparent text-neutral-700 cursor-not-allowed'
          }`}
          title="Undo previous brushstroke (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        {/* Redo Button */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-200 h-8 ${
            canRedo
              ? 'bg-white/5 border-white/[0.08] hover:bg-white/10 hover:border-white/15 active:scale-95 text-white cursor-pointer'
              : 'bg-transparent border-transparent text-neutral-700 cursor-not-allowed'
          }`}
          title="Redo previous brushstroke (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        {/* Clear All */}
        <button
          onClick={onClear}
          className="flex items-center justify-center p-2 rounded-xl bg-red-950/10 border border-red-500/15 text-red-400 hover:bg-red-950/20 hover:border-red-500/25 transition-all duration-200 active:scale-95 cursor-pointer h-8"
          title="Clear entire canvas (C)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen Mode */}
        <button
          onClick={onToggleFullscreen}
          className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-200 h-8 ${
            isFullscreen
              ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400'
              : 'bg-white/5 border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/15'
          } active:scale-95 cursor-pointer`}
          title="Toggle fullscreen mode (F)"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Guide Trigger */}
        <button
          onClick={onToggleGuide}
          className="flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all duration-200 active:scale-95 cursor-pointer h-8"
          title="Open gestures instruction guide (G)"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Export Drawing */}
        <button
          onClick={onDownload}
          className="flex items-center justify-center p-2 rounded-xl bg-cyan-950/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-950/20 hover:border-cyan-500/30 transition-all duration-200 active:scale-95 cursor-pointer h-8"
          title="Download painting as PNG image (Ctrl+S)"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

      </div>

    </div>
  );
}
