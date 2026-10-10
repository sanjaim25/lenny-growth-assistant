"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Download, Copy, X } from "lucide-react";

type Artifact = {
  id: string;
  artifact_type: string;
  title: string | null;
  sources: any[];
  word_count: number | null;
  content: string;
  created_at: string;
};

export default function ArtifactViewer({ 
  artifact, 
  onClose 
}: { 
  artifact: Artifact, 
  onClose: () => void 
}) {
  const [activeTab, setActiveTab] = useState<"preview" | "source">("preview");
  const [copied, setCopied] = useState(false);

  if (!artifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${artifact.title || 'artifact'}.${artifact.artifact_type === 'html' ? 'html' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#181b21] border-l border-[#334155] w-full max-w-2xl relative shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#334155] bg-[#1e293b]">
        <div className="flex-1 truncate pr-4">
          <h2 className="text-lg font-semibold text-white truncate">{artifact.title || "Untitled Artifact"}</h2>
          <div className="text-xs text-[#94a3b8] flex space-x-2 mt-1">
            <span>{artifact.artifact_type.toUpperCase()}</span>
            {artifact.word_count && <span>• {artifact.word_count} words</span>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleCopy} className="p-1.5 text-[#94a3b8] hover:text-white rounded" title="Copy">
            <Copy size={16} />
          </button>
          <button onClick={handleDownload} className="p-1.5 text-[#94a3b8] hover:text-white rounded" title="Download">
            <Download size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 text-[#94a3b8] hover:text-white rounded ml-2" title="Close">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-[#334155] bg-[#1e293b]">
        <button
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "preview" 
              ? "border-[#3b82f6] text-[#3b82f6]" 
              : "border-transparent text-[#94a3b8] hover:text-white"
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab("source")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "source" 
              ? "border-[#3b82f6] text-[#3b82f6]" 
              : "border-transparent text-[#94a3b8] hover:text-white"
          }`}
        >
          Source
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-white text-black relative">
        {activeTab === "preview" ? (
          artifact.artifact_type === "html" ? (
            <iframe
              title="Artifact Preview"
              srcDoc={artifact.content}
              sandbox=""
              className="w-full h-full border-0"
            />
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{artifact.content}</ReactMarkdown>
            </div>
          )
        ) : (
          <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800 bg-gray-50 p-4 rounded-lg h-full overflow-y-auto">
            {artifact.content}
          </pre>
        )}
      </div>
      
      {/* Footer / Citations */}
      {artifact.sources && artifact.sources.length > 0 && (
        <div className="p-4 border-t border-[#334155] bg-[#181b21] max-h-48 overflow-y-auto">
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase mb-2">Sources & Citations</h3>
          <ul className="space-y-1">
            {artifact.sources.filter(s => s.type !== 'provider_info').map((s, i) => {
              return (
                <li key={i} className="text-xs text-[#cbd5e1] truncate">
                  <a href={s.source_url || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-[#3b82f6] hover:underline">
                    [{i}] {s.episode_title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
