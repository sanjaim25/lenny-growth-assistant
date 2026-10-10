import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function WriteHtmlModal({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (prompt: string) => void }) {
  const [prompt, setPrompt] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#1e293b] border border-[#334155] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-[#334155]">
          <h2 className="text-lg font-bold text-white">Generate HTML/CSS UI</h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Description</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create an HTML/CSS dashboard summarizing enterprise sales lessons..."
              className="w-full bg-[#0f1115] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3b82f6] min-h-[100px]"
            />
          </div>
          <button 
            onClick={() => {
              if (!prompt.trim()) return;
              onSubmit(prompt);
              setPrompt("");
              onClose();
            }}
            disabled={!prompt.trim()}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Generate HTML
          </button>
        </div>
      </div>
    </div>
  );
}
