import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowManager } from '../context/WindowManagerContext';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// System prompt for Clippy personality
const CLIPPY_SYSTEM = `You are Clippy, the famous Microsoft Office assistant from the 1990s! 
You are helpful, a little annoying, and always offer unsolicited advice. 
Keep responses short (2-3 sentences max), witty, and sprinkle in 90s references.
Use emojis occasionally. Always be enthusiastic about helping.
You live inside a Windows 95-themed portfolio website.
If asked about the developer, say nice things about their retro design skills.`;

export default function ClippyChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi there! I'm Clippy, your friendly AI assistant! 📎 Ask me anything — I promise I'm more helpful than the original Clippy! 😄" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini-api-key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const saveApiKey = useCallback((key) => {
    setApiKey(key);
    localStorage.setItem('gemini-api-key', key);
    setShowKeyInput(false);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const systemInstruction = {
        parts: [{ text: CLIPPY_SYSTEM }]
      };

      // Build alternating user/model messages
      const recent = [...messages.slice(-10), userMsg];
      const contents = [];

      for (const msg of recent) {
        const role = msg.role === 'user' ? 'user' : 'model';
        const lastEntry = contents[contents.length - 1];
        if (lastEntry && lastEntry.role === role) {
          lastEntry.parts[0].text += '\n' + msg.text;
        } else {
          contents.push({ role, parts: [{ text: msg.text }] });
        }
      }

      // Gemini requires first message to be 'user'
      if (contents.length > 0 && contents[0].role !== 'user') {
        contents.shift();
      }

      const requestBody = JSON.stringify({
        systemInstruction,
        contents,
        generationConfig: { maxOutputTokens: 200, temperature: 0.8 }
      });

      // Retry with backoff for rate limits (429)
      let response;
      const maxRetries = 3;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        });

        if (response.status === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        break;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || `API Error: ${response.status}`;
        throw new Error(`${response.status}::${errMsg}`);
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        || "Hmm, I seem to have a paper jam in my brain. Try again? 📎";

      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      console.error('Clippy AI error:', err);
      let errorMsg = "Oops! ";
      const msg = err.message || '';
      if (msg.includes('API_KEY') || msg.includes('API key') || msg.includes('403')) {
        errorMsg += "API key invalid or not enabled. Click ⚙️ to check your key. Make sure it's from aistudio.google.com/apikey";
      } else if (msg.includes('429') || msg.includes('quota') || msg.includes('rate') || msg.includes('Resource')) {
        errorMsg += "Free tier rate limit reached. The free plan allows ~15 requests/min. Wait 60 seconds and try again! ⏳";
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        errorMsg += "Network error — check your internet connection.";
      } else {
        errorMsg += msg.split('::').pop();
      }
      setMessages(prev => [...prev, { role: 'assistant', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  }, [input, apiKey, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="clippy-chat-panel"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {/* Title bar */}
          <div className="clippy-chat-title">
            <span>📎 Clippy AI Assistant</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <div
                className="title-btn"
                onClick={() => setShowKeyInput(prev => !prev)}
                title="API Key Settings"
                style={{ fontSize: 10 }}
              >
                ⚙️
              </div>
              <div className="title-btn close-btn" onClick={onClose}>
                <span>✕</span>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          {showKeyInput && (
            <div className="clippy-key-input">
              <div style={{ fontSize: 11, marginBottom: 4 }}>
                Enter your Gemini API key:
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  style={{ flex: 1 }}
                />
                <button onClick={() => saveApiKey(apiKey)}>Save</button>
              </div>
              <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                Get one free at{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                  style={{ color: '#000080' }}>
                  Google AI Studio
                </a>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="clippy-chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`clippy-msg ${msg.role === 'user' ? 'clippy-msg-user' : 'clippy-msg-bot'}`}
              >
                {msg.role === 'assistant' && <span className="clippy-msg-avatar">📎</span>}
                <div className="clippy-msg-text">{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="clippy-msg clippy-msg-bot">
                <span className="clippy-msg-avatar">📎</span>
                <div className="clippy-msg-text clippy-typing">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="clippy-chat-input">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={apiKey ? "Ask Clippy anything..." : "Set API key first (⚙️)"}
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              {loading ? '⏳' : '➤'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
