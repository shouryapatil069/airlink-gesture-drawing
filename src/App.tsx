/**
 * AirLink - Space Gesture Drawing Application
 * High-Immersion Cinematic Fullscreen Orchestrator
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, RefreshCw, Zap, Sparkles, HelpCircle, Eye, EyeOff, X, LogOut, FlipHorizontal } from 'lucide-react';
import { analyzeHandPose, drawSkeleton, detectGesture } from './utils/gesture';
import LandingPage from './components/LandingPage';
import ControlPanel from './components/ControlPanel';
import Legend from './components/Legend';
import LoadingScreen from './components/LoadingScreen';
import { Coords, GestureType } from './types';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  // Session States
  const [isLoading, setIsLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'loading'>('prompt');

  // Interactive Brush parameters
  const [brushColor, setBrushColor] = useState('#06b6d4'); // Cyan default
  const [brushSize, setBrushSize] = useState(8);
  const [eraserSize, setEraserSize] = useState(24);
  const [glowIntensity, setGlowIntensity] = useState(15);

  // Tactical Overlay configs
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [mirrorFeed, setMirrorFeed] = useState(true);
  
  // Modals / Guides toggling
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Real-time capturing indicators
  const [activeGesture, setActiveGesture] = useState<GestureType>('undetected');
  const [detectedCoords, setDetectedCoords] = useState<Coords | null>(null);

  // Canvas Undo histories
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // HTML references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tracking API engines
  const handsRef = useRef<any>(null);
  const cameraInstanceRef = useRef<any>(null);

  // Concurrent variables inside refs to bypass functional state capture freezes
  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);
  const eraserSizeRef = useRef(eraserSize);
  const glowIntensityRef = useRef(glowIntensity);
  const showSkeletonRef = useRef(showSkeleton);
  const prevCoordsRef = useRef<Coords | null>(null);
  const isStrokeActiveRef = useRef(false);

  // Smooth brush size interpolation refs
  const lerpedBrushSizeRef = useRef<number>(brushSize);
  const lerpedEraserSizeRef = useRef<number>(eraserSize);

  // Multi-stroke Undo logs
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Stable tracking and gesture evaluation states
  const gestureBuffer = useRef<string[]>([]);
  const currentGestureRef = useRef<GestureType>('undetected');
  const activeGestureRef = useRef<GestureType>('undetected');
  const latestLandmarksRef = useRef<any>(null);
  const smoothedCoordsRef = useRef<Coords | null>(null);
  const detectedCoordsRef = useRef<Coords | null>(null);
  const lastSliderChangeRef = useRef<{ type: 'brush' | 'eraser', time: number }>({ type: 'brush', time: 0 });

  // Aliases for functional compatibility based on user requirements
  const canvasRef = drawingCanvasRef;
  const previousPointRef = prevCoordsRef;
  const smoothedPointRef = smoothedCoordsRef;
  const cameraRef = cameraInstanceRef;
  const gestureBufferRef = gestureBuffer;

  const setIsCameraOn = (val: boolean) => {
    setCameraActive(val);
    if (!val) {
      setIsStarted(false);
    }
  };

  const setCurrentGesture = (val: string) => {
    setActiveGesture(val as GestureType);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    previousPointRef.current = null;

    // Reset undo history
    const blankData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [blankData];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
  };

  const stopCamera = () => {
    try {
      if (cameraRef.current) {
        if (typeof cameraRef.current.stop === "function") {
          cameraRef.current.stop();
        }
        cameraRef.current = null;
      }

      const video = videoRef.current;

      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        video.pause();
        video.srcObject = null;
        video.removeAttribute("src");
        video.load();
      }

      previousPointRef.current = null;
      smoothedPointRef.current = null;

      setCurrentGesture("READY");
      setIsCameraOn(false);
      setError(null);

      console.log("Camera stopped successfully");
    } catch (err) {
      console.error("Error stopping camera:", err);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // LERP exact function
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  const getStableGesture = (newGesture: string): GestureType => {
    gestureBufferRef.current.push(newGesture);

    if (gestureBufferRef.current.length > 3) {
      gestureBufferRef.current.shift();
    }

    const allSame = gestureBufferRef.current.every(
      (gesture) => gesture === gestureBufferRef.current[0]
    );

    if (allSame) {
      currentGestureRef.current = newGesture as GestureType;
    }

    return currentGestureRef.current;
  };

  // Coordinate tracking variables alignment on sizes
  useEffect(() => {
    brushColorRef.current = brushColor;
  }, [brushColor]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
    lastSliderChangeRef.current = { type: 'brush', time: Date.now() };
  }, [brushSize]);

  useEffect(() => {
    eraserSizeRef.current = eraserSize;
    lastSliderChangeRef.current = { type: 'eraser', time: Date.now() };
  }, [eraserSize]);

  useEffect(() => {
    glowIntensityRef.current = glowIntensity;
  }, [glowIntensity]);

  useEffect(() => {
    showSkeletonRef.current = showSkeleton;
  }, [showSkeleton]);

  // Periodic CDN check
  useEffect(() => {
    const verifyAvailability = () => {
      if (window.Hands && window.Camera) {
        setScriptsLoaded(true);
      } else {
        setTimeout(verifyAvailability, 200);
      }
    };
    verifyAvailability();
  }, []);

  // Sync canvas size to match the browser window boundaries
  const resizeCanvases = () => {
    const dCanvas = drawingCanvasRef.current;
    const oCanvas = overlayCanvasRef.current;
    if (!dCanvas || !oCanvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Snapshot existing artwork before updating sizes
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = dCanvas.width;
    tempCanvas.height = dCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx && dCanvas.width > 0 && dCanvas.height > 0) {
      tempCtx.drawImage(dCanvas, 0, 0);
    }

    // Set new dimension buffers
    dCanvas.width = width;
    dCanvas.height = height;
    oCanvas.width = width;
    oCanvas.height = height;

    // Restore snapshots with scaled boundaries
    const ctx = dCanvas.getContext('2d');
    if (ctx && tempCanvas.width > 0 && tempCanvas.height > 0) {
      ctx.drawImage(tempCanvas, 0, 0, width, height);
    }
  };

  // Bind window listeners
  useEffect(() => {
    if (isStarted) {
      window.addEventListener('resize', resizeCanvases);
      // Wait for React to render elements before calculation
      const timer = setTimeout(() => {
        resizeCanvases();
        clearAndInitializeCanvas();
      }, 200);

      return () => {
        window.removeEventListener('resize', resizeCanvases);
        clearTimeout(timer);
      };
    }
  }, [isStarted]);

  // Push completed stroke to undo log histories
  const pushToHistoryStack = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const sliced = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current = [...sliced, data];
    historyIndexRef.current = historyRef.current.length - 1;

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  };

  // Undo triggers
  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const canvas = drawingCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
        }
      }
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  };

  // Redo triggers
  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const canvas = drawingCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
        }
      }
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  };

  // Initialize black empty stage
  const clearAndInitializeCanvas = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const blankData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [blankData];
    historyIndexRef.current = 0;

    setCanUndo(false);
    setCanRedo(false);
  };

  // Frame processing tick - lightweight buffer logging to prevent React bottlenecking
  const onResults = (results: any) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      latestLandmarksRef.current = results.multiHandLandmarks[0];
    } else {
      latestLandmarksRef.current = null;
    }
  };

  // High performance visual render step running at display refresh rate
  const renderFrame = () => {
    const oCanvas = overlayCanvasRef.current;
    const dCanvas = drawingCanvasRef.current;
    if (!oCanvas || !dCanvas) return;

    const oCtx = oCanvas.getContext('2d');
    const dCtx = dCanvas.getContext('2d');
    if (!oCtx || !dCtx) return;

    // Smooth scaling transitions for preview ring using simple linear interpolation with factor 0.18
    lerpedBrushSizeRef.current = lerpedBrushSizeRef.current + (brushSizeRef.current - lerpedBrushSizeRef.current) * 0.18;
    lerpedEraserSizeRef.current = lerpedEraserSizeRef.current + (eraserSizeRef.current - lerpedEraserSizeRef.current) * 0.18;

    // Reset indicator overlay layer
    oCtx.clearRect(0, 0, oCanvas.width, oCanvas.height);

    const landmarks = latestLandmarksRef.current;
    if (landmarks) {
      const rawGesture = detectGesture(landmarks);

      // Stable gesture classification over 3 consecutive frames
      const stableGesture = getStableGesture(rawGesture);

      if (stableGesture !== activeGestureRef.current) {
        activeGestureRef.current = stableGesture;
        setActiveGesture(stableGesture); // Updates React state on transition only (very low overhead)
      }

      // Reset previousPointRef when gesture changes away from DRAW
      if (stableGesture !== 'DRAW') {
        previousPointRef.current = null;
      }

      // Draw skeleton structures if active (respects toggle, only draws single fingertip cursor)
      if (showSkeletonRef.current) {
        drawSkeleton(oCtx, landmarks, stableGesture, oCanvas.width, oCanvas.height);
      }

      const indexTip = landmarks[8];
      const rawX = (mirrorFeed ? (1 - indexTip.x) : indexTip.x) * oCanvas.width;
      const rawY = indexTip.y * oCanvas.height;

      if (!smoothedPointRef.current) {
        smoothedPointRef.current = { x: rawX, y: rawY };
      } else {
        smoothedPointRef.current.x =
          smoothedPointRef.current.x + (rawX - smoothedPointRef.current.x) * 0.35;
        smoothedPointRef.current.y =
          smoothedPointRef.current.y + (rawY - smoothedPointRef.current.y) * 0.35;
      }

      const x = smoothedPointRef.current.x;
      const y = smoothedPointRef.current.y;

      detectedCoordsRef.current = { x, y };

      // Draw animated space laser pointer and rings on overlay
      oCtx.save();
      
      let targetColor = brushColorRef.current;
      let glowSize = glowIntensityRef.current;

      if (stableGesture === 'ERASE') {
        targetColor = '#ec4899';
        glowSize = 25;
      } else if (stableGesture === 'IDLE') {
        targetColor = '#f59e0b';
        glowSize = 10;
      }

      // Draw outer guideline target ring
      oCtx.beginPath();
      oCtx.arc(
        x,
        y,
        (stableGesture === 'ERASE' ? lerpedEraserSizeRef.current : lerpedBrushSizeRef.current / 2) + 8,
        0,
        2 * Math.PI
      );
      oCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      oCtx.lineWidth = 1;
      oCtx.stroke();

      // Draw inside actual brush/eraser size preview circle
      oCtx.beginPath();
      oCtx.arc(
        x,
        y,
        stableGesture === 'ERASE' ? lerpedEraserSizeRef.current : lerpedBrushSizeRef.current / 2,
        0,
        2 * Math.PI
      );
      if (stableGesture === 'ERASE') {
        oCtx.fillStyle = 'rgba(236, 72, 153, 0.04)'; // high-transparency muted pink fill
        oCtx.fill();
        oCtx.strokeStyle = 'rgba(236, 72, 153, 0.5)'; // subtle custom-opacity stroke
      } else {
        oCtx.fillStyle = `${brushColorRef.current}0c`; // high-transparency brush fill (~5% opacity)
        oCtx.fill();
        oCtx.strokeStyle = `${brushColorRef.current}80`; // subtle brush stroke (~50% opacity)
      }
      oCtx.lineWidth = 1; // ultra-fine clean hairline
      oCtx.shadowBlur = glowSize;
      oCtx.shadowColor = targetColor;
      oCtx.stroke();

      // Draw small white center dot
      oCtx.beginPath();
      oCtx.arc(x, y, 3, 0, 2 * Math.PI);
      oCtx.fillStyle = '#ffffff';
      oCtx.shadowBlur = 0;
      oCtx.fill();

      // Show real-time size label if slider was adjusted within 1.5 seconds
      const now = Date.now();
      const elapsed = now - lastSliderChangeRef.current.time;
      if (elapsed < 1500) {
        oCtx.save();
        oCtx.globalAlpha = elapsed < 500 ? 1 : Math.max(0, 1 - (elapsed - 500) / 1000);
        const isEraser = stableGesture === 'ERASE';
        const rawSize = isEraser ? eraserSizeRef.current : brushSizeRef.current;
        const size = isEraser ? lerpedEraserSizeRef.current : lerpedBrushSizeRef.current / 2;
        const label = isEraser ? `ERASER: ${rawSize}px` : `BRUSH: ${rawSize}px`;
        oCtx.font = '500 10px "JetBrains Mono", monospace';
        oCtx.textAlign = 'center';
        
        const textWidth = oCtx.measureText(label).width;
        oCtx.fillStyle = 'rgba(8, 8, 8, 0.75)';
        oCtx.beginPath();
        if (typeof oCtx.roundRect === 'function') {
          oCtx.roundRect(x - textWidth / 2 - 12, y + size + 14, textWidth + 24, 18, 9);
        } else {
          oCtx.rect(x - textWidth / 2 - 12, y + size + 14, textWidth + 24, 18);
        }
        oCtx.fill();
        oCtx.strokeStyle = 'rgba(255,255,255,0.08)';
        oCtx.lineWidth = 1;
        oCtx.stroke();

        oCtx.fillStyle = '#ffffff';
        oCtx.fillText(label, x, y + size + 26);
        oCtx.restore();
      }

      oCtx.restore();

      // Paintbrush implementation
      if (stableGesture === 'DRAW') {
        dCtx.save();
        dCtx.shadowBlur = glowIntensityRef.current;
        dCtx.shadowColor = brushColorRef.current;
        dCtx.strokeStyle = brushColorRef.current;
        dCtx.lineWidth = brushSizeRef.current;
        dCtx.lineJoin = 'round';
        dCtx.lineCap = 'round';
        dCtx.globalCompositeOperation = 'source-over';

        if (previousPointRef.current) {
          dCtx.beginPath();
          dCtx.moveTo(previousPointRef.current.x, previousPointRef.current.y);
          dCtx.lineTo(x, y);
          dCtx.stroke();
        } else {
          dCtx.beginPath();
          dCtx.arc(x, y, brushSizeRef.current / 2, 0, 2 * Math.PI);
          dCtx.fillStyle = brushColorRef.current;
          dCtx.fill();
        }
        dCtx.restore();

        previousPointRef.current = { x, y };
        isStrokeActiveRef.current = true;
      } else if (stableGesture === 'ERASE') {
        dCtx.save();
        dCtx.globalCompositeOperation = 'destination-out';
        dCtx.beginPath();
        dCtx.arc(x, y, eraserSizeRef.current, 0, 2 * Math.PI);
        dCtx.fill();
        dCtx.restore();

        if (isStrokeActiveRef.current) {
          pushToHistoryStack();
          isStrokeActiveRef.current = false;
        }
        previousPointRef.current = null;
      } else {
        if (isStrokeActiveRef.current) {
          pushToHistoryStack();
          isStrokeActiveRef.current = false;
        }
        previousPointRef.current = null;
      }
    } else {
      if (activeGestureRef.current !== 'undetected') {
        activeGestureRef.current = 'undetected';
        setActiveGesture('undetected');
      }

      gestureBufferRef.current = [];
      currentGestureRef.current = 'undetected';
      smoothedPointRef.current = null;

      if (isStrokeActiveRef.current) {
        pushToHistoryStack();
        isStrokeActiveRef.current = false;
      }
      previousPointRef.current = null;

      // Draw interactive brush/eraser size preview ring on overlay when slider is adjusted while hand is not in view
      const now = Date.now();
      const elapsed = now - lastSliderChangeRef.current.time;
      if (elapsed < 1500) {
        const opacity = elapsed < 500 ? 1 : Math.max(0, 1 - (elapsed - 500) / 1000);
        
        const x = detectedCoordsRef.current?.x ?? oCanvas.width / 2;
        const y = detectedCoordsRef.current?.y ?? oCanvas.height / 2;
        
        const isEraser = lastSliderChangeRef.current.type === 'eraser';
        const rawSize = isEraser ? eraserSizeRef.current : brushSizeRef.current;
        const size = isEraser ? lerpedEraserSizeRef.current : lerpedBrushSizeRef.current / 2;
        const targetColor = isEraser ? '#ec4899' : brushColorRef.current;
        const glowSize = isEraser ? 25 : glowIntensityRef.current;

        oCtx.save();
        oCtx.globalAlpha = opacity;

        // Outer guideline ring
        oCtx.beginPath();
        oCtx.arc(x, y, size + 8, 0, 2 * Math.PI);
        oCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        oCtx.lineWidth = 1;
        oCtx.stroke();

        // Inside actual size preview circle
        oCtx.beginPath();
        oCtx.arc(x, y, size, 0, 2 * Math.PI);
        if (isEraser) {
          oCtx.fillStyle = 'rgba(236, 72, 153, 0.04)'; // high-transparency muted pink fill
          oCtx.fill();
          oCtx.strokeStyle = 'rgba(236, 72, 153, 0.5)'; // subtle custom-opacity stroke
        } else {
          oCtx.fillStyle = `${brushColorRef.current}0c`; // high-transparency brush fill (~5% opacity)
          oCtx.fill();
          oCtx.strokeStyle = `${brushColorRef.current}80`; // subtle brush stroke (~50% opacity)
        }
        oCtx.lineWidth = 1; // ultra-fine clean hairline
        oCtx.shadowBlur = glowSize;
        oCtx.shadowColor = targetColor;
        oCtx.stroke();

        // Small white central dot
        oCtx.beginPath();
        oCtx.arc(x, y, 3, 0, 2 * Math.PI);
        oCtx.fillStyle = '#ffffff';
        oCtx.shadowBlur = 0;
        oCtx.fill();

        // Elegant indicator label
        oCtx.shadowBlur = 0;
        const label = isEraser ? `ERASER: ${rawSize}px` : `BRUSH: ${rawSize}px`;
        oCtx.font = '500 10px "JetBrains Mono", monospace';
        oCtx.textAlign = 'center';
        
        const textWidth = oCtx.measureText(label).width;
        oCtx.fillStyle = 'rgba(8, 8, 8, 0.75)';
        oCtx.beginPath();
        if (typeof oCtx.roundRect === 'function') {
          oCtx.roundRect(x - textWidth / 2 - 12, y + size + 14, textWidth + 24, 18, 9);
        } else {
          oCtx.rect(x - textWidth / 2 - 12, y + size + 14, textWidth + 24, 18);
        }
        oCtx.fill();
        oCtx.strokeStyle = 'rgba(255,255,255,0.08)';
        oCtx.lineWidth = 1;
        oCtx.stroke();

        oCtx.fillStyle = '#ffffff';
        oCtx.fillText(label, x, y + size + 26);

        oCtx.restore();
      }
    }
  };

  // Setup non-blocking requestAnimationFrame rendering loop
  useEffect(() => {
    let rafId: number;
    const processLoop = () => {
      renderFrame();
      rafId = requestAnimationFrame(processLoop);
    };

    if (isStarted && cameraActive) {
      rafId = requestAnimationFrame(processLoop);
    }

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isStarted, cameraActive]);

  // Close webcam resources and destroy worker stream loops
  const releaseCameraResources = () => {
    if (cameraInstanceRef.current) {
      try {
        cameraInstanceRef.current.stop();
      } catch (e) {
        console.warn('Subsystem camera halt issue:', e);
      }
      cameraInstanceRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('Video track kill issue:', e);
      }
      videoRef.current.srcObject = null;
    }

    const oCtx = overlayCanvasRef.current?.getContext('2d');
    if (oCtx) oCtx.clearRect(0, 0, overlayCanvasRef.current!.width, overlayCanvasRef.current!.height);

    setActiveGesture('undetected');
    setDetectedCoords(null);
    setCameraLoading(false);
  };

  // Stream toggling effect
  useEffect(() => {
    if (!isStarted || !cameraActive) {
      releaseCameraResources();
      stopCamera();
      return;
    }

    let active = true;
    setCameraLoading(true);

    const activateCamera = async () => {
      try {
        const sourceStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!active) {
          sourceStream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = sourceStream;
          videoRef.current.play().catch((err) => {
            if (err.name !== 'AbortError') {
              console.error('Video play failure:', err);
            }
          });
        }

        if (!handsRef.current) {
          const hands = new window.Hands({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
          });

          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.75,
            minTrackingConfidence: 0.75,
          });

          hands.onResults(onResults);
          handsRef.current = hands;
        }

        if (videoRef.current) {
          const cameraInstance = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (active && handsRef.current && videoRef.current) {
                try {
                  await handsRef.current.send({ image: videoRef.current });
                } catch (e) {
                  console.error('Core send frame error:', e);
                }
              }
            },
            width: 1280,
            height: 720,
          });

          cameraInstanceRef.current = cameraInstance;
          await cameraInstance.start();
        }

        setCameraLoading(false);
        setPermissionState('granted');
      } catch (err) {
        console.error('Sensors validation block or setup error:', err);
        setCameraLoading(false);
        setPermissionState('denied');
        setCameraActive(false);
      }
    };

    activateCamera();

    return () => {
      active = false;
      releaseCameraResources();
      stopCamera();
    };
  }, [isStarted, cameraActive]);

  // Purge canvas with confirm dialog
  const resetWorkspace = () => {
    if (window.confirm('Clear all drawings? This action cannot be reversed.')) {
      clearAndInitializeCanvas();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Listen to keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        exportArtworkAsPNG();
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handleUndo();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        clearCanvas();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'g' || e.key === '?') {
        e.preventDefault();
        setShowGuideModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canUndo, canRedo]);

  // Download export helper that fits perfectly to fullscreen context
  const exportArtworkAsPNG = () => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;

    const saverCanvas = document.createElement('canvas');
    saverCanvas.width = drawingCanvas.width;
    saverCanvas.height = drawingCanvas.height;
    const ctx = saverCanvas.getContext('2d');
    if (!ctx) return;

    // Dark sleek gradient backplate for a premium cyber feel
    const grad = ctx.createLinearGradient(0, 0, 0, saverCanvas.height);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(1, '#080c14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, saverCanvas.width, saverCanvas.height);

    // Grid details
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.035)';
    ctx.lineWidth = 1;
    const size = 60;
    for (let x = 0; x < saverCanvas.width; x += size) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, saverCanvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < saverCanvas.height; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(saverCanvas.width, y);
      ctx.stroke();
    }

    // Watermark Details
    ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.fillText('⚡ AIRLINK CREATIVE SYSTEM', 40, saverCanvas.height - 40);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText('RECONSTRUCTION MODE: FULLSCREEN MATRIX LANDMARKS', 40, saverCanvas.height - 20);

    // Merge painted stroke layer
    ctx.drawImage(drawingCanvas, 0, 0);

    const dataUrl = saverCanvas.toDataURL('image/png');
    const trigger = document.createElement('a');
    trigger.href = dataUrl;
    trigger.download = `AirLink_${Date.now()}.png`;
    trigger.click();
  };

  // 0. Premium Initial Loading Gate
  if (isLoading) {
    return (
      <AnimatePresence mode="wait">
        <LoadingScreen key="loading" onComplete={() => setIsLoading(false)} duration={1800} />
      </AnimatePresence>
    );
  }

  // Initial loader
  if (!scriptsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#030303] text-white p-6 select-none relative">
        <div className="absolute inset-0 bg-[radial-gradient(#1c1c1c_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_100%,transparent_100%)] opacity-30 pointer-events-none" />
        <div className="space-y-4 text-center max-w-xs z-10">
          <div className="relative inline-flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="font-sans font-light text-sm uppercase tracking-[0.2em] text-[#f5f5f5]">Loading AirLink</h2>
            <p className="text-neutral-500 text-[10px] font-mono tracking-wide leading-relaxed">
              Configuring MediaPipe CDN sensors and fast WebGL canvas overlays...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 1. Initial Launch Landing page
  if (!isStarted || !cameraActive) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#030303] min-h-screen text-white font-sans selection:bg-cyan-500/10"
      >
        <LandingPage
          onStart={() => {
            setIsStarted(true);
            setCameraActive(true);
          }}
          permissionState={permissionState}
        />
      </motion.div>
    );
  }

  // 2. Immersive Fullscreen drawing view
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030303] text-white select-none">
      
      {/* BACKGROUND WEBCAM LAYER */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        style={{ transform: mirrorFeed ? 'scaleX(-1)' : 'none' }}
        playsInline
        muted
      />

      {/* DRAWING CANVAS LAYER */}
      <canvas
        ref={drawingCanvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      />

      {/* OVERLAY SKELETON & POINTER LAYER */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full z-20 pointer-events-none"
      />

      {/* BLACK CINEMATICAL OVERLAY */}
      <div className="absolute inset-0 bg-black/45 backdrop-brightness-[0.7] backdrop-contrast-[1.15] bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)] pointer-events-none z-[5]" />

      {/* CAMERA LOADING PROCESS STATE */}
      {cameraLoading && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-40">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin stroke-[1.5]" />
          <div className="text-center space-y-1">
            <h3 className="font-sans font-light text-xs uppercase tracking-widest text-[#f5f5f5]">
              Connecting Camera
            </h3>
            <p className="font-mono text-[9px] text-neutral-500 max-w-xs leading-normal">
              Resolving capture stream components...
            </p>
          </div>
        </div>
      )}

      {/* TOP-LEFT COMPACT TOOLBAR CONTROLS */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-1.5 pointer-events-auto">
        
        {/* Exit button */}
        <button
          onClick={() => {
            if (window.confirm("Exit draw studio? Unsaved progress will be destroyed.")) {
              stopCamera();
            }
          }}
          className="h-8 w-8 rounded-xl bg-[#080808]/70 backdrop-blur-md border border-white/[0.08] flex items-center justify-center text-neutral-300 hover:text-white hover:bg-[#141414]/80 hover:border-white/20 transition-all duration-200 active:scale-95 cursor-pointer"
          title="Exit Draw Studio"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>

        {/* Camera Toggle Button */}
        <button
          onClick={() => {
            if (cameraActive) {
              stopCamera();
            } else {
              setCameraActive(true);
            }
          }}
          className={`h-8 px-2.5 rounded-xl font-sans font-medium text-[10px] uppercase tracking-wider transition-all duration-200 border flex items-center gap-1.5 cursor-pointer ${
            cameraActive
              ? 'bg-[#080808]/70 border-emerald-500/20 text-emerald-400'
              : 'bg-[#080808]/70 border-white/[0.08] text-neutral-500 hover:text-[#f5f5f5] hover:border-white/20'
          }`}
          title="Toggle camera feed input"
        >
          {cameraActive ? <Camera className="w-3.5 h-3.5 animate-pulse" /> : <CameraOff className="w-3.5 h-3.5" />}
          <span>Camera</span>
        </button>

        {/* Pointer Overlay Toggle Button */}
        <button
          onClick={() => setShowSkeleton(!showSkeleton)}
          className={`h-8 px-2.5 rounded-xl font-sans font-medium text-[10px] uppercase tracking-wider transition-all duration-200 border flex items-center gap-1.5 cursor-pointer ${
            showSkeleton
              ? 'bg-[#080808]/70 border-cyan-500/20 text-cyan-400'
              : 'bg-[#080808]/70 border-white/[0.08] text-neutral-500 hover:text-[#f5f5f5] hover:border-white/20'
          }`}
          title="Toggle skeleton tracking guide overlay"
        >
          {showSkeleton ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Skeleton</span>
        </button>

        {/* Mirror Direction Toggle Button */}
        <button
          onClick={() => setMirrorFeed(!mirrorFeed)}
          className={`h-8 px-2.5 rounded-xl font-sans font-medium text-[10px] uppercase tracking-wider transition-all duration-200 border flex items-center gap-1.5 cursor-pointer bg-[#080808]/70 border-white/[0.08] hover:text-white hover:border-white/20 text-neutral-300`}
          title="Mirror camera output horizontally"
        >
          <FlipHorizontal className="w-3.5 h-3.5" />
          <span>Mirror</span>
        </button>
      </div>

      {/* RIGHT SIDE FLOATING VERTICAL CONTROL PANEL */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 right-0 z-50 pointer-events-none"
      >
        <ControlPanel
          brushColor={brushColor}
          setBrushColor={setBrushColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          eraserSize={eraserSize}
          setEraserSize={setEraserSize}
          glowIntensity={glowIntensity}
          setGlowIntensity={setGlowIntensity}
          onClear={clearCanvas}
          onUndo={handleUndo}
          canUndo={canUndo}
          onRedo={handleRedo}
          canRedo={canRedo}
          onDownload={exportArtworkAsPNG}
          onToggleGuide={() => setShowGuideModal(true)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      </motion.div>

      {/* BOTTOM-CENTER COGENT GESTURE STATUS PILL */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="bg-[#080808]/70 backdrop-blur-[18px] border border-white/[0.08] px-3.5 py-1.5 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex items-center gap-2">
          
          <span className={`w-1 h-1 rounded-full ${
            activeGesture === 'DRAW' ? 'bg-cyan-400 animate-pulse' :
            activeGesture === 'ERASE' ? 'bg-pink-400 animate-pulse' :
            activeGesture === 'IDLE' ? 'bg-amber-400' :
            activeGesture === 'READY' ? 'bg-emerald-400' :
            'bg-neutral-600'
          }`} />

          <span className="font-sans font-semibold text-[8px] tracking-[0.2em] uppercase text-neutral-200">
            {activeGesture === 'DRAW' && 'DRAWING'}
            {activeGesture === 'ERASE' && 'ERASING'}
            {activeGesture === 'IDLE' && 'IDLE'}
            {activeGesture === 'READY' && 'READY'}
            {activeGesture === 'undetected' && 'NO HAND'}
          </span>

        </div>
      </div>

      {/* FLOATING MODAL DIALOG: GESTURE GUIDE */}
      {showGuideModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-6 pointer-events-auto">
          <div className="relative max-w-sm w-full bg-[#080808] rounded-3xl p-6 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Closer */}
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute right-5 top-5 w-7 h-7 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Gesture Legend container */}
            <Legend
              activeGesture={activeGesture}
              brushColor={brushColor}
              brushSize={brushSize}
            />

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded-full border border-white/15 hover:border-white/25 hover:bg-white/5 text-[#f5f5f5] font-semibold text-[10px] uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Return to Air Canvas
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
