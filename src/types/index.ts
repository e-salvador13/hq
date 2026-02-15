export interface Note {
  id: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'shipped' | 'idea';
  repoUrl?: string;
  liveUrl?: string;
  lastWorkedOn?: string;
  techStack?: string[];
  notes?: string;
}

export interface GitHubProject {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  liveUrl: string | null;
  pushedAt: string;
  language: string | null;
  topics: string[];
  stars: number;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  notes?: string;
  links?: string[];
  createdAt: number;
  updatedAt: number;
  researched?: boolean;
}

export interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr?: string;
    tz?: string;
  };
  payload?: {
    message?: string;
  };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
  };
}
