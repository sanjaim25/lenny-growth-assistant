"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-[#1e293b] rounded-xl shadow-xl border border-[#334155] w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#334155]">
          <h2 className="text-lg font-semibold text-white">Write an Essay</h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
              Topic <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Product-led Growth"
              className="w-full bg-[#0f1115] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
              Angle (Optional)
            </label>
            <input
              type="text"
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              placeholder="e.g. From a bootstrapped founder's perspective"
              className="w-full bg-[#0f1115] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-[#94a3b8] hover:text-white hover:bg-[#334155] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topic.trim()}
              className="px-4 py-2 rounded-lg font-medium bg-[#3b82f6] hover:bg-[#2563eb] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
