import React, { useCallback } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import '../styles/Desktop.css';

const DESKTOP_ICONS = [
  { id: 'about', label: 'My Computer\n(About)', emoji: '💻' },
  { id: 'projects', label: 'Projects', emoji: '📁' },
  { id: 'skills', label: 'Skills', emoji: '⚡' },
  { id: 'contact', label: 'Contact', emoji: '✉️' },
  { id: 'grooveamp', label: 'GrooveAmp.exe', emoji: '🎵' },
  { id: 'netscape', label: 'NetScape\nNavigator', emoji: '🌐' },
  { id: 'cinema', label: 'Cinema95', emoji: '🎬' },
  { id: 'taskmaster', label: 'TaskMaster', emoji: '📝' },
  { id: 'paint', label: 'Paint.exe', emoji: '🎨' },
  { id: 'solitaire', label: 'Solitaire', emoji: '🃏' },
  { id: 'flappy', label: 'Flappy Bird', emoji: '🐦' },
  { id: 'chess', label: 'Chess', emoji: '♛' },
];

export default function DesktopIcons() {
  const { openWindow } = useWindowManager();

  const handleDoubleClick = useCallback((id) => {
    openWindow(id);
  }, [openWindow]);

  return (
    <div className="desktop-icons">
      {DESKTOP_ICONS.map(icon => (
        <div
          key={icon.id}
          className="desktop-icon"
          onDoubleClick={() => handleDoubleClick(icon.id)}
          onClick={() => handleDoubleClick(icon.id)}
          title={`Open ${icon.label.replace('\n', ' ')}`}
        >
          <span className="icon-emoji">{icon.emoji}</span>
          <span className="icon-label">{icon.label}</span>
        </div>
      ))}
    </div>
  );
}
