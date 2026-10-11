"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import ArtifactViewer from "../components/ArtifactViewer";
import WriteEssayModal from "../components/WriteEssayModal";
import WriteHtmlModal from "../components/WriteHtmlModal";
import { PenLine, Code, Plus, Trash2, MessageSquare, Sparkles, Send, AlertCircle, FileText, LayoutDashboard, Pencil } from "lucide-react";

type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
  sources?: Array<{type: string, source_url?: string, episode_title?: string}>;
  isOptimistic?: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const [isEssayModalOpen, setIsEssayModalOpen] = useState(false);
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [sendingLock, setSendingLock] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Elapsed time tracker for loading feedback
  useEffect(() => {
    if (loading) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  }, [API_URL]);

  // Fetch session details but PRESERVE any existing optimistic messages
  const fetchSessionDetails = useCallback(async (id: string, preserveOptimistic = false) => {
    try {
      const res = await fetch(`${API_URL}/api/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        const serverMessages: Message[] = data.messages || [];
        const serverArtifacts: Artifact[] = data.artifacts || [];

        if (preserveOptimistic) {
          // Merge: keep optimistic messages that aren't yet in server response
          setMessages(prev => {
            const serverIds = new Set(serverMessages.map(m => m.id));
            const optimisticToKeep = prev.filter(m => m.isOptimistic && !serverIds.has(m.id));
            return [...serverMessages, ...optimisticToKeep];
          });
        } else {
          setMessages(serverMessages);
        }
        setArtifacts(serverArtifacts);
      }
    } catch (e) {
      console.error("Failed to fetch session details", e);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (currentSessionId) {
      // Only fetch details for real (non-temp) sessions
      if (!currentSessionId.startsWith("temp-")) {
        fetchSessionDetails(currentSessionId, true);
      }
      setActiveArtifact(null);
    } else {
      setMessages([]);
      setArtifacts([]);
      setActiveArtifact(null);
    }
  }, [currentSessionId, fetchSessionDetails]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ---------- Session management ----------

  const handleNewChat = () => {
    // Instantly open an empty chat with a client-side temp ID
    setCurrentSessionId(null);
    setMessages([]);
    setArtifacts([]);
    setActiveArtifact(null);
    setError(null);
    // Focus the input for immediate typing
    setTimeout(() => inputRef.current?.focus(), 50);
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

  const handleStartRename = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
    setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 50);
  };

  const handleCancelRename = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  const handleSaveRename = async (sessionId: string) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      setError("Chat title cannot be empty");
      return;
    }

    // Optimistically update sidebar immediately
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: trimmed } : s));
    setEditingSessionId(null);

    try {
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || "Failed to update chat title.");
        fetchSessions(); // Revert on failure
      }
    } catch (err) {
      console.error("Failed to rename session", err);
      setError("Network error: failed to update chat title.");
      fetchSessions(); // Revert on failure
    }
  };

  // Create a real backend session, returning the ID
  const ensureSession = async (): Promise<string | null> => {
    if (currentSessionId && !currentSessionId.startsWith("temp-")) {
      return currentSessionId;
    }
    try {
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update session ID without triggering a full refetch that wipes messages
        setCurrentSessionId(data.id);
        fetchSessions();
        return data.id;
      }
    } catch (err) {
      console.error("Failed to create session", err);
    }
    return null;
  };

  // ---------- Chat send ----------

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sendingLock) return;

    const userMessage = inputText.trim();
    setInputText("");
    setError(null);
    setSendingLock(true);

    // Step 1: Immediately display the user's message (optimistic)
    const optimisticMsg: Message = {
      id: "optimistic-" + Date.now(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setLoading(true);

    try {
      // Step 2: Ensure we have a real backend session
      const sessionId = await ensureSession();
      if (!sessionId) {
        setError("Could not create a chat session. Check backend connectivity.");
        setLoading(false);
        setSendingLock(false);
        return;
      }

      // Step 3: Send the message
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (res.ok) {
        // Step 4: Refresh messages from server — replace optimistic with real data
        await fetchSessionDetails(sessionId, false);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || `Server error (${res.status})`);
      }
    } catch (err) {
      console.error("Failed to send message", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setSendingLock(false);
    }
  };

  // ---------- Essay & HTML generation ----------

  const handleWriteEssay = async (topic: string, angle: string) => {
    setError(null);
    setSendingLock(true);

    const optimisticMsg: Message = {
      id: "optimistic-" + Date.now(),
      role: "user",
      content: `📝 Write an essay about: ${topic}${angle ? ` (angle: ${angle})` : ''}`,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setLoading(true);

    try {
      const sessionId = await ensureSession();
      if (!sessionId) {
        setError("Could not create a session.");
        setLoading(false);
        setSendingLock(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/sessions/${sessionId}/essay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, angle }),
      });

      if (res.ok) {
        const artifactData = await res.json();
        await fetchSessionDetails(sessionId, false);
        setActiveArtifact(artifactData);
      } else {
        setError("Essay generation failed. Try again.");
      }
    } catch (err) {
      console.error("Failed to generate essay", err);
      setError("Network error during essay generation.");
    } finally {
      setLoading(false);
      setSendingLock(false);
    }
  };

  const handleGenerateHtml = async (prompt: string) => {
    setError(null);
    setSendingLock(true);

    const optimisticMsg: Message = {
      id: "optimistic-" + Date.now(),
      role: "user",
      content: `🎨 Generate HTML/CSS: ${prompt}`,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setLoading(true);

    try {
      const sessionId = await ensureSession();
      if (!sessionId) {
        setError("Could not create a session.");
        setLoading(false);
        setSendingLock(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/sessions/${sessionId}/html`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      if (res.ok) {
        const artifactData = await res.json();
        await fetchSessionDetails(sessionId, false);
        setActiveArtifact(artifactData);
      } else {
        setError("HTML generation failed. Try again.");
      }
    } catch (err) {
      console.error("Failed to generate HTML", err);
      setError("Network error during HTML generation.");
    } finally {
      setLoading(false);
      setSendingLock(false);
    }
  };

  // ---------- Session switching ----------

  const handleSelectSession = (id: string) => {
    if (id === currentSessionId) return;
    setError(null);
    setCurrentSessionId(id);
  };

  // ---------- Loading status text ----------

  const getLoadingText = () => {
    if (elapsedSeconds < 3) return "Lenny is thinking…";
    if (elapsedSeconds < 8) return "Searching knowledge base…";
    if (elapsedSeconds < 15) return "Generating response…";
    if (elapsedSeconds < 30) return `Still working… (${elapsedSeconds}s)`;
    return `Taking longer than usual… (${elapsedSeconds}s)`;
  };

  // ---------- Render ----------

  const hasActiveChat = currentSessionId !== null || messages.length > 0;

  return (
    <main className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col flex-shrink-0 h-full"
        style={{
          width: '260px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo + New Chat */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, background: 'var(--accent-muted)' }}
            >
              <Sparkles size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Lenny Growth</h1>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>AI Assistant</p>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: 'var(--accent)',
              color: '#fff',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setIsEssayModalOpen(true)}
            className="flex items-center gap-1.5 flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <PenLine size={14} />
            Essay
          </button>
          <button
            onClick={() => setIsHtmlModalOpen(true)}
            className="flex items-center gap-1.5 flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Code size={14} />
            HTML
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '8px' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)', padding: '4px 8px' }}>
            Conversations
          </div>
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className="group flex items-center gap-2 py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-150 mb-0.5"
              style={{
                background: currentSessionId === session.id ? 'var(--accent-muted)' : 'transparent',
                color: currentSessionId === session.id ? 'var(--accent-hover)' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => {
                if (currentSessionId !== session.id) {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }
              }}
              onMouseLeave={e => {
                if (currentSessionId !== session.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <MessageSquare size={14} className="flex-shrink-0" style={{ opacity: 0.6 }} />
              {editingSessionId === session.id ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                      handleSaveRename(session.id);
                    } else if (e.key === "Escape") {
                      handleCancelRename();
                    }
                  }}
                  onBlur={() => handleSaveRename(session.id)}
                  className="flex-1 text-sm rounded px-1.5 py-0.5 outline-none"
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--accent)',
                  }}
                />
              ) : (
                <span className="flex-1 truncate text-sm">{session.title}</span>
              )}
              {editingSessionId !== session.id && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={(e) => handleStartRename(session, e)}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                    title="Rename Chat"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteChat(session.id, e)}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                    title="Delete Chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No conversations yet
            </div>
          )}
        </div>

        {/* Artifacts Section */}
        {artifacts.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '8px' }}>
            <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)', padding: '4px 8px' }}>
              Artifacts
            </div>
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {artifacts.map(a => (
                <div
                  key={a.id}
                  onClick={() => setActiveArtifact(a)}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer text-sm transition-all duration-150"
                  style={{
                    background: activeArtifact?.id === a.id ? 'var(--accent-muted)' : 'transparent',
                    color: activeArtifact?.id === a.id ? 'var(--accent-hover)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={e => {
                    if (activeArtifact?.id !== a.id) e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={e => {
                    if (activeArtifact?.id !== a.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {a.artifact_type === 'html' ? <LayoutDashboard size={14} /> : <FileText size={14} />}
                  <span className="truncate">{a.title || "Untitled"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col h-full relative" style={{ minWidth: 0 }}>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '24px 16px' }}>
          {!hasActiveChat ? (
            /* Empty / Welcome State */
            <div className="h-full flex flex-col items-center justify-center" style={{ maxWidth: '520px', margin: '0 auto' }}>
              <div
                className="flex items-center justify-center rounded-2xl mb-6"
                style={{ width: 64, height: 64, background: 'var(--accent-muted)' }}
              >
                <Sparkles size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                What can I help you with?
              </h2>
              <p className="text-sm text-center mb-8" style={{ color: 'var(--text-tertiary)', lineHeight: '1.6' }}>
                Ask questions grounded in Lenny&apos;s Podcast transcripts, generate essays in the Ship 30 for 30 format, or create HTML/CSS dashboards.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full">
                {[
                  { label: "Enterprise sales strategy", icon: "💼" },
                  { label: "Product-led growth tactics", icon: "🚀" },
                  { label: "Write an essay on PLG", icon: "📝" },
                  { label: "User onboarding best practices", icon: "🎯" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (item.label.startsWith("Write an essay")) {
                        setIsEssayModalOpen(true);
                      } else {
                        setInputText(item.label);
                        inputRef.current?.focus();
                      }
                    }}
                    className="flex items-center gap-2 py-3 px-4 rounded-xl text-sm text-left transition-all duration-200"
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.background = 'var(--bg-elevated)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages List */
            <div style={{ maxWidth: '768px', margin: '0 auto' }}>
              {messages.length === 0 && !loading && (
                <div className="h-full flex flex-col items-center justify-center py-20">
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Start a conversation…
                  </p>
                </div>
              )}
              <div className="space-y-1">
                {messages.map((msg) => (
                  <div key={msg.id} className="animate-fade-in-up" style={{ padding: '8px 0' }}>
                    {msg.role === 'user' ? (
                      /* User Message */
                      <div className="flex justify-end">
                        <div
                          className="user-prose chat-prose"
                          style={{
                            maxWidth: '80%',
                            background: 'var(--user-bubble)',
                            color: 'var(--user-bubble-text)',
                            padding: '12px 18px',
                            borderRadius: '18px 18px 4px 18px',
                            opacity: msg.isOptimistic ? 0.85 : 1,
                          }}
                        >
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      /* Assistant Message */
                      <div className="flex justify-start gap-3">
                        <div
                          className="flex-shrink-0 flex items-start justify-center rounded-full mt-1"
                          style={{ width: 28, height: 28, background: 'var(--accent-muted)' }}
                        >
                          <Sparkles size={14} style={{ color: 'var(--accent)', marginTop: '7px' }} />
                        </div>
                        <div style={{ maxWidth: '85%', minWidth: 0 }}>
                          <div
                            className="chat-prose"
                            style={{
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-subtle)',
                              padding: '14px 18px',
                              borderRadius: '4px 18px 18px 18px',
                            }}
                          >
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>

                          {/* Citation Chips */}
                          {msg.sources && msg.sources.filter((s: {type: string, source_url?: string, episode_title?: string}) => s.type === 'citation').length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {msg.sources.filter((s: {type: string, source_url?: string, episode_title?: string}) => s.type === 'citation').map((source: {type: string, source_url?: string, episode_title?: string}, idx: number) => (
                                <a
                                  key={idx}
                                  href={source.source_url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs py-1.5 px-3 rounded-full transition-all duration-200 truncate"
                                  style={{
                                    background: 'var(--accent-muted)',
                                    color: 'var(--accent-hover)',
                                    border: '1px solid transparent',
                                    maxWidth: '280px',
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'var(--accent)';
                                    e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.background = 'var(--accent-muted)';
                                  }}
                                >
                                  <FileText size={11} />
                                  {source.episode_title}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Thinking Indicator */}
                {loading && (
                  <div className="animate-fade-in-up" style={{ padding: '8px 0' }}>
                    <div className="flex justify-start gap-3">
                      <div
                        className="flex-shrink-0 flex items-start justify-center rounded-full mt-1 glow-pulse"
                        style={{ width: 28, height: 28, background: 'var(--accent-muted)' }}
                      >
                        <Sparkles size={14} style={{ color: 'var(--accent)', marginTop: '7px' }} />
                      </div>
                      <div
                        style={{
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-subtle)',
                          padding: '14px 18px',
                          borderRadius: '4px 18px 18px 18px',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <div className="thinking-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                            <div className="thinking-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                            <div className="thinking-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                          </div>
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {getLoadingText()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} style={{ height: '80px' }} />
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div
            className="flex items-center gap-2 text-sm mx-auto animate-fade-in-up"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--error)',
              padding: '8px 16px',
              borderRadius: '8px',
              maxWidth: '768px',
              width: '100%',
              marginBottom: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs underline"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input Area */}
        <div style={{ padding: '12px 16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <form
            onSubmit={handleSend}
            className="relative mx-auto"
            style={{ maxWidth: '768px' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={loading ? "Waiting for response…" : "Ask Lenny anything…"}
              disabled={sendingLock}
              className="w-full text-sm transition-all duration-200"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: '14px',
                padding: '14px 52px 14px 18px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sendingLock}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-xl transition-all duration-200"
              style={{
                width: 36,
                height: 36,
                background: inputText.trim() && !sendingLock ? 'var(--accent)' : 'var(--bg-elevated)',
                color: inputText.trim() && !sendingLock ? '#fff' : 'var(--text-tertiary)',
                cursor: inputText.trim() && !sendingLock ? 'pointer' : 'not-allowed',
              }}
            >
              <Send size={16} />
            </button>
          </form>
          <p className="text-center text-xs mt-2.5" style={{ color: 'var(--text-tertiary)' }}>
            Grounded in Lenny&apos;s Podcast transcripts · RAG Q&amp;A · Essays · HTML artifacts (UI v2)
          </p>
        </div>
      </div>

      {/* ── Artifact Viewer Pane ── */}
      {activeArtifact && (
        <ArtifactViewer
          artifact={activeArtifact}
          onClose={() => setActiveArtifact(null)}
        />
      )}

      {/* ── Modals ── */}
      <WriteEssayModal
        isOpen={isEssayModalOpen}
        onClose={() => setIsEssayModalOpen(false)}
        onSubmit={handleWriteEssay}
      />
      <WriteHtmlModal
        isOpen={isHtmlModalOpen}
        onClose={() => setIsHtmlModalOpen(false)}
        onSubmit={handleGenerateHtml}
      />
    </main>
  );
}
