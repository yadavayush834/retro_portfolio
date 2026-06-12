import React, { useState } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

export default function ContactWindow() {
  const { WINDOW_CONFIGS, setClippyMessage } = useWindowManager();
  const config = WINDOW_CONFIGS.contact;
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('Ready to transmit...');
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('⚠️ All fields required!');
      return;
    }
    setSending(true);
    setStatus('📡 Transmitting...');

    // Simulate sending
    setTimeout(() => {
      setStatus('✅ Message sent successfully!');
      setSending(false);
      setFormData({ name: '', email: '', message: '' });
      setClippyMessage("Your message was sent! I hope they reply. 💌");
      setTimeout(() => setStatus('Ready to transmit...'), 3000);
    }, 1500);
  };

  return (
    <Window id="contact" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
      <form className="contact-form" onSubmit={handleSubmit}>
        <label>Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your name..."
          required
        />
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          required
        />
        <label>Message</label>
        <textarea
          name="message"
          rows="4"
          value={formData.message}
          onChange={handleChange}
          placeholder="Type your message here..."
          required
          style={{ resize: 'vertical' }}
        />
        <div className="contact-form-actions">
          <button type="submit" disabled={sending}>
            {sending ? '⏳ Sending...' : '📧 Send'}
          </button>
          <div className="status-inset" style={{ flex: 1 }}>{status}</div>
        </div>
      </form>
    </Window>
  );
}
