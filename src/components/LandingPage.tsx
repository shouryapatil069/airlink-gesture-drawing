import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Camera } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  permissionState: 'prompt' | 'granted' | 'denied' | 'loading';
}

export default function LandingPage({ onStart, permissionState }: LandingPageProps) {
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const handleStartClick = () => {
    setShowPermissionModal(true);
  };

  const handleAllow = () => {
    setShowPermissionModal(false);
    onStart();
  };

  const handleCancel = () => {
    setShowPermissionModal(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 relative select-none overflow-hidden bg-[#020202]">
      
      {/* Background radial gradient glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(0, 220, 255, 0.10), transparent 50%), #020202",
        }}
      />

      {/* Subtle Dot Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* Subtle light sweep animation element */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div 
          className="w-[200%] h-[200%] absolute -inset-[50%] bg-[linear-gradient(45deg,transparent_45%,rgba(0,220,255,0.03)_50%,transparent_55%)]"
          style={{
            transform: "rotate(-15deg)",
            animation: "sweep 12s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />
        <style>{`
          @keyframes sweep {
            0% { transform: translate(-30%, -30%) rotate(-15deg); }
            50% { transform: translate(15%, 15%) rotate(-15deg); }
            100% { transform: translate(-30%, -30%) rotate(-15deg); }
          }
        `}</style>
      </div>

      {/* Premium Centered Layout */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px] flex flex-col items-center justify-center"
      >
        {/* Pulsing Connected-Nodes SVG Logo */}
        <div className="relative flex justify-center mb-8">
          {/* Soft cyan radial glow behind the logo */}
          <div className="absolute -inset-10 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <svg
            className="w-16 h-16 relative text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.45)]"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft glowing line with pulse animation */}
            <motion.path
              d="M16 32 C24 20, 40 44, 48 32"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              animate={{
                opacity: [0.75, 1, 0.75],
                strokeWidth: [3, 4, 3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Connected auxiliary guide line */}
            <path
              d="M20 25 C26 35, 34 32, 38 23"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 3"
              className="opacity-25"
            />
            {/* Left node */}
            <motion.circle
              cx="16"
              cy="32"
              r="4.5"
              fill="#ffffff"
              animate={{
                scale: [1, 1.25, 1],
                filter: ["drop-shadow(0 0 2px rgba(255,255,255,0.4))", "drop-shadow(0 0 6px rgba(255,255,255,0.8))", "drop-shadow(0 0 2px rgba(255,255,255,0.4))"]
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Center active node */}
            <motion.circle
              cx="32"
              cy="33"
              r="5.5"
              fill="currentColor"
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Right node */}
            <motion.circle
              cx="48"
              cy="32"
              r="4"
              fill="#ffffff"
              animate={{
                scale: [1, 1.25, 1],
                filter: ["drop-shadow(0 0 2px rgba(255,255,255,0.4))", "drop-shadow(0 0 6px rgba(255,255,255,0.8))", "drop-shadow(0 0 2px rgba(255,255,255,0.4))"]
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
          </svg>
        </div>

        {/* AirLink Text with Wide Spacing & Slight Glow on LINK */}
        <div className="mb-12">
          <h1 className="font-sans font-bold text-[44px] tracking-[0.24em] text-white uppercase select-none leading-none">
            Air<span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">Link</span>
          </h1>
        </div>

        {/* CTA Launch Button & Supporting elements */}
        <div className="flex flex-col items-center w-full">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            onClick={handleStartClick}
            disabled={permissionState === 'loading'}
            className="w-full max-w-[240px] bg-[#030303]/40 border border-cyan-500/25 hover:border-cyan-400 text-white rounded-full py-4 px-8 font-sans text-[11px] font-bold uppercase tracking-[0.22em] transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-center cursor-pointer"
          >
            {permissionState === 'loading' ? 'Initializing...' : 'Start Camera'}
          </motion.button>

          {permissionState === 'denied' && (
            <div className="mt-8 p-4 rounded-xl bg-red-950/20 border border-red-500/10 text-red-100 text-[11px] font-mono leading-relaxed max-w-xs mx-auto shadow-[0_4px_12px_rgba(239,68,68,0.05)]">
              Camera access was blocked. Please allow camera permission to use AirLink.
            </div>
          )}
        </div>

      </motion.div>

      {/* PREMIUM CUSTOM PERMISSION MODAL */}
      <AnimatePresence>
        {showPermissionModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#0b0b0d]/90 border border-white/10 rounded-2xl w-full max-w-sm p-8 text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-xl relative flex flex-col items-center select-none"
            >
              {/* Decorative mini cyan glow inside the modal */}
              <div className="absolute -inset-10 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Mini AirLink Logo/Icon */}
              <div className="relative w-12 h-12 rounded-full bg-cyan-950/20 border border-cyan-800/30 flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <svg
                  className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.3)]"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 36C19 23 27 23 32 34C37 45 44 45 48 36"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="14" cy="36" r="3.2" fill="#ffffff" />
                  <circle cx="32" cy="34" r="4.2" fill="currentColor" />
                  <circle cx="48" cy="36" r="2.8" fill="#ffffff" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-white uppercase tracking-[0.1em] font-sans mb-3">
                Allow Camera Access
              </h3>

              {/* Description */}
              <p className="text-zinc-400 text-xs tracking-wide leading-relaxed font-sans mb-4 max-w-[280px]">
                AirLink needs your camera to detect hand gestures and let you draw in the air.
              </p>

              {/* Small Note */}
              <p className="text-[10px] font-mono text-zinc-500 tracking-wide leading-relaxed mb-8 max-w-[260px]">
                Your camera stays in your browser. Nothing is uploaded.
              </p>

              {/* Action Buttons */}
              <div className="w-full space-y-3 relative z-10">
                <button
                  onClick={handleAllow}
                  className="w-full py-3 rounded-full text-[11px] font-semibold uppercase tracking-widest text-[#030303] bg-white hover:bg-neutral-100 active:scale-[0.98] transition-all duration-200 shadow-lg cursor-pointer font-sans"
                >
                  Allow Camera
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full py-3 rounded-full text-[11px] font-semibold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 active:scale-[0.98] transition-all duration-200 cursor-pointer font-sans"
                >
                  Cancel
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
