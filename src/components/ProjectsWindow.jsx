import React from 'react';
import { motion } from 'framer-motion';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

const PROJECTS = [
  { name: 'CRT Arcade', icon: '🕹️', desc: 'Retro gaming platform' },
  { name: 'Pixel CMS', icon: '📦', desc: 'Content management system' },
  { name: 'Neon Notes', icon: '💡', desc: 'Cyberpunk note-taking app' },
  { name: 'Retro Shop', icon: '🛒', desc: 'E-commerce with 90s vibes' },
  { name: 'Matrix Chat', icon: '💬', desc: 'Encrypted messaging' },
  { name: 'Floppy Drive', icon: '💾', desc: 'Cloud storage, retro style' },
];

export default function ProjectsWindow() {
  const { WINDOW_CONFIGS } = useWindowManager();
  const config = WINDOW_CONFIGS.projects;

  return (
    <Window id="projects" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
      <div className="folder-list">
        {PROJECTS.map((project, i) => (
          <motion.div
            key={project.name}
            className="folder"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            title={project.desc}
          >
            <span className="folder-icon">{project.icon}</span>
            <span className="folder-name">{project.name}</span>
          </motion.div>
        ))}
      </div>
      <div className="status-inset" style={{ marginTop: 10 }}>
        {PROJECTS.length} items • Double-click to explore
      </div>
    </Window>
  );
}
