
export interface PhotoState {
  original: string | null;
  enhanced: string | null;
  isProcessing: boolean;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  image?: string;
  timestamp: number;
}

export interface EnhancementPreset {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  category: 'portrait' | 'product' | 'restoration' | 'general' | 'nature' | 'architecture' | 'food';
}

export interface ToolAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

export type PaperSize = 'passport' | '4x6' | 'A4' | 'A3';

export type ComparisonMode = 'slider' | 'side-by-side';

export interface PrintSettings {
  size: PaperSize;
  dpi: number;
  orientation: 'portrait' | 'landscape';
  copies: number;
  photosPerSheet?: number;
  fitMode?: 'contain' | 'cover';
  cmykPreview?: boolean;
  paperFinish?: 'matte' | 'glossy';
  showSafeMargins?: boolean;
}

export interface HistoryEntry {
  id: string;
  image: string;
  action: string;
  timestamp: number;
}
