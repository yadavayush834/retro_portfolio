import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

const PORTAL_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; font-family: "VT323", "MS Sans Serif", Arial, sans-serif; background: #c0c0c0; }
  .wrap { padding: 16px; }
  h1 { font-size: 20px; margin: 0 0 10px; color: #000080; }
  input { width: 100%; padding: 8px; font-size: 14px; font-family: inherit; border: 2px inset #999; }
  button { margin-top: 8px; padding: 8px 16px; font-family: inherit; font-size: 14px; cursor: pointer; }
  .note { margin-top: 12px; font-size: 12px; color: #555; }
  .links { margin-top: 16px; }
  .links a { display: block; padding: 4px 0; color: #000080; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>🌐 Retro Search Portal</h1>
    <form action="https://en.wikipedia.org/wiki/Special:Search" method="get">
      <input name="search" placeholder="Search Wikipedia..." />
      <button type="submit">🔍 Search</button>
    </form>
    <div class="links">
      <strong>Quick Links:</strong>
      <a href="https://en.wikipedia.org/wiki/Windows_95" target="_self">Windows 95</a>
      <a href="https://en.wikipedia.org/wiki/Retro_style" target="_self">Retro Style</a>
      <a href="https://en.wikipedia.org/wiki/Web_design" target="_self">Web Design</a>
    </div>
    <div class="note">Tip: Searches redirect to Wikipedia inside this frame.</div>
  </div>
</body>
</html>`;

export default function NetScapeWindow() {
  const { WINDOW_CONFIGS } = useWindowManager();
  const config = WINDOW_CONFIGS.netscape;
  const iframeRef = useRef(null);
  const [address, setAddress] = useState('Search Portal');

  const loadPortal = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.srcdoc = PORTAL_HTML;
    setAddress('Search Portal');
  }, []);

  const navigate = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const value = address.trim();
    if (!value || value === 'Search Portal') {
      loadPortal();
      return;
    }
    if (value.toLowerCase().includes('google.com')) {
      alert('Google blocks iframes. Try Wikipedia or another site.');
      return;
    }
    const hasProtocol = /^https?:\/\//i.test(value) || value.startsWith('data:');
    iframe.src = hasProtocol ? value : ('https://' + value);
  }, [address, loadPortal]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      navigate();
    }
  };

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  return (
    <Window id="netscape" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
      <div className="browser-bar">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={(e) => { if (e.target.value === 'Search Portal') e.target.select(); }}
          aria-label="Address bar"
        />
        <button onClick={navigate}>🔗 Go</button>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <button onClick={loadPortal} style={{ fontSize: 11 }}>🏠 Home</button>
        <button onClick={() => { const f = iframeRef.current; if (f) f.contentWindow?.history.back(); }} style={{ fontSize: 11 }}>◀ Back</button>
      </div>
      <iframe
        ref={iframeRef}
        className="browser-frame"
        title="NetScape Navigator"
        sandbox="allow-forms allow-scripts allow-same-origin"
      />
    </Window>
  );
}
