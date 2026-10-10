"use client";

import React, { useState } from "react";
import { X, PenLine } from "lucide-react";

export default function WriteEssayModal({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (topic: string, angle: string) => void;
}) {
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit(topic, angle);
      setTopic("");
      setAngle("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'var(--accent-muted)', color: 'var(--accent)' }}>
              <PenLine size={16} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Write an Essay</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-5" style={{ background: 'var(--bg-secondary)' }}>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Topic <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Product-led Growth"
              className="w-full text-sm transition-colors duration-200"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Angle (Optional)
            </label>
            <input
              type="text"
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              placeholder="e.g. Bootstrapped founder's perspective"
              className="w-full text-sm transition-colors duration-200"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topic.trim()}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: topic.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: topic.trim() ? '#fff' : 'var(--text-tertiary)',
                cursor: topic.trim() ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={e => topic.trim() && (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={e => topic.trim() && (e.currentTarget.style.background = 'var(--accent)')}
            >
              Generate Essay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
