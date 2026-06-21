import React, { useState, useEffect } from 'react';
import '../styles/MenuBar.css';

export default function MenuBar() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Format time
      const h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      setTime(`${hour}:${m} ${ampm}`);
      
      // Format date
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      setDate(now.toLocaleDateString('en-US', options));
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="menubar">
      <div className="menubar-left">
        <span className="apple-logo">🍎</span>
        <span className="app-name">Portfolio</span>
      </div>
      <div className="menubar-right">
        <span className="menu-item">File</span>
        <span className="menu-item">Edit</span>
        <span className="menu-item">View</span>
        <span className="menu-item">Window</span>
        <span className="menu-item">Help</span>
        <div className="control-center">
          <span className="control-icon">📶</span>
          <span className="control-icon">🔋</span>
          <span className="control-icon">🔍</span>
        </div>
        <div className="datetime">
          <span className="date">{date}</span>
          <span className="time">{time}</span>
        </div>
      </div>
    </div>
  );
}
