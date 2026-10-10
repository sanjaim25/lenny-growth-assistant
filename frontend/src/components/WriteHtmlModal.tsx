import React, { useState } from 'react';
import { X, Code2 } from 'lucide-react';

export default function WriteHtmlModal({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (prompt: string) => void }) {
  const [prompt, setPrompt] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex justify-between items-center p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'var(--accent-muted)', color: 'var(--accent)' }}>
              <Code2 size={16} />
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Generate HTML UI</h2>
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
        
        <div className="p-5 space-y-5" style={{ background: 'var(--bg-secondary)' }}>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create a dark mode dashboard summarizing enterprise sales metrics..."
              className="w-full text-sm transition-colors duration-200 min-h-[120px] resize-y"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                padding: '12px 14px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />
          </div>
          
          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (!prompt.trim()) return;
                onSubmit(prompt);
                setPrompt("");
                onClose();
              }}
              disabled={!prompt.trim()}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: prompt.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: prompt.trim() ? '#fff' : 'var(--text-tertiary)',
                cursor: prompt.trim() ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={e => prompt.trim() && (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={e => prompt.trim() && (e.currentTarget.style.background = 'var(--accent)')}
            >
              Generate HTML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
