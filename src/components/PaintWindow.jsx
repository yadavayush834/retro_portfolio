import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

const COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
  '#008080', '#800000', '#008000', '#000080', '#808080',
];

const BRUSH_SIZES = [2, 4, 8, 12];

export default function PaintWindow() {
  const { WINDOW_CONFIGS } = useWindowManager();
  const config = WINDOW_CONFIGS.paint;
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctxRef.current = ctx;
  }, []);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    setDrawing(true);
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    const pos = getPos(e);
    ctx.moveTo(pos.x, pos.y);
  }, [getPos]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [drawing, getPos, tool, color, brushSize]);

  const endDraw = useCallback(() => {
    setDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <Window id="paint" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
      <div className="paint-toolbar">
        <button
          className={tool === 'pencil' ? 'active-tool' : ''}
          onClick={() => setTool('pencil')}
        >
          ✏️ Pencil
        </button>
        <button
          className={tool === 'eraser' ? 'active-tool' : ''}
          onClick={() => setTool('eraser')}
        >
          🧹 Eraser
        </button>
        <button onClick={clearCanvas}>🗑️ Clear</button>

        <div style={{ width: 1, height: 20, background: '#808080', margin: '0 4px' }} />

        <div className="color-picker-row">
          {COLORS.map(c => (
            <div
              key={c}
              className={`color-swatch ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => { setColor(c); setTool('pencil'); }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 6, alignItems: 'center', fontSize: 12 }}>
        <span>Size:</span>
        {BRUSH_SIZES.map(size => (
          <button
            key={size}
            onClick={() => setBrushSize(size)}
            style={{
              padding: '2px 8px',
              fontWeight: brushSize === size ? 'bold' : 'normal',
              boxShadow: brushSize === size ? 'var(--shadow-btn-pressed)' : undefined,
            }}
          >
            {size}px
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        className="paint-canvas"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    </Window>
  );
}
