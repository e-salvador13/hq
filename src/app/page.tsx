'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuid } from 'uuid';
import { Note, GitHubProject, Idea, CronJob } from '@/types';

const NOTES_KEY = 'hq-notes';
const IDEAS_KEY = 'hq-ideas';

type Tab = 'projects' | 'ideas' | 'crons' | 'notes';

// Icons as components
const Icons = {
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M17 7l-10 10M7 7l10 10" strokeLinecap="round"/>
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  lightbulb: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M9 21h6M12 3a6 6 0 00-4 10.5V17h8v-3.5A6 6 0 0012 3z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 6v6l4 2" strokeLinecap="round"/>
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h4" strokeLinecap="round"/>
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10a7 7 0 0014 0M12 17v4M8 21h8" strokeLinecap="round"/>
    </svg>
  ),
  external: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <circle cx="11" cy="11" r="7"/>
      <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
    </svg>
  ),
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  
  // Projects
  const [projects, setProjects] = useState<GitHubProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  
  // Ideas
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideaInput, setIdeaInput] = useState('');
  
  // Crons
  const [crons, setCrons] = useState<CronJob[]>([]);
  const [cronsError, setCronsError] = useState(false);
  
  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  
  // Voice
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Load local storage
    const storedNotes = localStorage.getItem(NOTES_KEY);
    const storedIdeas = localStorage.getItem(IDEAS_KEY);
    if (storedNotes) setNotes(JSON.parse(storedNotes));
    if (storedIdeas) setIdeas(JSON.parse(storedIdeas));
    
    // Fetch GitHub projects
    fetch('/api/github')
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects || []);
        setProjectsLoading(false);
      })
      .catch(() => setProjectsLoading(false));
    
    // Fetch crons (will fail on Vercel, that's ok)
    fetch('/api/crons')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setCrons(data.jobs || []))
      .catch(() => {
        setCronsError(true);
        // Show sample crons when not connected
        setCrons([
          { id: '1', name: 'Morning Brief', enabled: true, schedule: { kind: 'cron', expr: '0 8 * * *', tz: 'America/New_York' }, state: { nextRunAtMs: Date.now() + 14 * 3600000 } },
          { id: '2', name: 'Arb Bot Report', enabled: true, schedule: { kind: 'cron', expr: '0 9 * * *', tz: 'America/New_York' }, state: { nextRunAtMs: Date.now() + 15 * 3600000 } },
          { id: '3', name: 'Afternoon Research', enabled: true, schedule: { kind: 'cron', expr: '0 14 * * *', tz: 'America/New_York' }, state: { nextRunAtMs: Date.now() + 20 * 3600000 } },
        ]);
      });

    // Init speech recognition
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
    }
  }, []);

  // Persist notes & ideas
  useEffect(() => {
    if (mounted) localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes, mounted]);
  
  useEffect(() => {
    if (mounted) localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
  }, [ideas, mounted]);

  // Voice input handler
  const startVoice = useCallback((target: 'note' | 'idea') => {
    if (!recognitionRef.current) return;
    
    setIsListening(true);
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (target === 'note') {
        setNoteInput(transcript);
      } else {
        setIdeaInput(transcript);
      }
      setIsListening(false);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.start();
  }, []);

  const addNote = useCallback(() => {
    if (!noteInput.trim()) return;
    const tags = autoTag(noteInput);
    setNotes(prev => [{
      id: uuid(),
      content: noteInput.trim(),
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }, ...prev]);
    setNoteInput('');
  }, [noteInput]);

  const addIdea = useCallback(() => {
    if (!ideaInput.trim()) return;
    setIdeas(prev => [{
      id: uuid(),
      title: ideaInput.trim(),
      description: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }, ...prev]);
    setIdeaInput('');
  }, [ideaInput]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const deleteIdea = useCallback((id: string) => {
    setIdeas(prev => prev.filter(i => i.id !== id));
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'projects', label: 'Projects', icon: Icons.folder, count: projects.length },
    { id: 'ideas', label: 'Ideas', icon: Icons.lightbulb, count: ideas.length },
    { id: 'crons', label: 'Crons', icon: Icons.clock, count: crons.filter(c => c.enabled).length },
    { id: 'notes', label: 'Notes', icon: Icons.note, count: notes.length },
  ];

  return (
    <main className="min-h-screen px-5 py-8 pb-28">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            HQ
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Your command center
          </p>
        </motion.header>

        {/* Tabs */}
        <nav className="flex justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${activeTab === tab.id 
                  ? 'glass-card tab-glow text-white' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5'
                }
              `}
            >
              <span className={activeTab === tab.id ? 'text-[var(--accent)]' : ''}>
                {tab.icon}
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs ${activeTab === tab.id ? 'text-[var(--text-secondary)]' : 'text-[var(--text-faint)]'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {projectsLoading ? (
                <LoadingState />
              ) : projects.length === 0 ? (
                <EmptyState icon={Icons.folder} text="No projects found" />
              ) : (
                <>
                  {/* Recent section */}
                  <div className="section-header">
                    <span>Recently Active</span>
                  </div>
                  <div className="space-y-3 mb-8">
                    {projects.slice(0, 5).map((project, i) => (
                      <ProjectCard key={project.id} project={project} index={i} featured />
                    ))}
                  </div>
                  
                  {/* All projects */}
                  {projects.length > 5 && (
                    <>
                      <div className="section-header">
                        <span>All Projects</span>
                      </div>
                      <div className="space-y-2">
                        {projects.slice(5).map((project, i) => (
                          <ProjectCard key={project.id} project={project} index={i + 5} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* IDEAS TAB */}
          {activeTab === 'ideas' && (
            <motion.div
              key="ideas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Input */}
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="What do you want to build?"
                  value={ideaInput}
                  onChange={(e) => setIdeaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addIdea()}
                  className="input-glass pr-24"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    onClick={() => startVoice('idea')}
                    className={`p-2.5 rounded-lg transition-all relative ${isListening ? 'text-[var(--accent)] voice-active' : 'text-[var(--text-muted)] hover:text-white hover:bg-white/10'}`}
                  >
                    {Icons.mic}
                  </button>
                  {ideaInput && (
                    <button
                      onClick={addIdea}
                      className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent)]/80"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>

              {/* Ideas list */}
              {ideas.length === 0 ? (
                <EmptyState icon={Icons.lightbulb} text="No ideas yet" subtext="Capture what you want to build" />
              ) : (
                <div className="space-y-3">
                  {ideas.map((idea, i) => (
                    <IdeaCard key={idea.id} idea={idea} index={i} onDelete={deleteIdea} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* CRONS TAB */}
          {activeTab === 'crons' && (
            <motion.div
              key="crons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {cronsError && (
                <div className="glass-card p-4 mb-4 text-center">
                  <p className="text-[var(--text-muted)] text-sm">
                    Connect locally to see live cron status
                  </p>
                </div>
              )}
              
              {crons.length === 0 ? (
                <EmptyState icon={Icons.clock} text="No cron jobs" />
              ) : (
                <div className="space-y-3">
                  {crons.map((cron, i) => (
                    <CronCard key={cron.id} cron={cron} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Input */}
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Quick capture..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  className="input-glass pr-16"
                />
                <button
                  onClick={() => startVoice('note')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all relative ${isListening ? 'text-[var(--accent)] voice-active' : 'text-[var(--text-muted)] hover:text-white hover:bg-white/10'}`}
                >
                  {Icons.mic}
                </button>
              </div>

              {/* Notes list */}
              {notes.length === 0 ? (
                <EmptyState icon={Icons.note} text="No notes" subtext="Capture thoughts, ideas, todos" />
              ) : (
                <div className="space-y-3">
                  {notes.map((note, i) => (
                    <NoteCard key={note.id} note={note} index={i} onDelete={deleteNote} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// COMPONENTS

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <motion.div 
        className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <span className="text-[var(--text-muted)] text-sm">Loading...</span>
    </div>
  );
}

function EmptyState({ icon, text, subtext }: { icon: React.ReactNode; text: string; subtext?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="text-[var(--text-faint)]">{icon}</div>
      <p className="text-[var(--text-muted)]">{text}</p>
      {subtext && <p className="text-[var(--text-faint)] text-sm">{subtext}</p>}
    </div>
  );
}

function ProjectCard({ project, index, featured }: { project: GitHubProject; index: number; featured?: boolean }) {
  const timeAgo = getTimeAgo(new Date(project.pushedAt));
  
  return (
    <motion.a
      href={project.liveUrl || project.repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`block gradient-card p-4 ${featured ? 'glass-card' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-[var(--text-primary)] truncate">
              {project.name}
            </h3>
            {project.liveUrl && (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--green-soft)] text-[var(--green)]">
                LIVE
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-muted)] line-clamp-2">
            {project.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs text-[var(--text-faint)]">{timeAgo}</span>
          {project.language && (
            <span className="text-xs text-[var(--text-faint)]">{project.language}</span>
          )}
        </div>
      </div>
    </motion.a>
  );
}

function IdeaCard({ idea, index, onDelete }: { idea: Idea; index: number; onDelete: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-4 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[var(--purple)]" />
            <h3 className="font-medium text-[var(--text-primary)]">
              {idea.title}
            </h3>
          </div>
          {idea.description && (
            <p className="text-sm text-[var(--text-muted)] ml-4">
              {idea.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg text-[var(--text-faint)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] opacity-0 group-hover:opacity-100 transition-all"
            title="Research"
          >
            {Icons.search}
          </button>
          <button
            onClick={() => onDelete(idea.id)}
            className="p-2 rounded-lg text-[var(--text-faint)] hover:text-[var(--red)] hover:bg-[var(--red-soft)] opacity-0 group-hover:opacity-100 transition-all"
          >
            {Icons.x}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CronCard({ cron, index }: { cron: CronJob; index: number }) {
  const nextRun = cron.state?.nextRunAtMs 
    ? formatNextRun(cron.state.nextRunAtMs)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-[var(--text-primary)]">
              {cron.name}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {cron.schedule?.expr && (
              <span className="text-[var(--text-faint)] font-mono text-xs">
                {cron.schedule.expr}
              </span>
            )}
            {nextRun && (
              <span className="text-[var(--text-muted)]">
                Next: {nextRun}
              </span>
            )}
          </div>
        </div>
        <div className={`status-dot ${cron.enabled ? 'active' : ''}`} style={{ background: cron.enabled ? 'var(--green)' : 'var(--text-faint)' }} />
      </div>
    </motion.div>
  );
}

function NoteCard({ note, index, onDelete }: { note: Note; index: number; onDelete: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-4 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[var(--text-primary)]">{note.content}</p>
          {note.tags.length > 0 && (
            <div className="flex gap-2 mt-2">
              {note.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-[var(--accent-soft)] text-[var(--accent)]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(note.id)}
          className="p-2 rounded-lg text-[var(--text-faint)] hover:text-[var(--red)] hover:bg-[var(--red-soft)] opacity-0 group-hover:opacity-100 transition-all"
        >
          {Icons.x}
        </button>
      </div>
    </motion.div>
  );
}

// UTILITIES

function autoTag(content: string): string[] {
  const tags: string[] = [];
  const lower = content.toLowerCase();
  
  if (/\b(idea|what if|could|should|maybe)\b/i.test(lower)) tags.push('idea');
  if (/\b(bug|fix|error|broken)\b/i.test(lower)) tags.push('bug');
  if (/\b(todo|need to|must|have to)\b/i.test(lower)) tags.push('todo');
  if (/\b(learn|study|research|read)\b/i.test(lower)) tags.push('learn');
  
  return tags;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatNextRun(ms: number): string {
  const date = new Date(ms);
  const now = new Date();
  const diffMs = ms - now.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  
  if (diffHrs < 24) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}
