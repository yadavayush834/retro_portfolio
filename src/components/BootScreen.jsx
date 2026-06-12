import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowManager } from '../context/WindowManagerContext';

const BOOT_LINES = [
  "C:\\> BOOT.EXE...",
  "Detecting hardware...",
  "CPU: Pentium™ 133MHz",
  "RAM: 16 MB EDO",
  "Loading Win95 Ultimate Edition...",
  "Initializing desktop environment...",
  "System ready."
];

export default function BootScreen() {
  const { bootComplete, setBootComplete } = useWindowManager();
  const [displayText, setDisplayText] = useState('');
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Typewriter effect
  useEffect(() => {
    if (bootComplete) return;
    if (lineIndex >= BOOT_LINES.length) return;

    const currentLine = BOOT_LINES[lineIndex];

    if (charIndex <= currentLine.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => {
          const lines = prev.split('\n');
          lines[lineIndex] = currentLine.slice(0, charIndex);
          return lines.join('\n');
        });
        setCharIndex(c => c + 1);
      }, 25 + Math.random() * 20);
      return () => clearTimeout(timer);
    } else {
      // Move to next line
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + '\n');
        setLineIndex(l => l + 1);
        setCharIndex(0);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [lineIndex, charIndex, bootComplete]);

  // Progress bar
  useEffect(() => {
    if (bootComplete) return;
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if (next >= 20) {
          clearInterval(timer);
          setTimeout(() => setBootComplete(true), 400);
        }
        return Math.min(next, 20);
      });
    }, 140);
    return () => clearInterval(timer);
  }, [bootComplete, setBootComplete]);

  const barText = '[' + '█'.repeat(progress) + '░'.repeat(Math.max(0, 20 - progress)) + ']';

  return (
    <AnimatePresence>
      {!bootComplete && (
        <motion.div
          className="boot-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
        >
          <div className="boot-content">
            <div className="boot-text">
              {displayText}
              <span className="boot-cursor">█</span>
            </div>
            <div className="progress-wrap">
              <div className="progress-bar-text">{barText}</div>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: '#666' }}>
              © 1995 Win95 Ultimate Edition
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
