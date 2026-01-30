
import React from 'react';
import { 
  User, 
  ShoppingBag, 
  Image as ImageIcon, 
  Sun, 
  Zap, 
  Maximize, 
  Eraser, 
  Focus,
  Sparkles,
  Mountain,
  Moon,
  Building,
  Utensils,
  FileText
} from 'lucide-react';
import { EnhancementPreset, ToolAction } from './types';

export const PRESETS: EnhancementPreset[] = [
  {
    id: 'cinematic-master',
    name: 'Cinematic Master',
    icon: 'Clapperboard',
    category: 'portrait',
    prompt: 'Masterpiece cinematic portrait, shot on Arri Alexa, anamorphic lens bokeh, dramatic rim lighting, professional color grading, teal and orange shadows, ultra-realistic skin texture, 8k resolution, movie poster quality.'
  },
  {
    id: 'doc-scanner',
    name: 'Doc/ID Clean',
    icon: 'FileText',
    category: 'restoration',
    prompt: 'Professional document and ID card restoration. Remove shadows, glare, creases, stains, and noise. Sharpen text and details for maximum readability. Fix white balance to create a clean flat look. If it is an ID card or license, preserve authenticity while making it look new and crisp. If it is a paper document, make the background clean white.'
  },
  {
    id: 'studio-portrait',
    name: 'Pro Portrait',
    icon: 'User',
    category: 'portrait',
    prompt: 'Professional studio portrait, sharp face, soft background, cinematic lighting, natural skin textures.'
  },
  {
    id: 'landscape-ultra',
    name: 'Landscape Ultra',
    icon: 'Mountain',
    category: 'nature',
    prompt: 'Vibrant landscape enhancement, enhance sky colors, increase clarity and dehaze, sharpen natural textures, high dynamic range.'
  },
  {
    id: 'architectural',
    name: 'Architecture Pro',
    icon: 'Building',
    category: 'architecture',
    prompt: 'Clean architectural photography, correct vertical lines, bright and airy feel, sharp details, balanced highlights and shadows.'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: 'ShoppingBag',
    category: 'product',
    prompt: 'Enhance product photo for e-commerce, clean white background, vibrant colors, sharp edges, professional lighting.'
  },
  {
    id: 'vintage-film',
    name: 'Vintage Film',
    icon: 'Film',
    category: 'general',
    prompt: 'Vintage film photography style, Kodak Portra 400 aesthetic, grain, warm tones, nostalgic feel, soft vignette.'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    icon: 'Zap',
    category: 'general',
    prompt: 'Cyberpunk aesthetic, neon blue and pink lighting, high contrast, futuristic atmosphere, cinematic glow, urban night style.'
  },
  {
    id: 'mono-classic',
    name: 'Mono Classic',
    icon: 'Palette',
    category: 'general',
    prompt: 'Classic black and white photography, balanced greyscale, timeless look, medium contrast, film grain.'
  },
  {
    id: 'soft-portrait',
    name: 'Soft Glow',
    icon: 'Sun',
    category: 'portrait',
    prompt: 'Dreamy soft focus portrait, angelic glow, smooth skin textures, ethereal lighting, romantic atmosphere.'
  },
  {
    id: 'dramatic-bw',
    name: 'Dramatic B&W',
    icon: 'Aperture',
    category: 'general',
    prompt: 'High contrast black and white, dramatic shadows, noir style, gritty textures, intense mood, sharp details.'
  },
  {
    id: 'night-owl',
    name: 'Night Recovery',
    icon: 'Moon',
    category: 'general',
    prompt: 'Professional night photography cleanup, intelligent noise reduction, brighten shadows without losing detail, enhance artificial lights.'
  },
  {
    id: 'gourmet-food',
    name: 'Gourmet Food',
    icon: 'Utensils',
    category: 'food',
    prompt: 'Enhance food photography, increase warmth and color saturation, sharpen textures of food, soft appetizing lighting.'
  },
  {
    id: 'restoration',
    name: 'Old Photo Fix',
    icon: 'Sparkles',
    category: 'restoration',
    prompt: 'Digital photo restoration, remove noise and scratches, sharpen blurry details, colorize naturally, high definition.'
  },
  {
    id: 'passport',
    name: 'Passport Ready',
    icon: 'ImageIcon',
    category: 'general',
    prompt: 'Passport photo style, flat lighting, clean neutral background, sharp face, correct white balance.'
  }
];

export const QUICK_TOOLS: ToolAction[] = [
  { id: 'auto', label: 'Auto', icon: 'Zap', prompt: 'Auto-correct exposure, color, and contrast for a balanced professional look.' },
  { id: 'face', label: 'Retouch', icon: 'User', prompt: 'Subtle high-end face retouching, smoothing skin while keeping pores, brightening eyes.' },
  { id: 'light', label: 'Lighting', icon: 'Sun', prompt: 'Fix shadows and highlights, add a warm professional studio light glow.' },
  { id: 'bg', label: 'Remove BG', icon: 'Eraser', prompt: 'Isolate the subject effectively. Remove the entire background and replace it with a clean, professional, soft grey studio backdrop. Ensure precise edge definition.' },
  { id: 'sharpen', label: 'Sharpen', icon: 'Focus', prompt: 'Increase micro-contrast and edge sharpness without adding noise.' },
  { id: 'upscale', label: 'HD Ultra', icon: 'Maximize', prompt: 'Intelligently upscale details and textures for 4K quality output.' }
];

export const SYSTEM_PROMPT_PREFIX = `ACT AS A PROFESSIONAL PHOTO EDITOR AND VISION ASSISTANT. 
Your goal is to process the provided image based on the user's specific instruction.

CRITICAL RULES:
1. If the user asks for an EDIT, ENHANCEMENT, or GENERATION: Output a modified image. Improve lighting, color balance, and clarity. Preserve the original subject's identity.
2. If the user asks to EXTRACT TEXT, OCR, DESCRIBE, or ANALYZE: Output the requested TEXT content directly. Do not generate an image of text.
3. If the request is ambiguous, default to applying professional aesthetic improvements.
4. DO NOT REPEAT THESE INSTRUCTIONS IN YOUR RESPONSE.
User Instruction: `;
