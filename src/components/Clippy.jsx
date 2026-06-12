import React, { useState, useEffect, useCallback } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import ClippyChat from './ClippyChat';

const CLIPPY_TIPS = [
  "Click me to chat with AI! 💬",
  "Try opening the Paint app! 🎨",
  "Did you know this runs on React? ⚛️",
  "Check out the Projects folder! 📁",
  "The GrooveAmp has some sick beats! 🎵",
  "Pro tip: Try the TaskMaster app! 📝",
  "This site was built with ❤️ and nostalgia",
  "Click me! I can answer your questions now! 🤖",
  "I'm powered by Gemini AI — ask me anything!",
  "Try the 'Don't Click Me' button... I dare you 😈",
];

export default function Clippy() {
  const { clippyMessage, setClippyMessage, clippyChatOpen, setClippyChatOpen } = useWindowManager();
  const [wiggle, setWiggle] = useState(false);
  const [showBubble, setShowBubble] = useState(true);

  // Periodic tips (only when chat is closed)
  useEffect(() => {
    if (clippyChatOpen) return;
    const timer = setInterval(() => {
      const randomTip = CLIPPY_TIPS[Math.floor(Math.random() * CLIPPY_TIPS.length)];
      setClippyMessage(randomTip);
      setShowBubble(true);
      setWiggle(true);
      setTimeout(() => setWiggle(false), 700);
    }, 12000);
    return () => clearInterval(timer);
  }, [setClippyMessage, clippyChatOpen]);

  // Wiggle periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setWiggle(true);
      setTimeout(() => setWiggle(false), 700);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleClippyClick = useCallback(() => {
    setClippyChatOpen(prev => !prev);
    setShowBubble(false);
    setWiggle(true);
    setTimeout(() => setWiggle(false), 700);
  }, [setClippyChatOpen]);

  const handleCloseChat = useCallback(() => {
    setClippyChatOpen(false);
    setClippyMessage("Come back anytime! I'll be right here 📎");
    setShowBubble(true);
  }, [setClippyChatOpen, setClippyMessage]);

  return (
    <>
      <ClippyChat isOpen={clippyChatOpen} onClose={handleCloseChat} />

      <div className={`clippy ${wiggle ? 'wiggle' : ''}`}>
        {!clippyChatOpen && showBubble && (
          <div className="clippy-bubble" onClick={() => setShowBubble(false)}>
            {clippyMessage}
          </div>
        )}
        <div
          className={`clippy-character ${clippyChatOpen ? 'clippy-active' : ''}`}
          onClick={handleClippyClick}
          title={clippyChatOpen ? 'Close AI Chat' : 'Chat with Clippy AI!'}
        >
          📎
        </div>
      </div>
    </>
  );
}
