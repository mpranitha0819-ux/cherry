
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, 
  Download, 
  Printer, 
  RotateCcw, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  User, 
  ShoppingBag, 
  Image as ImageIcon, 
  History, 
  Info, 
  Menu, 
  X, 
  Zap, 
  Sun, 
  Maximize, 
  Eraser, 
  Focus, 
  ZoomIn, 
  ZoomOut, 
  Search, 
  Columns2, 
  Split, 
  AlertCircle, 
  Mountain, 
  Moon, 
  Building, 
  Utensils, 
  FileImage, 
  Layers, 
  Settings2, 
  Wand2, 
  MessageSquare, 
  Bot,
  Crop,
  Check,
  Film,
  Aperture,
  Palette,
  Type,
  FileText,
  Highlighter,
  Pipette,
  Clapperboard,
  SlidersHorizontal,
  Undo2,
  Redo2,
  Paperclip,
  Trash2,
  Upload
} from 'lucide-react';
import { PhotoState, EnhancementPreset, ToolAction, PrintSettings, HistoryEntry, ComparisonMode, ChatMessage } from './types';
import { PRESETS, QUICK_TOOLS } from './constants';
import { enhanceImage } from './services/gemini';
import ComparisonSlider from './components/ComparisonSlider';
import SideBySideView from './components/SideBySideView';
import UploadZone from './components/UploadZone';
import PrintModal from './components/PrintModal';
import SaveOptionsModal from './components/SaveOptionsModal';
import HistoryPanel from './components/HistoryPanel';
import AIChatBoard from './components/AIChatBoard';
import ImageEditor from './components/ImageEditor';
import TextEditor from './components/TextEditor';
import PaintEditor from './components/PaintEditor';
import StyleTransferModal from './components/StyleTransferModal';
import ColorPaletteModal from './components/ColorPaletteModal';
import Tooltip from './components/Tooltip';

// Snapshot type for undo/redo
interface AppSnapshot {
  photo: {
    original: string | null;
    enhanced: string | null;
  };
  contrast: number;
}

// Icon mapping helper with specific color glows
const getIcon = (iconName: string, size = 18) => {
  const iconMap: Record<string, { icon: React.ReactNode, color: string }> = {
    'User': { icon: <User size={size} />, color: 'text-indigo-500' },
    'ShoppingBag': { icon: <ShoppingBag size={size} />, color: 'text-blue-500' },
    'ImageIcon': { icon: <ImageIcon size={size} />, color: 'text-emerald-500' },
    'Sparkles': { icon: <Sparkles size={size} />, color: 'text-purple-500' },
    'Zap': { icon: <Zap size={size} />, color: 'text-amber-500' },
    'Sun': { icon: <Sun size={size} />, color: 'text-orange-500' },
    'Maximize': { icon: <Maximize size={size} />, color: 'text-sky-500' },
    'Eraser': { icon: <Eraser size={size} />, color: 'text-rose-500' },
    'Focus': { icon: <Focus size={size} />, color: 'text-cyan-500' },
    'Mountain': { icon: <Mountain size={size} />, color: 'text-emerald-500' },
    'Moon': { icon: <Moon size={size} />, color: 'text-indigo-400' },
    'Building': { icon: <Building size={size} />, color: 'text-cyan-600' },
    'Utensils': { icon: <Utensils size={size} />, color: 'text-rose-600' },
    'Film': { icon: <Film size={size} />, color: 'text-amber-700' },
    'Aperture': { icon: <Aperture size={size} />, color: 'text-slate-700' },
    'Palette': { icon: <Palette size={size} />, color: 'text-pink-500' },
    'FileText': { icon: <FileText size={size} />, color: 'text-blue-600' },
    'Clapperboard': { icon: <Clapperboard size={size} />, color: 'text-red-500' },
  };

  const item = iconMap[iconName] || { icon: <ImageIcon size={size} />, color: 'text-slate-400' };
  return <span className={item.color}>{item.icon}</span>;
};

