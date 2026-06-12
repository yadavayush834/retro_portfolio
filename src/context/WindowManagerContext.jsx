import React, { createContext, useContext, useState, useCallback } from 'react';

const WindowManagerContext = createContext(null);

const WINDOW_CONFIGS = {
  about: { title: 'My Computer (About)', icon: '💻', defaultPos: { x: 260, y: 60 }, defaultSize: { w: 400, h: 280 } },
  projects: { title: 'Projects', icon: '📁', defaultPos: { x: 320, y: 120 }, defaultSize: { w: 440, h: 300 } },
  skills: { title: 'Skills', icon: '⚡', defaultPos: { x: 280, y: 170 }, defaultSize: { w: 380, h: 280 } },
  contact: { title: 'Contact', icon: '✉️', defaultPos: { x: 360, y: 200 }, defaultSize: { w: 440, h: 340 } },
  grooveamp: { title: 'GrooveAmp.exe', icon: '🎵', defaultPos: { x: 430, y: 140 }, defaultSize: { w: 380, h: 280 } },
  netscape: { title: 'NetScape Navigator', icon: '🌐', defaultPos: { x: 560, y: 70 }, defaultSize: { w: 440, h: 360 } },
  cinema: { title: 'Cinema95', icon: '🎬', defaultPos: { x: 520, y: 120 }, defaultSize: { w: 440, h: 360 } },
  taskmaster: { title: 'TaskMaster', icon: '📝', defaultPos: { x: 520, y: 200 }, defaultSize: { w: 380, h: 340 } },
  paint: { title: 'Paint.exe', icon: '🎨', defaultPos: { x: 240, y: 240 }, defaultSize: { w: 440, h: 360 } },
  solitaire: { title: 'Solitaire', icon: '🃏', defaultPos: { x: 180, y: 40 }, defaultSize: { w: 560, h: 520 } },
  flappy: { title: 'Flappy Bird', icon: '🐦', defaultPos: { x: 300, y: 60 }, defaultSize: { w: 420, h: 420 } },
  chess: { title: 'Chess', icon: '♛', defaultPos: { x: 200, y: 30 }, defaultSize: { w: 480, h: 540 } },
};

export function WindowManagerProvider({ children }) {
  const [openWindows, setOpenWindows] = useState(new Set(['about']));
  const [minimizedWindows, setMinimizedWindows] = useState(new Set());
  const [maximizedWindows, setMaximizedWindows] = useState(new Set());
  const [zOrder, setZOrder] = useState({ about: 10 });
  const [zCounter, setZCounter] = useState(11);
  const [bootComplete, setBootComplete] = useState(false);
  const [bsodActive, setBsodActive] = useState(false);
  const [clippyMessage, setClippyMessage] = useState("Hi! I'm Clippy. Click me to chat! 💬");
  const [clippyChatOpen, setClippyChatOpen] = useState(false);

  const openWindow = useCallback((id) => {
    setOpenWindows(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Unminimize if it was minimized
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setZCounter(prev => {
      const newZ = prev + 1;
      setZOrder(zo => ({ ...zo, [id]: newZ }));
      return newZ;
    });

    if (id === 'contact') {
      setClippyMessage("It looks like you're trying to send an email. Would you like some help?");
    }
  }, []);

  const closeWindow = useCallback((id) => {
    setOpenWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setMaximizedWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setClippyMessage("I'll save that for later.");
  }, []);

  const minimizeWindow = useCallback((id) => {
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const restoreWindow = useCallback((id) => {
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setZCounter(prev => {
      const newZ = prev + 1;
      setZOrder(zo => ({ ...zo, [id]: newZ }));
      return newZ;
    });
  }, []);

  const toggleMaximize = useCallback((id) => {
    setMaximizedWindows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    // Also unminimize
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const focusWindow = useCallback((id) => {
    setZCounter(prev => {
      const newZ = prev + 1;
      setZOrder(zo => ({ ...zo, [id]: newZ }));
      return newZ;
    });
  }, []);

  const triggerBsod = useCallback(() => setBsodActive(true), []);
  const clearBsod = useCallback(() => {
    setBsodActive(false);
  }, []);

  const value = {
    openWindows,
    minimizedWindows,
    maximizedWindows,
    zOrder,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    focusWindow,
    bootComplete,
    setBootComplete,
    bsodActive,
    triggerBsod,
    clearBsod,
    clippyMessage,
    setClippyMessage,
    clippyChatOpen,
    setClippyChatOpen,
    WINDOW_CONFIGS,
  };

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error('useWindowManager must be used within WindowManagerProvider');
  return ctx;
}
