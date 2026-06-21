/**
 * AirLink Global TypeScript Type Definitions
 */

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export type GestureType = 'IDLE' | 'DRAW' | 'ERASE' | 'READY' | 'idle' | 'drawing' | 'erasing' | 'ready' | 'undetected';

export interface Coords {
  x: number;
  y: number;
}