const App: React.FC = () => {
  const [photo, setPhoto] = useState<PhotoState>({
    original: null,
    enhanced: null,
    isProcessing: false,
    error: null
  });
  const [prompt, setPrompt] = useState('');
  const [contrast, setContrast] = useState(100);
  const [activeStyleImage, setActiveStyleImage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printModalMode, setPrintModalMode] = useState<'print' | 'download'>('print'); 
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showPaintEditor, setShowPaintEditor] = useState(false);
  const [showStyleTransfer, setShowStyleTransfer] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'tools' | 'presets' | 'adjust' | 'chat' | 'none'>('none');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('side-by-side');
  
  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<AppSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<AppSnapshot[]>([]);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panContainerRef = useRef<HTMLDivElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);

  const isHome = !photo.original && !photo.enhanced;

  // Sync sidebar state when entering/leaving home
  useEffect(() => {
    if (isHome) setSidebarOpen(false);
  }, [isHome]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, photo, contrast]);

  const takeSnapshot = useCallback((): AppSnapshot => {
    return {
      photo: {
        original: photo.original,
        enhanced: photo.enhanced,
      },
      contrast: contrast,
    };
  }, [photo.original, photo.enhanced, contrast]);

  const pushToUndo = useCallback(() => {
    const snapshot = takeSnapshot();
    setUndoStack(prev => [...prev, snapshot].slice(-30)); // Limit to 30 steps
    setRedoStack([]); // Clear redo on new action
  }, [takeSnapshot]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const currentSnapshot = takeSnapshot();
    const newUndoStack = [...undoStack];
    const previousSnapshot = newUndoStack.pop()!;

    setRedoStack(prev => [...prev, currentSnapshot]);
    setUndoStack(newUndoStack);

    setPhoto(prev => ({
      ...prev,
      original: previousSnapshot.photo.original,
      enhanced: previousSnapshot.photo.enhanced,
    }));
    setContrast(previousSnapshot.contrast);
  }, [undoStack, takeSnapshot]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    const currentSnapshot = takeSnapshot();
    const newRedoStack = [...redoStack];
    const nextSnapshot = newRedoStack.pop()!;

    setUndoStack(prev => [...prev, currentSnapshot]);
    setRedoStack(newRedoStack);

    setPhoto(prev => ({
      ...prev,
      original: nextSnapshot.photo.original,
      enhanced: nextSnapshot.photo.enhanced,
    }));
    setContrast(nextSnapshot.contrast);
  }, [redoStack, takeSnapshot]);

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto({
        original: e.target?.result as string,
        enhanced: null,
        isProcessing: false,
        error: null
      });
      setHistory([]);
      setUndoStack([]);
      setRedoStack([]);
      setContrast(100);
      setActiveStyleImage(null);
      resetZoom();
      setActiveMobileTab('none');
      setSidebarOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleMainUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset value so the same file can be selected again
    if (mainInputRef.current) mainInputRef.current.value = '';
  };

  const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setActiveStyleImage(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const bakeAdjustments = async (imageUrl: string): Promise<string> => {
    if (contrast === 100) return imageUrl;
    
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }
        ctx.filter = `contrast(${contrast}%)`;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => resolve(imageUrl);
    });
  };

  const handleEnhance = async (customPrompt?: string, styleImage?: string) => {
    if (!photo.original && !customPrompt) return;
    
    const sourceImage = photo.enhanced || photo.original;
    if (!sourceImage && !customPrompt) return;

    const finalPrompt = customPrompt || prompt || "Make it look professional and clean";
    const finalStyleImage = styleImage || activeStyleImage || undefined;
    
    setPhoto(prev => ({ ...prev, isProcessing: true, error: null }));
    setActiveMobileTab('none');
    setSidebarOpen(false);
    
    try {
      const result = await enhanceImage(sourceImage, finalPrompt, finalStyleImage);
      
      if (result.type === 'image') {
        pushToUndo(); // Save current state before updating

        const newEntry: HistoryEntry = {
          id: Math.random().toString(36).substr(2, 9),
          image: result.content,
          action: finalStyleImage ? "Style Transfer" : finalPrompt,
          timestamp: Date.now()
        };

        setPhoto(prev => ({ ...prev, enhanced: result.content, isProcessing: false }));
        setHistory(prev => [newEntry, ...prev]);
        setContrast(100);
      } else {
        throw new Error("The AI returned text instead of an image. Please try a different instruction.");
      }
    } catch (err: any) {
      setPhoto(prev => ({ ...prev, isProcessing: false, error: err.message }));
    }
  };

  const handleStyleTransferApply = (styleImage: string) => {
      setShowStyleTransfer(false);
      handleEnhance("Apply this artistic style.", styleImage);
  };

  const handleChatSendMessage = async (text: string, attachedImage?: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      image: attachedImage,
      timestamp: Date.now()
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setPhoto(prev => ({ ...prev, isProcessing: true }));

    try {
      const contextImage = attachedImage || photo.enhanced || photo.original || null;
      const result = await enhanceImage(contextImage, text);
      
      if (result.type === 'image') {
        pushToUndo(); // Save state

        const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: contextImage ? "I've processed the image based on your instructions." : "Here's the image I generated for you.",
            image: result.content,
            timestamp: Date.now()
        };
        setChatHistory(prev => [...prev, assistantMsg]);
        
        const newEntry: HistoryEntry = {
            id: Math.random().toString(36).substr(2, 9),
            image: result.content,
            action: `Chat: ${text}`,
            timestamp: Date.now()
        };
        setHistory(prev => [newEntry, ...prev]);
        setContrast(100);
      } else {
        const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: result.content,
            timestamp: Date.now()
        };
        setChatHistory(prev => [...prev, assistantMsg]);
      }
      
      setPhoto(prev => ({ ...prev, isProcessing: false }));

    } catch (err: any) {
      const displayError = err.message || "I couldn't complete that edit. Please try a different command.";
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `Error: ${displayError}`,
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, errorMsg]);
      setPhoto(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleApplyGeneratedImage = (imageUrl: string) => {
    pushToUndo();
    setPhoto({
      original: imageUrl,
      enhanced: null,
      isProcessing: false,
      error: null
    });
    setChatOpen(false);
    setActiveMobileTab('none');
    setContrast(100);
    resetZoom();
  };

  const handleSelectHistory = (entry: HistoryEntry) => {
    pushToUndo();
    setPhoto(prev => ({ ...prev, enhanced: entry.image }));
    setContrast(100);
    if (window.innerWidth < 768) setHistoryOpen(false);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your edit history?')) {
      setHistory([]);
      setPhoto(prev => ({ ...prev, enhanced: null }));
    }
  };

  const handleReset = () => {
    if (undoStack.length > 0) pushToUndo();
    setPhoto({
      original: null,
      enhanced: null,
      isProcessing: false,
      error: null
    });
    setHistory([]);
    setUndoStack([]);
    setRedoStack([]);
    setContrast(100);
    setPrompt('');
    setActiveStyleImage(null);
    setChatHistory([]);
    resetZoom();
    setActiveMobileTab('none');
    setSidebarOpen(false);
  };

  const handleApply = async () => {
    let finalImg = photo.enhanced || photo.original;
    if (!finalImg) return;
    
    pushToUndo();
    setPhoto(prev => ({ ...prev, isProcessing: true }));
    finalImg = await bakeAdjustments(finalImg);

    setPhoto({
      original: finalImg,
      enhanced: null,
      isProcessing: false,
      error: null
    });
    setContrast(100);
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.max(1, Math.min(8, prev + delta)));
    if (zoom + delta <= 1) setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!photo.original && !photo.enhanced) return;
    const sensitivity = 0.002;
    const delta = -e.deltaY * sensitivity;
    setZoom(prev => Math.max(1, Math.min(8, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    if ((e.target as HTMLElement).closest('.slider-handle')) return;
    
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const performDownload = async (format: 'png' | 'jpeg' | 'webp', quality: number) => {
    const baseImage = photo.enhanced || photo.original;
    if (!baseImage) return;

    setShowSaveModal(false);

    const targetMimeType = `image/${format}`;
    const filename = `lumina-export-${Date.now()}.${format}`;

    try {
      const img = new Image();
      img.src = baseImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not initialize conversion context");
      
      if (format === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.filter = `contrast(${contrast}%)`;
      ctx.drawImage(img, 0, 0);
      const downloadUrl = canvas.toDataURL(targetMimeType, quality);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();
    } catch (err) {
      console.error("Format conversion failed:", err);
      const link = document.createElement('a');
      link.href = baseImage;
      link.download = `lumina-backup-export.png`;
      link.click();
    }
  };

  const handlePrint = (settings: PrintSettings & { brightness?: number }) => {
    const activeImage = photo.enhanced || photo.original;
    if (!activeImage) return;
    setShowPrintModal(false);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const contrastFilter = `contrast(${contrast}%)`;
    const brightnessFilter = settings.brightness ? `brightness(${1 + settings.brightness/100})` : 'none';
    const totalFilter = `${contrastFilter} ${brightnessFilter}`;

    const pageSize = settings.size === 'passport' ? 'A4' : (settings.size === '4x6' ? '4in 6in' : settings.size);
    const photosCount = settings.photosPerSheet || 1;
    const fitMode = settings.fitMode || 'cover';

    const styles = `
      @page { size: ${pageSize} ${settings.orientation}; margin: 0; }
      body { margin: 0; padding: 15mm 10mm; background: white; font-family: sans-serif; box-sizing: border-box; }
      .print-grid { display: grid; grid-template-columns: repeat(6, 32mm); gap: 2mm; justify-content: start; width: 100%; }
      .print-item { width: 32mm; height: 42mm; border: 0.1mm solid #eee; overflow: hidden; position: relative; background: white; }
      .print-item img { width: 100%; height: 100%; object-fit: ${fitMode}; filter: ${totalFilter}; }
      .single-full { width: 100vw; height: 100vh; object-fit: ${fitMode}; filter: ${totalFilter}; position: absolute; top: 0; left: 0; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `;

    let content = '';
    if (settings.size === 'passport') {
      content = `
        <div class="print-grid">
          ${[...Array(photosCount)].map(() => `
            <div class="print-item">
              <img src="${activeImage}" />
            </div>
          `).join('')}
        </div>
      `;
    } else {
      content = `<img src="${activeImage}" class="single-full" />`;
    }

    printWindow.document.write(`<html><head><title>Lumina Print Lab</title><style>${styles}</style></head><body>${content}<script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }</script></body></html>`);
    printWindow.document.close();
  };

  const handleSaveEdit = (newImage: string) => {
    pushToUndo();
    setPhoto(prev => ({
      original: newImage,
      enhanced: null,
      isProcessing: false,
      error: null
    }));
    setShowEditor(false);
    setShowTextEditor(false);
    setShowPaintEditor(false);
    setContrast(100);
    
    setHistory(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      image: newImage,
      action: 'Edit',
      timestamp: Date.now()
    }, ...prev]);
  };

  const handleCustomLayoutRequest = () => {
    setShowSaveModal(false);
    setPrintModalMode('download');
    setShowPrintModal(true);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row select-none overflow-hidden bg-slate-50 relative">
      {/* Hidden File Input for Main Re-Upload */}
      <input 
        type="file" 
        ref={mainInputRef} 
        onChange={handleMainUploadChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Mobile Header */}
      <header className="md:hidden flex-none flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md z-50 border-b border-slate-100 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 pro-gradient-btn rounded-lg flex items-center justify-center text-white shadow-md">
              <Sparkles size={16} />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900">Lumina</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
           <Tooltip content="Undo" position="bottom">
             <button onClick={handleUndo} disabled={undoStack.length === 0} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-all disabled:opacity-30">
               <Undo2 size={20} />
             </button>
           </Tooltip>
           <Tooltip content="Redo" position="bottom">
             <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-all disabled:opacity-30">
               <Redo2 size={20} />
             </button>
           </Tooltip>
           <Tooltip content="Edit History" position="bottom">
             <button onClick={() => setHistoryOpen(true)} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-all">
               <History size={20} />
             </button>
           </Tooltip>
           <Tooltip content="Commit Changes" position="bottom">
             <button onClick={handleApply} disabled={!photo.enhanced && contrast === 100} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-full disabled:opacity-30 disabled:text-slate-400">
              <Check size={20} strokeWidth={2.5} />
            </button>
           </Tooltip>
           <Tooltip content="Export File" position="bottom">
             <button onClick={() => setShowSaveModal(true)} disabled={!photo.enhanced && !photo.original} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-30 disabled:text-slate-400">
              <Download size={20} strokeWidth={2.5} />
            </button>
           </Tooltip>
        </div>
      </header>

      {/* Sidebar Overlay (Mobile Only) */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] glass-panel w-full md:w-72 lg:w-80 p-6 flex flex-col gap-8 transition-transform duration-500 ease-in-out shadow-2xl md:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isHome ? 'md:-translate-x-full md:hidden' : 'md:static md:flex'}
      `}>
        {/* Mobile Sidebar Header */}
        <div className="md:hidden flex items-center justify-between mb-2">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 pro-gradient-btn rounded-xl flex items-center justify-center text-white shadow-xl">
                <Sparkles size={18} />
              </div>
              <span className="font-black text-xl tracking-tighter">Lumina AI</span>
           </div>
           
           <div className="flex items-center gap-2">
             <button 
                onClick={() => {
                  setSidebarOpen(false);
                  mainInputRef.current?.click();
                }}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-wide border border-blue-100 flex items-center gap-1.5"
             >
                <Upload size={14} /> New
             </button>
             <button onClick={() => setSidebarOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
           </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="w-11 h-11 pro-gradient-btn rounded-xl flex items-center justify-center text-white shadow-xl">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">Lumina</h1>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">AI Studio Pro</p>
          </div>
        </div>

        <div className="flex flex-col gap-8 overflow-y-auto no-scrollbar pr-1 flex-1">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Search size={12} /> Creative Instruction
              </h2>
              {activeStyleImage && (
                <button 
                  onClick={() => setActiveStyleImage(null)}
                  className="text-[9px] font-black text-rose-500 hover:text-rose-600 flex items-center gap-1 uppercase tracking-tighter transition-colors"
                >
                  <Trash2 size={10} /> Purge Style
                </button>
              )}
            </div>
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your vision..."
                className={`w-full h-24 p-4 rounded-2xl glass-card text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none font-medium ${activeStyleImage ? 'pr-14' : ''}`}
              />
              <div className="absolute right-2 bottom-2 flex flex-col gap-1.5">
                 <Tooltip content="Quick Style Upload" position="left">
                    <button 
                      onClick={() => styleInputRef.current?.click()}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${activeStyleImage ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                    >
                      <Palette size={18} />
                    </button>
                 </Tooltip>
                 <input 
                    type="file" 
                    ref={styleInputRef} 
                    onChange={handleStyleUpload} 
                    className="hidden" 
                    accept="image/*" 
                 />
              </div>
              {activeStyleImage && (
                <div className="absolute right-3 top-3 w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-xl animate-in zoom-in duration-300">
                  <img src={activeStyleImage} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-blue-600/10"></div>
                </div>
              )}
            </div>
          </section>

          <section className="p-4 bg-slate-900/5 rounded-2xl border border-slate-100">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <SlidersHorizontal size={12} /> Fine Tuning
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-600">Contrast</span>
                  <span className={`text-[10px] font-black ${contrast !== 100 ? 'text-blue-600' : 'text-slate-400'}`}>{contrast}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  onBlur={() => pushToUndo()}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Master Presets</h2>
            <div className="grid grid-cols-1 gap-2.5">
              {PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleEnhance(preset.prompt)}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl glass-card group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center shadow-sm">
                    {getIcon(preset.icon, 22)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-slate-800 tracking-tight truncate">{preset.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{preset.category} Grade</div>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Laboratory Tools</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {QUICK_TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => handleEnhance(tool.prompt)}
                  className="flex flex-col items-center gap-2 p-3.5 rounded-2xl glass-card hover:bg-white transition-all group"
                >
                  <div className="p-1.5 rounded-lg">
                    {getIcon(tool.icon, 22)}
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center leading-tight">{tool.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-auto pt-6">
          <button
            onClick={() => handleEnhance()}
            disabled={(!photo.original && !photo.enhanced) || photo.isProcessing}
            className="w-full py-5 pro-gradient-btn text-white rounded-[2rem] font-black text-base shadow-2xl disabled:opacity-40 transition-all flex items-center justify-center gap-3 group/btn"
          >
            {photo.isProcessing ? (
              <span className="tracking-widest uppercase text-xs">Processing</span>
            ) : (
              <>
                <Sparkles size={20} className="group-hover/btn:rotate-12 transition-transform" />
                <span className="tracking-widest uppercase text-xs">Enhance Image</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className={`flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-500`}>
        {isHome ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000 min-h-screen md:min-h-0 overflow-y-auto px-4">
            <div className="text-center mb-12 max-w-xl relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500/10 blur-[100px] rounded-full"></div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-none">
                Elegance <span className="text-blue-600">Reimagined.</span>
              </h2>
              <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed max-w-sm md:max-w-none mx-auto">Studio-grade AI photography lab. Upload an image or chat with Lumina AI to generate something new.</p>
            </div>
            <UploadZone onUpload={handleUpload} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full min-h-0 p-4 md:p-8 lg:p-12 gap-4 md:gap-6">
            {/* Desktop Top Toolbar */}
            <div className="hidden md:flex flex-none items-center justify-between glass-panel p-4 rounded-[2.5rem] shadow-xl border border-white/60 z-20">
              <div className="flex items-center gap-3 lg:gap-4 shrink-0 overflow-x-auto no-scrollbar">
                
                {/* NEW: Upload Button in Desktop Toolbar */}
                <Tooltip content="Upload New Image">
                  <button 
                    onClick={() => mainInputRef.current?.click()}
                    className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all hover:bg-blue-50"
                  >
                    <Upload size={18} />
                  </button>
                </Tooltip>

                <div className="h-8 w-px bg-slate-200/60 mx-1"></div>

                <Tooltip content="Undo (Ctrl+Z)">
                  <button onClick={handleUndo} disabled={undoStack.length === 0} className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all disabled:opacity-20"><Undo2 size={18} /></button>
                </Tooltip>

                <Tooltip content="Redo (Ctrl+Y)">
                  <button onClick={handleRedo} disabled={redoStack.length === 0} className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all disabled:opacity-20"><Redo2 size={18} /></button>
                </Tooltip>

                <div className="h-8 w-px bg-slate-200/60 mx-1"></div>

                <Tooltip content="Reset All Edits">
                  <button onClick={handleReset} className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-rose-500 transition-all hover:rotate-180">
                    <RotateCcw size={18} />
                  </button>
                </Tooltip>
                
                <Tooltip content="Crop & Rotate">
                  <button onClick={() => setShowEditor(true)} className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all"><Crop size={18} /></button>
                </Tooltip>

                <Tooltip content="Remove Background">
                  <button 
                    onClick={() => handleEnhance(QUICK_TOOLS.find(t => t.id === 'bg')?.prompt)} 
                    className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all disabled:opacity-50"
                    disabled={!photo.original && !photo.enhanced}
                  >
                    <Eraser size={18} />
                  </button>
                </Tooltip>

                <Tooltip content="Mark & Draw">
                  <button onClick={() => setShowPaintEditor(true)} className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all"><Highlighter size={18} /></button>
                </Tooltip>

                <Tooltip content="Style Transfer">
                  <button onClick={() => setShowStyleTransfer(true)} className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-purple-600 transition-all"><Palette size={18} /></button>
                </Tooltip>
                
                <Tooltip content="Color Palette Generator">
                  <button onClick={() => setShowColorPalette(true)} className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all"><Pipette size={18} /></button>
                </Tooltip>

                <Tooltip content="Add Text Overlay">
                  <button onClick={() => setShowTextEditor(true)} className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all"><Type size={18} /></button>
                </Tooltip>

                <Tooltip content="Apply Changes">
                  <button 
                    onClick={handleApply}
                    disabled={!photo.enhanced && contrast === 100}
                    className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-emerald-500 transition-all disabled:opacity-20 disabled:hover:text-slate-600"
                  >
                    <Check size={18} strokeWidth={3} />
                  </button>
                </Tooltip>

                <div className="h-8 w-px bg-slate-200/60 mx-1"></div>
                
                <div className="flex items-center glass-card rounded-2xl p-1 gap-1 shadow-inner">
                  <Tooltip content="Slider Comparison">
                    <button onClick={() => setComparisonMode('slider')} className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2.5 ${comparisonMode === 'slider' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white/60'}`}>
                      <Split size={14} /> <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Split</span>
                    </button>
                  </Tooltip>
                  <Tooltip content="Sync Split View">
                    <button onClick={() => setComparisonMode('side-by-side')} className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2.5 ${comparisonMode === 'side-by-side' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white/60'}`}>
                      <Columns2 size={14} /> <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Dual</span>
                    </button>
                  </Tooltip>
                </div>

                <div className="h-8 w-px bg-slate-200/60 mx-1"></div>

                <div className="flex items-center glass-card rounded-2xl p-1 gap-1 shadow-inner">
                  <Tooltip content="Zoom Out">
                    <button onClick={() => adjustZoom(-0.5)} className="p-2.5 rounded-xl hover:bg-white text-slate-600 transition-all disabled:opacity-20" disabled={zoom <= 1}><ZoomOut size={16} /></button>
                  </Tooltip>
                  <div className="px-2 min-w-[50px] text-center"><span className="text-[10px] font-black text-slate-900">{Math.round(zoom * 100)}%</span></div>
                  <Tooltip content="Zoom In">
                    <button onClick={() => adjustZoom(0.5)} className="p-2.5 rounded-xl hover:bg-white text-slate-600 transition-all disabled:opacity-20" disabled={zoom >= 8}><ZoomIn size={16} /></button>
                  </Tooltip>
                </div>
              </div>

              <div className="flex items-center gap-2 lg:gap-3">
                <button onClick={() => setChatOpen(!chatOpen)} className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest ${chatOpen ? 'pro-gradient-btn text-white' : 'glass-card text-slate-600'}`}>
                  <MessageSquare size={16} /> <span className="hidden lg:inline">Chat</span>
                </button>
                <button onClick={() => setHistoryOpen(!historyOpen)} className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest ${historyOpen ? 'pro-gradient-btn text-white' : 'glass-card text-slate-600'}`}>
                  <History size={16} /> <span className="hidden lg:inline">History</span>
                </button>
                <Tooltip content="Physical Print">
                  <button onClick={() => { setPrintModalMode('print'); setShowPrintModal(true); }} disabled={!photo.enhanced && !photo.original} className="w-10 h-10 flex items-center justify-center rounded-full glass-card text-slate-600 hover:text-blue-600 transition-all disabled:opacity-20"><Printer size={18} /></button>
                </Tooltip>
                
                <button onClick={() => setShowSaveModal(true)} disabled={!photo.enhanced && !photo.original} className="px-5 lg:px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:opacity-30 transition-all flex items-center gap-2 shadow-xl shadow-slate-200">
                  <Download size={16} /> <span className="hidden lg:inline">Export</span>
                </button>
              </div>
            </div>

            {/* View Container */}
            <div 
              ref={panContainerRef} 
              onWheel={handleWheel}
              className={`flex-1 relative bg-slate-950 rounded-[2rem] md:rounded-[3rem] overflow-hidden cinema-frame flex items-center justify-center border-4 md:border-[8px] border-slate-900 ${zoom > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`} 
              onMouseDown={handleMouseDown} 
              onMouseMove={handleMouseMove} 
              onMouseUp={handleMouseUp} 
              onMouseLeave={handleMouseUp} 
              onDoubleClick={resetZoom}
            >
              {photo.isProcessing && (
                <div className="absolute inset-0 z-[60] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-white p-12 text-center animate-in fade-in duration-500">
                  <div className="w-20 h-20 mb-8 relative">
                    <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <Sparkles className="text-blue-500 absolute inset-0 m-auto animate-pulse" size={28} />
                  </div>
                  <h3 className="text-2xl font-black mb-2 tracking-tighter">Polishing Masterpiece...</h3>
                  <p className="text-slate-400 text-sm max-w-[240px] font-medium leading-relaxed">Neural Pass v2.5 active.</p>
                </div>
              )}

              {photo.original && photo.enhanced && !photo.isProcessing && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-4 duration-500" onMouseDown={e => e.stopPropagation()}>
                    <div className="flex items-center p-1.5 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ring-1 ring-black/20">
                      <button 
                        onClick={() => setComparisonMode('slider')}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                          comparisonMode === 'slider' 
                            ? 'bg-white text-slate-900 shadow-lg scale-105 font-bold' 
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Split size={14} />
                        <span className="text-[10px] uppercase tracking-wider">Slider</span>
                      </button>
                      <div className="w-px h-4 bg-white/10 mx-1"></div>
                      <button 
                        onClick={() => setComparisonMode('side-by-side')}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                          comparisonMode === 'side-by-side' 
                            ? 'bg-white text-slate-900 shadow-lg scale-105 font-bold' 
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Columns2 size={14} />
                        <span className="text-[10px] uppercase tracking-wider">Dual</span>
                      </button>
                    </div>
                  </div>
              )}

              <div 
                className={`w-full h-full flex items-center justify-center ${comparisonMode === 'side-by-side' ? '' : 'transition-transform duration-300 ease-out'}`} 
                style={comparisonMode === 'side-by-side' ? undefined : { transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
              >
                {!photo.enhanced && photo.original ? (
                  <img 
                    src={photo.original} 
                    alt="Original" 
                    className="max-w-full max-h-full object-contain p-4 md:p-12 animate-in fade-in zoom-in-95 duration-500" 
                    draggable={false} 
                    style={{ filter: `contrast(${contrast}%)` }}
                  />
                ) : photo.enhanced && photo.original ? (
                    <div key={comparisonMode} className="w-full h-full animate-in fade-in zoom-in-95 duration-300 flex items-center justify-center">
                      {comparisonMode === 'slider' ? (
                        <ComparisonSlider before={photo.original} after={photo.enhanced} contrast={contrast} />
                      ) : (
                        <SideBySideView 
                          before={photo.original} 
                          after={photo.enhanced} 
                          zoom={zoom}
                          pan={pan}
                          contrast={contrast}
                        />
                      )}
                    </div>
                ) : photo.enhanced ? (
                  <img 
                    src={photo.enhanced} 
                    alt="Enhanced" 
                    className="max-w-full max-h-full object-contain p-4 md:p-12 animate-in fade-in zoom-in-95 duration-500" 
                    draggable={false} 
                    style={{ filter: `contrast(${contrast}%)` }}
                  />
                ) : null}
              </div>
            </div>
            
            <div className="md:hidden h-24"></div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {!isHome && (
      <>
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-40">
          <div className="bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] h-[4.5rem] shadow-2xl flex items-center justify-between px-2 ring-1 ring-white/10 shadow-black/50">
            
            <button onClick={() => setActiveMobileTab('presets')} className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-2xl transition-all active:scale-95 ${activeMobileTab === 'presets' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              <div className={`p-1.5 rounded-xl transition-all ${activeMobileTab === 'presets' ? 'bg-white/10' : 'bg-transparent'}`}><Layers size={22} strokeWidth={activeMobileTab === 'presets' ? 2.5 : 2} /></div>
              <span className="text-[9px] font-bold tracking-wide opacity-80">Presets</span>
            </button>

            <button onClick={() => setActiveMobileTab('tools')} className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-2xl transition-all active:scale-95 ${activeMobileTab === 'tools' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              <div className={`p-1.5 rounded-xl transition-all ${activeMobileTab === 'tools' ? 'bg-white/10' : 'bg-transparent'}`}><Settings2 size={22} strokeWidth={activeMobileTab === 'tools' ? 2.5 : 2} /></div>
              <span className="text-[9px] font-bold tracking-wide opacity-80">Tools</span>
            </button>

            <div className="relative -top-8 mx-2">
               <button onClick={() => handleEnhance()} disabled={(!photo.original && !photo.enhanced) || photo.isProcessing} className="w-16 h-16 pro-gradient-btn rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 active:scale-90 transition-all disabled:opacity-50 disabled:grayscale ring-[6px] ring-slate-50 relative z-10 group overflow-hidden">
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                 {photo.isProcessing ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={28} fill="currentColor" className="text-white/90" />}
               </button>
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-2 bg-black/40 blur-md rounded-full"></div>
            </div>

            <button onClick={() => setActiveMobileTab('adjust')} className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-2xl transition-all active:scale-95 ${activeMobileTab === 'adjust' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              <div className={`p-1.5 rounded-xl transition-all ${activeMobileTab === 'adjust' ? 'bg-white/10' : 'bg-transparent'}`}><SlidersHorizontal size={22} strokeWidth={activeMobileTab === 'adjust' ? 2.5 : 2} /></div>
              <span className="text-[9px] font-bold tracking-wide opacity-80">Adjust</span>
            </button>

            <button onClick={() => setShowEditor(true)} className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-2xl transition-all active:scale-95 text-slate-400 hover:text-slate-200`}>
              <div className="p-1.5 rounded-xl bg-transparent"><Crop size={22} strokeWidth={2} /></div>
              <span className="text-[9px] font-bold tracking-wide opacity-80">Crop</span>
            </button>
          </div>
        </div>

        {/* Bottom Sheet for Mobile Tools / Presets / Adjust */}
        {(activeMobileTab === 'tools' || activeMobileTab === 'presets' || activeMobileTab === 'adjust') && (
          <>
            <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setActiveMobileTab('none')} />
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2.5rem] animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-h-[85dvh] flex flex-col">
               <div className="p-6 pb-4 flex-none border-b border-slate-50">
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                  <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {activeMobileTab === 'tools' ? 'Laboratory Tools' : activeMobileTab === 'presets' ? 'Master Presets' : 'Basic Adjustments'}
                      </h3>
                      <button onClick={() => setActiveMobileTab('none')} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X size={20} /></button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 pt-4 pb-32 no-scrollbar">
                   {activeMobileTab === 'adjust' ? (
                     <div className="space-y-6">
                       <div className="space-y-3">
                         <div className="flex justify-between items-center px-1">
                           <span className="text-xs font-black text-slate-900 uppercase">Contrast Intensity</span>
                           <span className="text-xs font-black text-blue-600">{contrast}%</span>
                         </div>
                         <input 
                           type="range" min="50" max="150" value={contrast} 
                           onChange={(e) => setContrast(Number(e.target.value))}
                           onBlur={() => pushToUndo()}
                           className="w-full h-2 bg-slate-100 rounded-xl appearance-none cursor-pointer accent-blue-600"
                         />
                         <div className="flex justify-between px-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Lower</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Higher</span>
                         </div>
                       </div>
                       <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                          <p className="text-[10px] text-blue-600 font-bold leading-relaxed uppercase tracking-wider">
                            Contrast adjustments are applied in real-time. Use the checkmark to bake them into your master asset.
                          </p>
                       </div>
                     </div>
                   ) : (
                     <div className={activeMobileTab === 'tools' ? "grid grid-cols-3 gap-3" : "grid grid-cols-1 gap-3"}>
                      {(activeMobileTab === 'tools' ? QUICK_TOOLS : PRESETS).map((item: any) => (
                          <button key={item.id} onClick={() => handleEnhance(item.prompt)} className={`group relative overflow-hidden text-left ${activeMobileTab === 'tools' ? 'flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-2xl active:scale-95 transition-all' : 'flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm active:scale-[0.98] transition-all hover:border-blue-200 hover:shadow-md'}`}>
                            <div className={`flex items-center justify-center text-slate-700 shrink-0 ${activeMobileTab === 'tools' ? 'w-12 h-12 bg-white rounded-xl shadow-sm' : 'w-12 h-12 bg-slate-50 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors'}`}>
                              {getIcon(item.icon, activeMobileTab === 'tools' ? 24 : 22)}
                            </div>
                            <div className={activeMobileTab === 'tools' ? "text-center" : "flex-1 min-w-0"}>
                              <div className="text-sm font-bold text-slate-900 truncate">{item.label || item.name}</div>
                              {activeMobileTab === 'presets' && <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5 group-hover:text-blue-400 transition-colors">{item.category}</div>}
                            </div>
                            {activeMobileTab === 'presets' && <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />}
                          </button>
                      ))}
                   </div>
                   )}
               </div>
            </div>
          </>
        )}
      </>
      )}

      {/* Desktop Floating Chat Trigger */}
      <Tooltip content="Open AI Chat" position="left">
        <button onClick={() => setChatOpen(true)} className="hidden md:flex fixed bottom-10 right-10 w-16 h-16 pro-gradient-btn rounded-full items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all z-[90]">
          <MessageSquare size={28} />
        </button>
      </Tooltip>

      {/* Overlays */}
      {showEditor && (photo.enhanced || photo.original) && <ImageEditor image={photo.enhanced || photo.original!} onSave={handleSaveEdit} onClose={() => setShowEditor(false)} />}
      {showTextEditor && (photo.enhanced || photo.original) && <TextEditor image={photo.enhanced || photo.original!} onSave={handleSaveEdit} onClose={() => setShowTextEditor(false)} />}
      {showPaintEditor && (photo.enhanced || photo.original) && <PaintEditor image={photo.enhanced || photo.original!} onSave={handleSaveEdit} onClose={() => setShowPaintEditor(false)} />}
      {showStyleTransfer && (photo.enhanced || photo.original) && <StyleTransferModal contentImage={(photo.enhanced || photo.original)!} onClose={() => setShowStyleTransfer(false)} onApply={handleStyleTransferApply} />}
      {showColorPalette && (photo.enhanced || photo.original) && <ColorPaletteModal image={(photo.enhanced || photo.original)!} onClose={() => setShowColorPalette(false)} />}
      {chatOpen && <AIChatBoard messages={chatHistory} isProcessing={photo.isProcessing} onSendMessage={handleChatSendMessage} onApplyToStudio={handleApplyGeneratedImage} onClearChat={() => setChatHistory([])} onClose={() => setChatOpen(false)} />}
      {historyOpen && <HistoryPanel history={history} currentImage={photo.enhanced} onSelect={handleSelectHistory} onClear={handleClearHistory} onClose={() => setHistoryOpen(false)} />}
      {showPrintModal && (photo.enhanced || photo.original) && <PrintModal image={(photo.enhanced || photo.original)!} mode={printModalMode} onClose={() => setShowPrintModal(false)} onConfirm={handlePrint} />}
      {showSaveModal && (photo.enhanced || photo.original) && <SaveOptionsModal image={(photo.enhanced || photo.original)!} onClose={() => setShowSaveModal(false)} onSave={performDownload} onCustomLayout={handleCustomLayoutRequest} />}
    </div>
  );
};

export default App;
