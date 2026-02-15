'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuid } from 'uuid';
import { Note, GitHubProject, Idea, CronJob } from '@/types';

const NOTES_KEY = 'hq-notes';
const IDEAS_KEY = 'hq-ideas';

type Tab = 'projects' | 'ideas' | 'crons' | 'notes';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  
  const [projects, setProjects] = useState<GitHubProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideaInput, setIdeaInput] = useState('');
  
  const [crons, setCrons] = useState<CronJob[]>([]);
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    setMounted(true);
    
    // Load local data
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
    
    // Fetch crons
    fetch('/api/crons')
      .then(res => res.json())
      .then(data => setCrons(data.jobs || []))
      .catch(() => {});
  }, []);

  // Persist
  useEffect(() => {
    if (mounted) localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes, mounted]);
  
  useEffect(() => {
    if (mounted) localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
  }, [ideas, mounted]);

  const addNote = useCallback(() => {
    if (!noteInput.trim()) return;
    setNotes(prev => [{
      id: uuid(),
      content: noteInput.trim(),
      tags: [],
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
        <div className="w-5 h-5 border border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'projects', label: 'Projects', count: projects.length },
    { id: 'ideas', label: 'Ideas', count: ideas.length },
    { id: 'crons', label: 'Crons', count: crons.filter(c => c.enabled).length },
    { id: 'notes', label: 'Notes', count: notes.length },
  ];

  return (
    <main className="min-h-screen px-5 py-8 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-semibold tracking-tight mb-1">HQ</h1>
          <p className="text-[var(--text-muted)] text-sm">
            Command center
          </p>
        </motion.header>

        {/* Tabs */}
        <nav className="flex gap-6 mb-8 border-b border-[var(--border-subtle)] pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                text-sm font-medium transition-colors relative pb-3 -mb-3
                ${activeTab === tab.id 
                  ? 'text-[var(--text-primary)]' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 text-[var(--text-faint)]">{tab.count}</span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-px bg-[var(--text-primary)]"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {projectsLoading ? (
                <div className="py-12 text-center text-[var(--text-muted)]">
                  Loading...
                </div>
              ) : projects.length === 0 ? (
                <Empty text="No projects found" />
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 12).map((project) => (
                    <ProjectRow key={project.id} project={project} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'ideas' && (
            <motion.div
              key="ideas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Add an idea to research..."
                  value={ideaInput}
                  onChange={(e) => setIdeaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addIdea()}
                  className="w-full"
                />
              </div>
              {ideas.length === 0 ? (
                <Empty text="No ideas yet" />
              ) : (
                <div className="space-y-3">
                  {ideas.map((idea) => (
                    <IdeaRow key={idea.id} idea={idea} onDelete={deleteIdea} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'crons' && (
            <motion.div
              key="crons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {crons.length === 0 ? (
                <Empty text="No cron jobs" />
              ) : (
                <div className="space-y-3">
                  {crons.map((cron) => (
                    <CronRow key={cron.id} cron={cron} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Quick note..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  className="w-full"
                />
              </div>
              {notes.length === 0 ? (
                <Empty text="No notes" />
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <NoteRow key={note.id} note={note} onDelete={deleteNote} />
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

// Components

function Empty({ text }: { text: string }) {
  return (
    <div className="py-16 text-center text-[var(--text-muted)]">
      {text}
    </div>
  );
}

function ProjectRow({ project }: { project: GitHubProject }) {
  const timeAgo = getTimeAgo(new Date(project.pushedAt));
  
  return (
    <a
      href={project.liveUrl || project.repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="card card-interactive block p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[var(--text-primary)] mb-1">
            {project.name}
          </h3>
          <p className="text-sm text-[var(--text-muted)] line-clamp-2">
            {project.description}
          </p>
        </div>
        <span className="text-xs text-[var(--text-faint)] whitespace-nowrap">
          {timeAgo}
        </span>
      </div>
      {project.language && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-[var(--text-faint)]">
            {project.language}
          </span>
          {project.liveUrl && (
            <span className="text-xs text-[var(--accent)]">Live</span>
          )}
        </div>
      )}
    </a>
  );
}

function IdeaRow({ idea, onDelete }: { idea: Idea; onDelete: (id: string) => void }) {
  return (
    <div className="card p-4 group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[var(--text-primary)]">
            {idea.title}
          </h3>
          {idea.description && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {idea.description}
            </p>
          )}
        </div>
        <button
          onClick={() => onDelete(idea.id)}
          className="text-[var(--text-faint)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function CronRow({ cron }: { cron: CronJob }) {
  const nextRun = cron.state?.nextRunAtMs 
    ? new Date(cron.state.nextRunAtMs).toLocaleString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[var(--text-primary)]">
            {cron.name}
          </h3>
          {nextRun && (
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Next: {nextRun}
            </p>
          )}
        </div>
        <div className={`w-2 h-2 rounded-full ${cron.enabled ? 'bg-[var(--success)]' : 'bg-[var(--text-faint)]'}`} />
      </div>
    </div>
  );
}

function NoteRow({ note, onDelete }: { note: Note; onDelete: (id: string) => void }) {
  return (
    <div className="card p-4 group">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[var(--text-primary)] flex-1">
          {note.content}
        </p>
        <button
          onClick={() => onDelete(note.id)}
          className="text-[var(--text-faint)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}
