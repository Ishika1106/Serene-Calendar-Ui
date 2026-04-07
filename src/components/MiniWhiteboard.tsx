'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Undo, Redo, Trash2, GripVertical,
  Pencil, Paintbrush, Droplet, PenTool, Download
} from 'lucide-react';

interface DrawPoint {
  x: number;
  y: number;
}

interface DrawLine {
  points: DrawPoint[];
  color: string;
  width: number;
  opacity: number;
  tool: string;
}

const STORAGE_KEY = 'forest-whiteboard-drawing';

const MARKER_COLORS = [
  '#77f2ac', // light green
  '#98f277', // lime
  '#f2ec77', // yellow
  '#f2bc3d', // orange/gold
  '#133619', // dark green
  '#ffffff', // white
];

const PEN_TOOLS = [
  { id: 'pen', icon: Pencil, label: 'Pen', defaultSize: 3 },
  { id: 'marker', icon: Droplet, label: 'Marker', defaultSize: 15 },
  { id: 'highlighter', icon: Paintbrush, label: 'Highlighter', defaultSize: 25 },
  { id: 'brush', icon: PenTool, label: 'Brush', defaultSize: 20 },
];

export default function MiniWhiteboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState<DrawLine[]>([]);
  const [currentLine, setCurrentLine] = useState<DrawPoint[]>([]);
  const [brushColor, setBrushColor] = useState('#77f2ac');
  const [brushSize, setBrushSize] = useState(3);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [activeTool, setActiveTool] = useState('pen');
  const [history, setHistory] = useState<DrawLine[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 250 });
  const [isResizing, setIsResizing] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLines(parsed.drawings || []);
        setHistory([parsed.drawings || []]);
        setHistoryIndex(0);
        if (parsed.size) setCanvasSize(parsed.size);
      } catch (e) {
        console.error('Failed to load drawings:', e);
      }
    } else {
      setHistory([[]]);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (lines.length > 0 || history.length > 1) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        drawings: lines, 
        size: canvasSize 
      }));
    }
  }, [lines, canvasSize]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    
    // Draw all lines
    lines.forEach((line) => {
      if (line.points.length < 2) return;
      ctx.globalAlpha = line.opacity;
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(line.points[0].x, line.points[0].y);
      line.points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
    
    // Draw current line
    ctx.globalAlpha = brushOpacity;
    if (currentLine.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentLine[0].x, currentLine[0].y);
      currentLine.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [lines, currentLine, brushColor, brushSize, brushOpacity]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setCurrentLine([coords]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    setCurrentLine((prev) => [...prev, coords]);
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentLine.length > 0) {
      const tool = PEN_TOOLS.find(t => t.id === activeTool);
      const newLine: DrawLine = {
        points: currentLine,
        color: brushColor,
        width: brushSize,
        opacity: brushOpacity,
        tool: activeTool,
      };
      const newLines = [...lines, newLine];
      setLines(newLines);
      setCurrentLine([]);
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newLines);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const clearCanvas = () => {
    setLines([]);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ drawings: [], size: canvasSize }));
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLines(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLines(history[historyIndex + 1]);
    }
  };

  const handleResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = canvasSize.width;
    const startHeight = canvasSize.height;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(800, startWidth + (moveEvent.clientX - startX)));
      const newHeight = Math.max(150, Math.min(400, startHeight + (moveEvent.clientY - startY)));
      setCanvasSize({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [canvasSize]);

  const saveWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary canvas for white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    
    // Fill white background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw the original canvas
    ctx.drawImage(canvas, 0, 0);
    
    // Download
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  const saveToLocalStorage = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      drawings: lines, 
      size: canvasSize 
    }));
  }, [lines, canvasSize]);

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        {/* Pen Tools */}
        <div className="flex items-center gap-1">
          {PEN_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  setBrushSize(tool.defaultSize);
                }}
                className={`
                  p-2 rounded-lg transition-all hover:scale-105
                  ${isActive ? 'bg-white/25 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}
                `}
                title={tool.label}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>

        {/* Undo/Redo/Clear */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo size={18} />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
            title="Clear"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={saveWhiteboard}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
            title="Save as PNG"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-2 mb-3">
        {MARKER_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setBrushColor(color)}
            className={`
              w-7 h-7 rounded-full transition-transform hover:scale-110
              ${brushColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}
            `}
            style={{ 
              backgroundColor: color,
              boxShadow: color === '#133619' ? 'inset 0 0 0 2px rgba(255,255,255,0.3)' : 'none'
            }}
          />
        ))}
      </div>

      {/* Size Slider */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-white/50 text-xs">Size:</span>
        <input
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${brushColor} 0%, ${brushColor} ${(brushSize/50)*100}%, rgba(255,255,255,0.2) ${(brushSize/50)*100}%, rgba(255,255,255,0.2) 100%)`
          }}
        />
        <span className="text-white/70 text-xs w-6">{brushSize}px</span>
      </div>

      {/* Opacity Slider */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-white/50 text-xs">Opacity:</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={brushOpacity}
          onChange={(e) => setBrushOpacity(Number(e.target.value))}
          className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
        />
        <span className="text-white/70 text-xs w-6">{Math.round(brushOpacity * 100)}%</span>
      </div>

      {/* Drawing Canvas Container */}
      <div 
        ref={containerRef}
        className="relative rounded-xl overflow-hidden bg-black/20 border border-white/10"
        style={{ 
          width: '100%', 
          height: `${canvasSize.height}px`,
          minHeight: '150px',
          cursor: isResizing ? 'nwse-resize' : 'crosshair'
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        
        {/* Empty state */}
        {lines.length === 0 && currentLine.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-white/30 text-sm">Start drawing...</p>
          </div>
        )}

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          onMouseDown={handleResize}
        >
          <GripVertical className="w-4 h-4 text-white/30" />
        </div>
      </div>

      {/* Canvas size indicator */}
      <div className="text-center mt-2 text-white/40 text-xs">
        Drag corner to resize • {canvasSize.width} × {canvasSize.height}
      </div>
    </div>
  );
}