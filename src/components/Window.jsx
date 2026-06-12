import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowManager } from '../context/WindowManagerContext';
import '../styles/Window.css';

const windowVariants = {
  hidden: {
    scale: 0.3,
    opacity: 0,
    y: 100,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
      mass: 0.8,
    },
  },
  exit: {
    scale: 0.2,
    opacity: 0,
    y: 80,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
  minimized: {
    scale: 0.1,
    opacity: 0,
    y: window.innerHeight,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

export default function Window({ id, title, children, defaultPos, defaultSize }) {
  const {
    openWindows, minimizedWindows, maximizedWindows,
    zOrder, closeWindow, focusWindow, minimizeWindow, toggleMaximize
  } = useWindowManager();

  const isOpen = openWindows.has(id);
  const isMinimized = minimizedWindows.has(id);
  const isMaximized = maximizedWindows.has(id);
  const windowRef = useRef(null);
  const [pos, setPos] = useState(defaultPos || { x: 200, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Store position before maximizing to restore later
  const preMaxPos = useRef(null);

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.title-btn')) return;
    if (isMaximized) return; // Don't drag when maximized
    setIsDragging(true);
    focusWindow(id);
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    e.preventDefault();
  }, [focusWindow, id, isMaximized]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      setPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Touch drag support
  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('.title-btn')) return;
    if (isMaximized) return;
    const touch = e.touches[0];
    setIsDragging(true);
    focusWindow(id);
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
  }, [focusWindow, id, isMaximized]);

  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      setPos({
        x: touch.clientX - dragOffset.current.x,
        y: touch.clientY - dragOffset.current.y,
      });
    };

    const handleTouchEnd = () => setIsDragging(false);

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const handleMaximize = useCallback(() => {
    if (!isMaximized) {
      preMaxPos.current = { ...pos };
    } else {
      if (preMaxPos.current) {
        setPos(preMaxPos.current);
      }
    }
    toggleMaximize(id);
  }, [id, isMaximized, pos, toggleMaximize]);

  // Double-click title bar to maximize
  const handleTitleDoubleClick = useCallback((e) => {
    if (e.target.closest('.title-btn')) return;
    handleMaximize();
  }, [handleMaximize]);

  const shouldShow = isOpen && !isMinimized;

  // Compute styles for maximized vs normal
  const wrapperStyle = isMaximized
    ? {
        left: 0,
        top: 0,
        width: '100%',
        height: 'calc(100vh - 44px)',
        zIndex: zOrder[id] || 10,
      }
    : {
        left: pos.x,
        top: pos.y,
        width: defaultSize?.w || 380,
        zIndex: zOrder[id] || 10,
      };

  const windowStyle = isMaximized
    ? { width: '100%', height: '100%' }
    : { width: '100%', height: defaultSize?.h || 240 };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          ref={windowRef}
          className={`window-wrapper ${isMaximized ? 'maximized' : ''}`}
          style={wrapperStyle}
          variants={windowVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onMouseDown={() => focusWindow(id)}
          layout={isMaximized ? false : undefined}
        >
          <div className="window" style={windowStyle}>
            <div
              className="title-bar focused"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onDoubleClick={handleTitleDoubleClick}
            >
              <div className="title-text">{title}</div>
              <div className="title-actions">
                <div
                  className="title-btn minimize-btn"
                  onClick={() => minimizeWindow(id)}
                  title="Minimize"
                >
                  <span>─</span>
                </div>
                <div
                  className="title-btn maximize-btn"
                  onClick={handleMaximize}
                  title={isMaximized ? 'Restore' : 'Maximize'}
                >
                  <span>{isMaximized ? '❐' : '□'}</span>
                </div>
                <div
                  className="title-btn close-btn"
                  onClick={() => closeWindow(id)}
                  title="Close"
                >
                  <span>✕</span>
                </div>
              </div>
            </div>
            <div className="window-body">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
