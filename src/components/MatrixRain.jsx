import React, { useRef, useEffect } from 'react';

export default function MatrixRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const fontSize = 16;
    let columns = [];
    let width = 0;
    let height = 0;
    let animFrame = null;
    let running = true;
    let lastFrame = 0;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const numCols = Math.floor(width / fontSize);
      columns = Array.from({ length: numCols }, () =>
        Math.floor(Math.random() * height / fontSize)
      );
    }

    function draw(ts = 0) {
      if (!running) return;
      // ~20 FPS
      if (ts - lastFrame < 50) {
        animFrame = requestAnimationFrame(draw);
        return;
      }
      lastFrame = ts;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < columns.length; i++) {
        const charCode = 0x30A0 + Math.floor(Math.random() * 96);
        const text = String.fromCharCode(charCode);
        const x = i * fontSize;
        const y = columns[i] * fontSize;

        // Color gradient: bright heads, darker tails
        const brightness = Math.random();
        if (brightness > 0.95) {
          ctx.fillStyle = '#ffffff';
        } else if (brightness > 0.7) {
          ctx.fillStyle = '#00ff66';
        } else {
          ctx.fillStyle = '#00aa44';
        }
        ctx.font = fontSize + 'px "Courier New", monospace';
        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          columns[i] = 0;
        } else {
          columns[i]++;
        }
      }

      animFrame = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);

    const handleVisibility = () => {
      if (document.hidden) {
        running = false;
        if (animFrame) cancelAnimationFrame(animFrame);
      } else {
        running = true;
        draw();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      running = false;
      if (animFrame) cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-canvas" aria-hidden="true" />;
}
