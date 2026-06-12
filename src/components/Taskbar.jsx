import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowManager } from '../context/WindowManagerContext';
import '../styles/Taskbar.css';

const MENU_ITEMS = [
  { id: 'about', label: 'About', icon: '💻' },
  { id: 'projects', label: 'Projects', icon: '📁' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'contact', label: 'Contact', icon: '✉️' },
  { id: 'grooveamp', label: 'GrooveAmp', icon: '🎵' },
  { id: 'netscape', label: 'NetScape', icon: '🌐' },
  { id: 'cinema', label: 'Cinema95', icon: '🎬' },
  { id: 'taskmaster', label: 'TaskMaster', icon: '📝' },
  { id: 'paint', label: 'Paint.exe', icon: '🎨' },
  { id: 'solitaire', label: 'Solitaire', icon: '🃏' },
  { id: 'flappy', label: 'Flappy Bird', icon: '🐦' },
  { id: 'chess', label: 'Chess', icon: '♛' },
];

export default function Taskbar() {
  const {
    openWindows, minimizedWindows,
    openWindow, focusWindow, restoreWindow, minimizeWindow,
    WINDOW_CONFIGS
  } = useWindowManager();
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState('');

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      setTime(`${hour}:${m} ${ampm}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const handleMenuClick = useCallback((id) => {
    openWindow(id);
    setMenuOpen(false);
  }, [openWindow]);

  const handleTaskClick = useCallback((id) => {
    if (minimizedWindows.has(id)) {
      // Restore minimized window
      restoreWindow(id);
    } else {
      // If it's already focused, minimize it; otherwise focus it
      minimizeWindow(id);
    }
  }, [minimizedWindows, restoreWindow, minimizeWindow]);

  return (
    <>
      {/* Start Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="start-menu-backdrop" onClick={() => setMenuOpen(false)} />
            <motion.div
              className="start-menu"
              initial={{ y: 20, opacity: 0, scaleY: 0.8 }}
              animate={{ y: 0, opacity: 1, scaleY: 1 }}
              exit={{ y: 20, opacity: 0, scaleY: 0.7 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ transformOrigin: 'bottom left' }}
            >
              <div className="start-menu-sidebar">
                <span>Windows95</span>
              </div>
              <div className="start-menu-items">
                {MENU_ITEMS.map((item, i) => (
                  <React.Fragment key={item.id}>
                    <div
                      className="menu-item"
                      onClick={() => handleMenuClick(item.id)}
                    >
                      <span className="menu-item-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {(i === 4 || i === 8) && <div className="menu-divider" />}
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Taskbar */}
      <div className="taskbar">
        <div
          className={`start-btn ${menuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          <div className="win-logo">
            <div className="win-logo-g"></div>
            <div className="win-logo-y"></div>
            <div className="win-logo-r"></div>
            <div className="win-logo-b"></div>
          </div>
          <strong>Start</strong>
        </div>

        <div className="task-buttons">
          {Array.from(openWindows).map(id => {
            const config = WINDOW_CONFIGS[id];
            if (!config) return null;
            const isMinimized = minimizedWindows.has(id);
            return (
              <div
                key={id}
                className={`task-btn ${isMinimized ? '' : 'active'}`}
                onClick={() => handleTaskClick(id)}
                title={isMinimized ? `Restore ${config.title}` : `Minimize ${config.title}`}
              >
                {config.icon} {config.title}
              </div>
            );
          })}
        </div>

        <div className="clock">
          {time}
        </div>
      </div>
    </>
  );
}
