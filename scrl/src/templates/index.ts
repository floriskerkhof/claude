export type SlotShape = 'rect' | 'circle' | 'polaroid';

export interface Slot {
  id: number;
  // All values are 0–1 fractions of the canvas size
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees
  shape: SlotShape;
  zIndex?: number;
}

export interface Template {
  id: string;
  name: string;
  emoji: string;
  photoCount: number;
  backgroundColor: string;
  slots: Slot[];
  /** Optional decorative text label */
  label?: string;
}

export const TEMPLATES: Template[] = [
  {
    id: 'grid-2x2',
    name: '2×2 Grid',
    emoji: '▦',
    photoCount: 4,
    backgroundColor: '#faf8f5',
    slots: [
      { id: 0, x: 0.02, y: 0.02, width: 0.47, height: 0.47, shape: 'rect' },
      { id: 1, x: 0.51, y: 0.02, width: 0.47, height: 0.47, shape: 'rect' },
      { id: 2, x: 0.02, y: 0.51, width: 0.47, height: 0.47, shape: 'rect' },
      { id: 3, x: 0.51, y: 0.51, width: 0.47, height: 0.47, shape: 'rect' },
    ],
  },
  {
    id: 'grid-3x3',
    name: '3×3 Grid',
    emoji: '⊞',
    photoCount: 9,
    backgroundColor: '#faf8f5',
    slots: [
      { id: 0, x: 0.01, y: 0.01, width: 0.32, height: 0.32, shape: 'rect' },
      { id: 1, x: 0.34, y: 0.01, width: 0.32, height: 0.32, shape: 'rect' },
      { id: 2, x: 0.67, y: 0.01, width: 0.32, height: 0.32, shape: 'rect' },
      { id: 3, x: 0.01, y: 0.34, width: 0.32, height: 0.32, shape: 'rect' },
      { id: 4, x: 0.34, y: 0.34, width: 0.32, height: 0.32, shape: 'rect' },
      { id: 5, x: 0.67, y: 0.34, width: 0.32, height: 0.32, shape: 'rect' },
      { id: 6, x: 0.01, y: 0.67, width: 0.32, height: 0.32, shape: 'rect' },
      { id: 7, x: 0.34, y: 0.67, width: 0.32, height: 0.32, shape: 'rect' },
      { id: 8, x: 0.67, y: 0.67, width: 0.32, height: 0.32, shape: 'rect' },
    ],
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    emoji: '✦',
    photoCount: 3,
    backgroundColor: '#fff9f0',
    slots: [
      { id: 0, x: 0.05, y: 0.03, width: 0.9, height: 0.55, shape: 'rect', zIndex: 1 },
      { id: 1, x: 0.03, y: 0.60, width: 0.45, height: 0.37, shape: 'rect' },
      { id: 2, x: 0.52, y: 0.60, width: 0.45, height: 0.37, shape: 'rect' },
    ],
  },
  {
    id: 'collage',
    name: 'Collage',
    emoji: '✂',
    photoCount: 4,
    backgroundColor: '#f5f0eb',
    slots: [
      { id: 0, x: 0.03, y: 0.04, width: 0.50, height: 0.44, rotation: -3, shape: 'polaroid', zIndex: 1 },
      { id: 1, x: 0.45, y: 0.08, width: 0.50, height: 0.44, rotation: 4, shape: 'polaroid', zIndex: 2 },
      { id: 2, x: 0.05, y: 0.50, width: 0.48, height: 0.44, rotation: 2, shape: 'polaroid', zIndex: 1 },
      { id: 3, x: 0.47, y: 0.54, width: 0.48, height: 0.44, rotation: -2, shape: 'polaroid', zIndex: 2 },
    ],
  },
  {
    id: 'strip',
    name: 'Film Strip',
    emoji: '🎞',
    photoCount: 3,
    backgroundColor: '#1a1a1a',
    slots: [
      { id: 0, x: 0.05, y: 0.10, width: 0.90, height: 0.25, shape: 'rect' },
      { id: 1, x: 0.05, y: 0.375, width: 0.90, height: 0.25, shape: 'rect' },
      { id: 2, x: 0.05, y: 0.65, width: 0.90, height: 0.25, shape: 'rect' },
    ],
  },
  {
    id: 'circles',
    name: 'Bubbles',
    emoji: '◉',
    photoCount: 3,
    backgroundColor: '#e8f4f8',
    slots: [
      { id: 0, x: 0.10, y: 0.05, width: 0.55, height: 0.55, shape: 'circle', zIndex: 2 },
      { id: 1, x: 0.45, y: 0.38, width: 0.50, height: 0.50, shape: 'circle', zIndex: 1 },
      { id: 2, x: 0.02, y: 0.42, width: 0.40, height: 0.40, shape: 'circle', zIndex: 1 },
    ],
  },
  {
    id: 'portrait-duo',
    name: 'Duo',
    emoji: '◫',
    photoCount: 2,
    backgroundColor: '#faf8f5',
    slots: [
      { id: 0, x: 0.02, y: 0.02, width: 0.47, height: 0.96, shape: 'rect' },
      { id: 1, x: 0.51, y: 0.02, width: 0.47, height: 0.96, shape: 'rect' },
    ],
  },
  {
    id: 'hero-small',
    name: 'Hero + 2',
    emoji: '⬛',
    photoCount: 3,
    backgroundColor: '#faf8f5',
    slots: [
      { id: 0, x: 0.02, y: 0.02, width: 0.96, height: 0.60, shape: 'rect' },
      { id: 1, x: 0.02, y: 0.64, width: 0.47, height: 0.34, shape: 'rect' },
      { id: 2, x: 0.51, y: 0.64, width: 0.47, height: 0.34, shape: 'rect' },
    ],
  },
  {
    id: 'polaroid-row',
    name: 'Polaroids',
    emoji: '📷',
    photoCount: 3,
    backgroundColor: '#f0ece8',
    slots: [
      { id: 0, x: 0.02, y: 0.18, width: 0.30, height: 0.38, rotation: -5, shape: 'polaroid' },
      { id: 1, x: 0.34, y: 0.14, width: 0.32, height: 0.40, rotation: 0, shape: 'polaroid' },
      { id: 2, x: 0.66, y: 0.18, width: 0.30, height: 0.38, rotation: 4, shape: 'polaroid' },
    ],
  },
  {
    id: 'one',
    name: 'Solo',
    emoji: '◼',
    photoCount: 1,
    backgroundColor: '#faf8f5',
    slots: [
      { id: 0, x: 0.04, y: 0.04, width: 0.92, height: 0.92, shape: 'rect' },
    ],
  },
];
