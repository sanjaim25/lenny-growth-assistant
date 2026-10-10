"use client";

import { useEffect, useState, useRef } from "react";
import ArtifactViewer from "../components/ArtifactViewer";
import WriteEssayModal from "../components/WriteEssayModal";
import { PenLine } from "lucide-react";

type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

type Artifact = {
  id: string;
  artifact_type: string;
  title: string | null;
  sources: any[];
  word_count: number | null;
  content: string;
  created_at: string;
};

type Session = {
  id: string;
  title: string;
  created_at: string;
  messages?: Message[];
  artifacts?: Artifact[];
};

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEssayModalOpen, setIsEssayModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  };

  const fetchSessionDetails = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setArtifacts(data.artifacts || []);
      }
    } catch (e) {
      console.error("Failed to fetch session details", e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      fetchSessionDetails(currentSessionId);
      // Don't auto-clear artifact if we just switch, or do clear it.
      setActiveArtifact(null);
    } else {
      setMessages([]);
      setArtifacts([]);
      setActiveArtifact(null);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSessionId(data.id);
        fetchSessions();
      }
    } catch (e) {
      console.error("Failed to create new chat", e);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/api/sessions/${id}`, { method: "DELETE" });
      if (currentSessionId === id) {
        setCurrentSessionId(null);
      }
      fetchSessions();
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  const getOrCreateSession = async () => {
    if (currentSessionId) return currentSessionId;
    try {
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSessionId(data.id);
        await fetchSessions();
        return data.id;
      }
    } catch (err) {
      console.error("Failed to auto-create session", err);
    }
    return null;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const sessionId = await getOrCreateSession();
    if (!sessionId) return;

    const userMessage = inputText;
    setInputText("");
    
    setMessages(prev => [...prev, {
      id: "temp-" + Date.now(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString()
    }]);

    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      
      if (res.ok) {
        await fetchSessionDetails(sessionId);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWriteEssay = async (topic: string, angle: string) => {
    const sessionId = await getOrCreateSession();
    if (!sessionId) return;

    setMessages(prev => [...prev, {
      id: "temp-" + Date.now(),
      role: "user",
      content: `Write an essay about: ${topic}${angle ? ` with angle: ${angle}` : ''}`,
      created_at: new Date().toISOString()
    }]);

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}/essay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, angle }),
      });
      
      if (res.ok) {
        const artifactData = await res.json();
        await fetchSessionDetails(sessionId);
        setActiveArtifact(artifactData);
      }
    } catch (err) {
      console.error("Failed to generate essay", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen bg-[#0f1115] text-[#f8fafc] font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#181b21] border-r border-[#334155] flex flex-col flex-shrink-0 z-10">
        <div className="p-4 border-b border-[#334155]">
          <h1 className="text-xl font-bold text-[#3b82f6] mb-4">Lenny Assistant</h1>
          <div className="flex space-x-2">
            <button 
              onClick={handleNewChat}
              className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium py-2 px-2 rounded transition-colors text-sm text-center"
            >
              + New Chat
            </button>
            <button 
              onClick={() => setIsEssayModalOpen(true)}
              className="bg-[#1e293b] hover:bg-[#334155] border border-[#3b82f6] text-[#3b82f6] font-medium py-2 px-3 rounded transition-colors"
              title="Write Essay"
            >
              <PenLine size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`group flex flex-col justify-center p-3 cursor-pointer rounded transition-colors ${
                currentSessionId === session.id ? 'bg-[#334155]' : 'hover:bg-[#1e293b]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="truncate text-sm pr-2">
                  {session.title}
                </div>
                <button 
                  onClick={(e) => handleDeleteChat(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-[#94a3b8] hover:text-red-400 transition-opacity"
                  title="Delete Chat"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="p-4 text-center text-sm text-[#64748b]">
              No chats yet.
            </div>
          )}
        </div>
        
        {/* Artifacts inside active session */}
        {artifacts.length > 0 && (
          <div className="border-t border-[#334155] p-2">
            <div className="text-xs font-semibold text-[#94a3b8] uppercase px-2 mb-2">Artifacts</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {artifacts.map(a => (
                <div 
                  key={a.id}
                  onClick={() => setActiveArtifact(a)}
                  className={`flex items-center p-2 cursor-pointer rounded text-sm transition-colors ${
                    activeArtifact?.id === a.id ? 'bg-[#3b82f6] text-white' : 'hover:bg-[#1e293b] text-[#cbd5e1]'
                  }`}
                >
                  <span className="truncate">{a.title || "Untitled"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col relative h-full transition-all duration-300`}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#64748b]">
              <div className="text-2xl mb-2">👋</div>
              <p>Ask a question or click the pen icon to write an essay.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-20">
              {messages.map((msg, i) => (
                <div 
                  key={msg.id || i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-[#3b82f6] text-white rounded-br-none' 
                        : 'bg-[#1e293b] text-[#f8fafc] rounded-bl-none border border-[#334155]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-[#1e293b] text-[#f8fafc] rounded-bl-none border border-[#334155]">
                    <div className="flex space-x-1 items-center h-5">
                      <div className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#0f1115] border-t border-[#334155]">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Lenny..."
              disabled={loading}
              className="w-full bg-[#181b21] border border-[#334155] rounded-xl px-4 py-4 pr-12 focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || loading}
              className="absolute right-3 top-3 bottom-3 px-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ↑
            </button>
          </form>
          <div className="text-center text-xs text-[#64748b] mt-3">
            Grounded Q&A and Ship 30 for 30 Essay Generation available.
          </div>
        </div>
      </div>

      {/* Artifact Viewer Pane */}
      {activeArtifact && (
        <ArtifactViewer 
          artifact={activeArtifact} 
          onClose={() => setActiveArtifact(null)} 
        />
      )}

      {/* Modals */}
      <WriteEssayModal 
        isOpen={isEssayModalOpen} 
        onClose={() => setIsEssayModalOpen(false)} 
        onSubmit={handleWriteEssay} 
      />
    </main>
  );
}
