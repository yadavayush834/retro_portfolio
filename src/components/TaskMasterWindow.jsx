import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

const TODO_KEY = 'win95-taskmaster';

function loadStoredTodos() {
  try {
    const raw = localStorage.getItem(TODO_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not load todos', e);
  }
  return [];
}

export default function TaskMasterWindow() {
  const { WINDOW_CONFIGS } = useWindowManager();
  const config = WINDOW_CONFIGS.taskmaster;
  const [todos, setTodos] = useState(loadStoredTodos);
  const [input, setInput] = useState('');

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(TODO_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setTodos(prev => [...prev, { id: Date.now(), text, done: false }]);
    setInput('');
  }, [input]);

  const toggleTodo = useCallback((id) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    ));
  }, []);

  const deleteTodo = useCallback((id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTodo();
    }
  };

  return (
    <Window id="taskmaster" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
      <div className="todo-panel">
        <div className="todo-input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
          />
          <button onClick={addTodo}>➕ Add</button>
        </div>
        <ul className="todo-list">
          <AnimatePresence>
            {todos.map(todo => (
              <motion.li
                key={todo.id}
                className="todo-item"
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleTodo(todo.id)}
                  style={{ cursor: 'pointer', width: 'auto' }}
                />
                <span style={{
                  flex: 1,
                  textDecoration: todo.done ? 'line-through' : 'none',
                  opacity: todo.done ? 0.5 : 1,
                }}>
                  {todo.text}
                </span>
                <button onClick={() => deleteTodo(todo.id)} style={{ padding: '2px 8px' }}>✕</button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <div className="status-inset">
          {todos.length} tasks • {todos.filter(t => t.done).length} completed • Saved locally
        </div>
      </div>
    </Window>
  );
}
