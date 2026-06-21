/**
 * AirLink Gesture Recognition Utility
 * Classifies 21-point MediaPipe hand landmarks into distinct interactive gestures.
 */

export type GestureType = 'IDLE' | 'DRAW' | 'ERASE' | 'READY' | 'idle' | 'drawing' | 'erasing' | 'ready' | 'undetected';

export interface GestureDetectionResult {
  gesture: GestureType;
  confidence: number;
  activePoint: { x: number; y: number } | null;
  extendedFingers: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
}

/**
 * Exact gesture analysis function requested by the user
 */
export function detectGesture(landmarks: any[]): GestureType {
  const indexUp = landmarks[8].y < landmarks[6].y;
  const middleUp = landmarks[12].y < landmarks[10].y;
  const ringUp = landmarks[16].y < landmarks[14].y;
  const pinkyUp = landmarks[20].y < landmarks[18].y;

  if (indexUp && !middleUp && !ringUp && !pinkyUp) return "DRAW";
  if (indexUp && middleUp && ringUp && pinkyUp) return "ERASE";
  if (!indexUp && !middleUp && !ringUp && !pinkyUp) return "IDLE";
  return "READY";
}

/**
 * Normalizes and classifies standard landmarks array to determine gestures
 */
export function analyzeHandPose(landmarks: any[]): GestureDetectionResult {
  if (!landmarks || landmarks.length < 21) {
    return {
      gesture: 'undetected',
      confidence: 0,
      activePoint: null,
      extendedFingers: { thumb: false, index: false, middle: false, ring: false, pinky: false }
    };
  }

  const gesture = detectGesture(landmarks);
  const indexTip = landmarks[8];
  
  // Track coordinates of the index finger tip for drawing/erasing actions
  // We mirror the X coordinate because webcams are mirrored for intuitive hand-eye drawing
  const activePoint = {
    x: 1 - indexTip.x,
    y: indexTip.y
  };

  const indexUp = landmarks[8].y < landmarks[6].y;
  const middleUp = landmarks[12].y < landmarks[10].y;
  const ringUp = landmarks[16].y < landmarks[14].y;
  const pinkyUp = landmarks[20].y < landmarks[18].y;

  return {
    gesture,
    confidence: 0.95,
    activePoint,
    extendedFingers: {
      thumb: false,
      index: indexUp,
      middle: middleUp,
      ring: ringUp,
      pinky: pinkyUp
    }
  };
}

/**
 * Draws a clean, futuristic tactical cursor at the index fingertip.
 * This completely isolates tracking noise and avoids full hand clutter.
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  gesture: GestureType,
  width: number,
  height: number
) {
  if (!landmarks || landmarks.length < 21) return;

  const indexTip = landmarks[8];
  if (!indexTip) return;

  const px = (1 - indexTip.x) * width;
  const py = indexTip.y * height;

  let primaryColor = '#06b6d4'; // Cyan for drawing
  if (gesture === 'ERASE' || gesture === 'erasing') {
    primaryColor = '#ec4899'; // Pink/Magenta for erase
  } else if (gesture === 'IDLE' || gesture === 'idle') {
    primaryColor = '#f59e0b'; // Amber for Idle
  }

  ctx.save();
  
  // Single subtle glowing ring and dot on index fingertip
  ctx.shadowBlur = 8;
  ctx.shadowColor = primaryColor;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = primaryColor;
  
  ctx.beginPath();
  ctx.arc(px, py, 8, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(px, py, 2, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 4;
  ctx.fill();

  ctx.restore();
}
