import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

// Difficulty settings
const DIFFICULTIES = {
  easy:   { gravity: 0.32, jumpVel: -6.5, pipeGap: 160, pipeSpeed: 2.0, pipeInterval: 2000, label: '🟢 Easy' },
  medium: { gravity: 0.45, jumpVel: -7.5, pipeGap: 130, pipeSpeed: 2.5, pipeInterval: 1600, label: '🟡 Medium' },
  hard:   { gravity: 0.55, jumpVel: -8.2, pipeGap: 100, pipeSpeed: 3.2, pipeInterval: 1200, label: '🔴 Hard' },
};

const BIRD_X = 80;
const BIRD_SIZE = 24;
const PIPE_WIDTH = 48;

function drawBird(ctx, y, angle, frame) {
  ctx.save();
  ctx.translate(BIRD_X, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const wingY = Math.sin(frame * 0.3) * 3;
  ctx.fillStyle = '#FFA500';
  ctx.beginPath();
  ctx.ellipse(-4, wingY + 2, 10, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(6, -4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(8, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF4500';
  ctx.beginPath();
  ctx.moveTo(12, -1);
  ctx.lineTo(20, 2);
  ctx.lineTo(12, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPipe(ctx, x, gapY, pipeGap, w, h) {
  const topH = gapY - pipeGap / 2;
  const botY = gapY + pipeGap / 2;
  const tGrad = ctx.createLinearGradient(x, 0, x + PIPE_WIDTH, 0);
  tGrad.addColorStop(0, '#2ecc40');
  tGrad.addColorStop(0.4, '#5dfc6e');
  tGrad.addColorStop(1, '#1a9e2c');
  ctx.fillStyle = tGrad;
  ctx.fillRect(x, 0, PIPE_WIDTH, topH);
  ctx.fillStyle = '#27ae33';
  ctx.fillRect(x - 4, topH - 20, PIPE_WIDTH + 8, 20);
  ctx.strokeStyle = '#145a1a';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 4, topH - 20, PIPE_WIDTH + 8, 20);
  ctx.fillStyle = tGrad;
  ctx.fillRect(x, botY, PIPE_WIDTH, h - botY);
  ctx.fillStyle = '#27ae33';
  ctx.fillRect(x - 4, botY, PIPE_WIDTH + 8, 20);
  ctx.strokeStyle = '#145a1a';
  ctx.strokeRect(x - 4, botY, PIPE_WIDTH + 8, 20);
}

function drawGround(ctx, w, h, offset) {
  const groundY = h - 40;
  ctx.fillStyle = '#DEB887';
  ctx.fillRect(0, groundY, w, 40);
  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();
  ctx.strokeStyle = '#CD9B5A';
  ctx.lineWidth = 1;
  for (let i = -offset % 20; i < w; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, groundY + 8);
    ctx.lineTo(i + 10, groundY + 18);
    ctx.stroke();
  }
}

function drawSky(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h - 40);
  grad.addColorStop(0, '#4EC5F1');
  grad.addColorStop(1, '#87CEEB');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h - 40);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  [[60, 50], [200, 30], [320, 70], [150, 90]].forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 30, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 20, cy - 5, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - 15, cy + 3, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

export default function FlappyBirdWindow() {
  const { WINDOW_CONFIGS, openWindows } = useWindowManager();
  const config = WINDOW_CONFIGS.flappy;
  const canvasRef = useRef(null);
  const [difficulty, setDifficulty] = useState(null); // null = menu, 'easy'|'medium'|'hard'
  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() =>
    parseInt(localStorage.getItem('flappy-hi') || '0', 10)
  );

  const stateRef = useRef({
    birdY: 160, velocity: 0, pipes: [], score: 0,
    frame: 0, groundOffset: 0, gameState: 'idle',
  });
  const animRef = useRef(null);
  const lastPipeRef = useRef(0);
  const diffRef = useRef(DIFFICULTIES.medium);
  const isOpen = openWindows.has('flappy');

  const selectDifficulty = useCallback((d) => {
    diffRef.current = DIFFICULTIES[d];
    setDifficulty(d);
    setGameState('idle');
    const s = stateRef.current;
    s.birdY = 160; s.velocity = 0; s.pipes = []; s.score = 0;
    s.frame = 0; s.groundOffset = 0; s.gameState = 'idle';
    setScore(0);
  }, []);

  const jump = useCallback(() => {
    const s = stateRef.current;
    const d = diffRef.current;
    if (s.gameState === 'idle') {
      s.gameState = 'playing';
      s.birdY = 160;
      s.velocity = d.jumpVel;
      s.pipes = [];
      s.score = 0;
      s.frame = 0;
      setGameState('playing');
      setScore(0);
      lastPipeRef.current = performance.now();
    } else if (s.gameState === 'playing') {
      s.velocity = d.jumpVel;
    } else if (s.gameState === 'dead') {
      s.gameState = 'idle';
      s.birdY = 160;
      s.velocity = 0;
      s.pipes = [];
      s.score = 0;
      setGameState('idle');
      setScore(0);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen || !difficulty) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const groundY = H - 40;
    let running = true;

    function loop(ts) {
      if (!running) return;
      const s = stateRef.current;
      const d = diffRef.current;
      s.frame++;
      drawSky(ctx, W, H);

      if (s.gameState === 'playing') {
        s.velocity += d.gravity;
        s.birdY += s.velocity;
        s.groundOffset += d.pipeSpeed;

        if (ts - lastPipeRef.current > d.pipeInterval) {
          const gapY = 80 + Math.random() * (groundY - d.pipeGap - 100);
          s.pipes.push({ x: W + 10, gapY, scored: false });
          lastPipeRef.current = ts;
        }

        for (let i = s.pipes.length - 1; i >= 0; i--) {
          s.pipes[i].x -= d.pipeSpeed;
          if (s.pipes[i].x + PIPE_WIDTH < 0) { s.pipes.splice(i, 1); continue; }
          if (!s.pipes[i].scored && s.pipes[i].x + PIPE_WIDTH < BIRD_X) {
            s.pipes[i].scored = true;
            s.score++;
            setScore(s.score);
          }
          const p = s.pipes[i];
          if (BIRD_X + BIRD_SIZE / 2 > p.x && BIRD_X - BIRD_SIZE / 2 < p.x + PIPE_WIDTH) {
            const topH = p.gapY - d.pipeGap / 2;
            const botY2 = p.gapY + d.pipeGap / 2;
            if (s.birdY - BIRD_SIZE / 2 < topH || s.birdY + BIRD_SIZE / 2 > botY2) {
              s.gameState = 'dead';
              setGameState('dead');
              if (s.score > highScore) { setHighScore(s.score); localStorage.setItem('flappy-hi', String(s.score)); }
            }
          }
        }

        if (s.birdY + BIRD_SIZE / 2 > groundY) {
          s.birdY = groundY - BIRD_SIZE / 2;
          s.gameState = 'dead';
          setGameState('dead');
          if (s.score > highScore) { setHighScore(s.score); localStorage.setItem('flappy-hi', String(s.score)); }
        }
        if (s.birdY < BIRD_SIZE / 2) { s.birdY = BIRD_SIZE / 2; s.velocity = 0; }
      }

      for (const p of stateRef.current.pipes) drawPipe(ctx, p.x, p.gapY, diffRef.current.pipeGap, W, H);
      drawGround(ctx, W, H, s.groundOffset);

      const angle = s.gameState === 'playing' ? Math.min(Math.max(s.velocity * 0.04, -0.5), 1.2) : 0;
      drawBird(ctx, s.birdY, angle, s.frame);

      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.font = 'bold 28px "Courier New", monospace'; ctx.textAlign = 'center';
      ctx.strokeText(String(s.score), W / 2, 40);
      ctx.fillText(String(s.score), W / 2, 40);

      if (s.gameState === 'idle') {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 22px "Courier New", monospace';
        ctx.fillText('FLAPPY BIRD', W / 2, H / 2 - 40);
        ctx.fillStyle = '#fff'; ctx.font = '13px "Courier New", monospace';
        ctx.fillText(`Difficulty: ${diffRef.current.label}`, W / 2, H / 2 - 10);
        ctx.fillText('Click or press Space', W / 2, H / 2 + 15);
        ctx.fillStyle = '#FFD700'; ctx.font = '12px "Courier New", monospace';
        ctx.fillText(`High Score: ${highScore}`, W / 2, H / 2 + 42);
      }

      if (s.gameState === 'dead') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FF4444'; ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 30);
        ctx.fillStyle = '#fff'; ctx.font = '16px "Courier New", monospace';
        ctx.fillText(`Score: ${s.score}`, W / 2, H / 2 + 5);
        ctx.fillStyle = '#FFD700'; ctx.font = '12px "Courier New", monospace';
        ctx.fillText(`Best: ${Math.max(s.score, highScore)}`, W / 2, H / 2 + 30);
        ctx.fillStyle = '#aaa'; ctx.fillText('Click to retry', W / 2, H / 2 + 55);
      }

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => { running = false; if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isOpen, highScore, difficulty]);

  useEffect(() => {
    if (!difficulty) return;
    const handleKey = (e) => {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); jump(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [jump, difficulty]);

  return (
    <Window id="flappy" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
      {!difficulty ? (
        <div className="flappy-menu">
          <div className="flappy-menu-title">🐦 FLAPPY BIRD</div>
          <div className="flappy-menu-subtitle">Select Difficulty</div>
          <div className="flappy-diff-buttons">
            {Object.entries(DIFFICULTIES).map(([key, val]) => (
              <button key={key} className={`flappy-diff-btn flappy-diff-${key}`} onClick={() => selectDifficulty(key)}>
                {val.label}
              </button>
            ))}
          </div>
          <div className="flappy-menu-hi">🏆 High Score: {highScore}</div>
          <button className="flappy-back-btn" onClick={() => setDifficulty(null)} style={{ display: 'none' }}>← Back</button>
        </div>
      ) : (
        <div className="flappy-container">
          <canvas ref={canvasRef} width={380} height={340} className="flappy-canvas" onClick={jump} style={{ cursor: 'pointer' }} />
          <button className="flappy-back-btn" onClick={() => { setDifficulty(null); const s = stateRef.current; s.gameState = 'idle'; s.pipes = []; }}>
            ← Difficulty
          </button>
        </div>
      )}
    </Window>
  );
}
