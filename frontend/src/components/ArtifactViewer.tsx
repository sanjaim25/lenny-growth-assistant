"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Download, Copy, X, FileText, Code2, Check } from "lucide-react";

type Artifact = {
  id: string;
  artifact_type: string;
  title: string | null;
  sources: Array<{type: string, source_url?: string, episode_title?: string}>;
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
    <div className="flex flex-col h-full z-20 w-full max-w-2xl relative shadow-2xl" style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-subtle)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#333346]" style={{ background: 'var(--bg-elevated)' }}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: 'var(--accent-muted)', color: 'var(--accent)' }}>
            {artifact.artifact_type === 'html' ? <Code2 size={18} /> : <FileText size={18} />}
          </div>
          <div className="flex-1 truncate pr-4">
            <h2 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {artifact.title || "Untitled Artifact"}
            </h2>
            <div className="text-xs flex space-x-2 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              <span className="font-medium tracking-wide">{artifact.artifact_type.toUpperCase()}</span>
              {artifact.word_count && <span>• {artifact.word_count} words</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleCopy} 
            className="p-2 rounded-lg transition-colors duration-200"
            style={{ color: copied ? 'var(--success)' : 'var(--text-secondary)' }}
            onMouseEnter={e => !copied && (e.currentTarget.style.background = 'var(--bg-tertiary)')}
            onMouseLeave={e => !copied && (e.currentTarget.style.background = 'transparent')}
            title="Copy source"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <button 
            onClick={handleDownload} 
            className="p-2 rounded-lg transition-colors duration-200"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title="Download file"
          >
            <Download size={18} />
          </button>
          <div className="w-px h-6 mx-1" style={{ background: 'var(--border-subtle)' }} />
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg transition-colors duration-200"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = 'var(--error)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            title="Close viewer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-5" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
        <button
          onClick={() => setActiveTab("preview")}
          className="px-4 py-3 text-sm font-medium transition-colors"
          style={{
            borderBottom: `2px solid ${activeTab === "preview" ? 'var(--accent)' : 'transparent'}`,
            color: activeTab === "preview" ? 'var(--accent)' : 'var(--text-secondary)',
          }}
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab("source")}
          className="px-4 py-3 text-sm font-medium transition-colors"
          style={{
            borderBottom: `2px solid ${activeTab === "source" ? 'var(--accent)' : 'transparent'}`,
            color: activeTab === "source" ? 'var(--accent)' : 'var(--text-secondary)',
          }}
        >
          Source
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative" style={{ background: activeTab === 'preview' ? '#ffffff' : 'var(--bg-primary)' }}>
        {activeTab === "preview" ? (
          artifact.artifact_type === "html" ? (
            <iframe
              title="Artifact Preview"
              srcDoc={artifact.content}
              sandbox=""
              className="w-full h-full border-0"
            />
          ) : (
            <div className="p-8 h-full">
              <div className="prose prose-sm max-w-none text-black">
                <ReactMarkdown>{artifact.content}</ReactMarkdown>
              </div>
            </div>
          )
        ) : (
          <div className="p-6 h-full">
            <pre 
              className="text-sm font-mono whitespace-pre-wrap rounded-xl h-full overflow-y-auto p-4"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
            >
              {artifact.content}
            </pre>
          </div>
        )}
      </div>
      
      {/* Footer / Citations */}
      {artifact.sources && artifact.sources.filter(s => s.type === 'citation').length > 0 && (
        <div className="p-5 max-h-48 overflow-y-auto" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Sources & Citations</h3>
          <ul className="space-y-1.5">
            {artifact.sources.filter(s => s.type === 'citation').map((s, i) => (
              <li key={i} className="text-sm truncate">
                <a 
                  href={s.source_url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 hover:underline transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  <span style={{ color: 'var(--text-tertiary)' }}>[{i + 1}]</span> 
                  <FileText size={12} className="flex-shrink-0" />
                  {s.episode_title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
