import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

const SKILLS = [
  { name: 'HTML5 / CSS3', level: 95 },
  { name: 'JavaScript / TypeScript', level: 90 },
  { name: 'React / Next.js', level: 88 },
  { name: 'Retro UI/UX Design', level: 92 },
  { name: 'Micro-animations', level: 85 },
  { name: 'Accessibility & a11y', level: 80 },
  { name: 'Node.js / Express', level: 75 },
  { name: 'Responsive Design', level: 90 },
];

export default function SkillsWindow() {
  const { WINDOW_CONFIGS, openWindows } = useWindowManager();
  const config = WINDOW_CONFIGS.skills;
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (openWindows.has('skills')) {
      setAnimate(false);
      setTimeout(() => setAnimate(true), 100);
    }
  }, [openWindows]);

  return (
    <Window id="skills" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
      <ul className="skill-list">
        {SKILLS.map((skill, i) => (
          <motion.li
            key={skill.name}
            className="skill-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="skill-label">
              <span>{skill.name}</span>
              <span>{skill.level}%</span>
            </div>
            <div className="skill-bar-track">
              <motion.div
                className="skill-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: animate ? `${skill.level}%` : 0 }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
              />
            </div>
          </motion.li>
        ))}
      </ul>
      <div className="status-inset" style={{ marginTop: 10 }}>
        Toolset: Win95 Toolkit v2.0 — {SKILLS.length} skills loaded
      </div>
    </Window>
  );
}
