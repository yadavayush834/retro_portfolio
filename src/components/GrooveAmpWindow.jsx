import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

export default function GrooveAmpWindow() {
  const { WINDOW_CONFIGS, openWindows } = useWindowManager();
  const config = WINDOW_CONFIGS.grooveamp;
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);
  const melodyTimerRef = useRef(null);
  const animFrameRef = useRef(null);
  const [status, setStatus] = useState('Idle');
  const [nowPlaying, setNowPlaying] = useState('8-Bit Breeze');

  const TRACKS = ['8-Bit Breeze', 'Pixel Sunset', 'Chiptune Dreams', 'Retro Wave'];

  const startMelody = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (oscRef.current) return;

    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    gain.gain.value = 0.04;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    oscRef.current = osc;
    gainRef.current = gain;

    const scale = [262, 294, 330, 392, 440, 523, 494, 392, 330, 349, 392, 523];
    let idx = 0;
    setStatus('Playing');
    melodyTimerRef.current = setInterval(() => {
      if (!oscRef.current) return;
      oscRef.current.frequency.setValueAtTime(scale[idx % scale.length], ctx.currentTime);
      idx++;
    }, 180);
  }, []);

  const stopMelody = useCallback(() => {
    if (melodyTimerRef.current) clearInterval(melodyTimerRef.current);
    melodyTimerRef.current = null;
    if (oscRef.current) {
      oscRef.current.stop();
      oscRef.current.disconnect();
      oscRef.current = null;
    }
    setStatus('Idle');
  }, []);

  const nextTrack = useCallback(() => {
    setNowPlaying(prev => {
      const idx = TRACKS.indexOf(prev);
      return TRACKS[(idx + 1) % TRACKS.length];
    });
  }, []);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!openWindows.has('grooveamp')) {
      stopMelody();
    }
  }, [openWindows, stopMelody]);

  // Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let lastFrame = 0;

    function draw(ts = 0) {
      if (ts - lastFrame < 80) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrame = ts;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      const bars = 28;
      const barW = (w - 20) / bars;
      for (let i = 0; i < bars; i++) {
        const barH = status === 'Playing'
          ? Math.random() * (h - 12) + 6
          : 4 + Math.sin(Date.now() / 600 + i) * 3;
        const x = 10 + i * barW;

        // Gradient bars
        const gradient = ctx.createLinearGradient(x, h, x, h - barH);
        gradient.addColorStop(0, '#00ff5a');
        gradient.addColorStop(0.6, '#00cc44');
        gradient.addColorStop(1, '#ffff00');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, h - barH, barW - 2, barH);
      }
      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [status]);

  return (
    <Window id="grooveamp" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
      <div className="amp-panel">
        <div className="amp-display">
          ♪ Now Playing: {nowPlaying}
        </div>
        <canvas ref={canvasRef} className="amp-visualizer" width="340" height="110" />
        <div className="amp-controls">
          <button onClick={startMelody}>▶ Play</button>
          <button onClick={stopMelody}>■ Stop</button>
          <button onClick={nextTrack}>⏭ Next</button>
          <div className="status-inset" style={{ flex: 1 }}>Status: {status}</div>
        </div>
      </div>
    </Window>
  );
}
