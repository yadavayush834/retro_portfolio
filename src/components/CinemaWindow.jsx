import React, { useRef, useCallback, useEffect } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

export default function CinemaWindow() {
  const { WINDOW_CONFIGS, openWindows } = useWindowManager();
  const config = WINDOW_CONFIGS.cinema;
  const videoRef = useRef(null);

  // Stop video when window closes
  useEffect(() => {
    if (!openWindows.has('cinema') && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [openWindows]);

  const play = useCallback(() => videoRef.current?.play(), []);
  const pause = useCallback(() => videoRef.current?.pause(), []);
  const stop = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);
  const volDown = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.round((videoRef.current.volume - 0.1) * 10) / 10);
    }
  }, []);
  const volUp = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.volume = Math.min(1, Math.round((videoRef.current.volume + 0.1) * 10) / 10);
    }
  }, []);

  return (
    <Window id="cinema" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
      <video
        ref={videoRef}
        className="video-frame"
        width="100%"
        height="200"
        preload="metadata"
      >
        <source
          src="https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4"
          type="video/mp4"
        />
        Your browser does not support video.
      </video>
      <div className="retro-controls">
        <button onClick={play}>▶ Play</button>
        <button onClick={pause}>⏸ Pause</button>
        <button onClick={stop}>⏹ Stop</button>
        <button onClick={volDown}>🔉 Vol -</button>
        <button onClick={volUp}>🔊 Vol +</button>
      </div>
    </Window>
  );
}
