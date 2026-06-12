import React from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

export default function AboutWindow() {
  const { triggerBsod, WINDOW_CONFIGS } = useWindowManager();
  const config = WINDOW_CONFIGS.about;

  return (
    <Window id="about" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
      <p style={{ marginBottom: 12, lineHeight: 1.6 }}>
        Hi, I'm a creative front-end developer who loves turning interfaces into nostalgic, playful experiences.
        I build retro-inspired sites with modern performance and accessible interactions.
      </p>
      <div style={{ display: 'grid', gap: 8, fontSize: 12 }}>
        <div className="status-inset">
          <strong>System Info</strong><br />
          OS: Windows 95 Ultimate Edition<br />
          CPU: Creative Core™ @ ∞ MHz<br />
          RAM: Unlimited Imagination
        </div>
        <div className="status-inset">Status: Online • Mode: 1995 • Vibes: Excellent</div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button
          onClick={triggerBsod}
          style={{ color: '#c00' }}
        >
          ⚠️ Don't Click Me
        </button>
      </div>
    </Window>
  );
}
