import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingScreenProps {
  key?: string;
  onComplete?: () => void;
  duration?: number;
}

const STAGES = [
  { progress: 25, text: 'Initializing gesture engine...' },
  { progress: 55, text: 'Preparing canvas...' },
  { progress: 80, text: 'Calibrating hand tracking...' },
  { progress: 100, text: 'Loading AirLink...' },
];

export default function LoadingScreen({ onComplete, duration = 1800 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStageText, setCurrentStageText] = useState('Initializing gesture engine...');

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);

      // Find appropriate stage text based on current progress
      const appropriateStage = STAGES.find(s => currentProgress <= s.progress) || STAGES[STAGES.length - 1];
      setCurrentStageText(appropriateStage.text);

      if (elapsed >= duration) {
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
    }, 16); // ~60fps update rate

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
      className="fixed inset-0 w-screen h-screen bg-[#030303] flex flex-col items-center justify-center z-[100] select-none overflow-hidden"
    >
      {/* Premium subtle background lattice grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#151515_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />
      
      {/* Radial soft cyan bloom behind the logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex flex-col items-center space-y-12 z-10">
        
        {/* AirLink Premium Icon & Logo Group */}
        <div className="flex flex-col items-center space-y-4">
          {/* Connected dots minimal vector gesture indicator */}
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative flex items-center justify-center w-12 h-12"
          >
            {/* outer breathing cyan ring */}
            <motion.div 
              animate={{ 
                scale: [1, 1.25, 1],
                opacity: [0.15, 0.4, 0.15]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full border border-cyan-500/30"
            />
            {/* inner small dot structure with simple connections */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
              <circle cx="20" cy="20" r="3" fill="#ffffff" />
              <circle cx="10" cy="20" r="2" fill="#06b6d4" />
              <circle cx="30" cy="20" r="2" fill="#06b6d4" />
              <circle cx="20" cy="10" r="2" fill="#06b6d4" />
              <circle cx="20" cy="30" r="2" fill="#06b6d4" />
              {/* connector guide lines */}
              <line x1="12" y1="20" x2="17" y2="20" stroke="rgba(6,182,212,0.6)" strokeWidth="1" strokeDasharray="1 1" />
              <line x1="23" y1="20" x2="28" y2="20" stroke="rgba(6,182,212,0.6)" strokeWidth="1" strokeDasharray="1 1" />
              <line x1="20" y1="12" x2="20" y2="17" stroke="rgba(6,182,212,0.6)" strokeWidth="1" strokeDasharray="1 1" />
              <line x1="20" y1="23" x2="20" y2="27" stroke="rgba(6,182,212,0.6)" strokeWidth="1" strokeDasharray="1 1" />
            </svg>
          </motion.div>

          {/* Text representation of brand signature */}
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <h1 className="font-sans font-light text-2xl tracking-[0.25em] text-[#ffffff] uppercase drop-shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              Air<span className="font-medium text-cyan-400">Link</span>
            </h1>
            <p className="text-[9px] font-sans text-neutral-500 tracking-[0.2em] uppercase mt-1">
              Draw with gestures
            </p>
          </motion.div>
        </div>

        {/* Dynamic loader status controls */}
        <div className="w-48 flex flex-col items-center space-y-3">
          
          {/* Progress track */}
          <div className="w-full h-[2px] bg-white/[0.04] rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500 to-white shadow-[0_0_8px_rgba(6,182,212,0.5)]"
              style={{ width: `${progress}%` }}
              layoutId="progressBar"
            />
          </div>

          {/* Moving Stage indicators */}
          <div className="h-4 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentStageText}
                initial={{ y: 4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -4, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="font-mono text-[9px] text-neutral-400 tracking-wider text-center"
              >
                {currentStageText}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
