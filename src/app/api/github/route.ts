import { NextResponse } from 'next/server';

export const revalidate = 300; // Cache for 5 minutes

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  pushed_at: string;
  private: boolean;
  topics: string[];
  language: string | null;
  stargazers_count: number;
}

export async function GET() {
  try {
    const res = await fetch(
      'https://api.github.com/users/e-salvador13/repos?sort=pushed&per_page=50',
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'HQ-Dashboard',
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }

    const repos: GitHubRepo[] = await res.json();

    // Transform to our format
    const projects = repos
      .filter((repo) => !repo.private) // Only public repos
      .map((repo) => ({
        id: repo.name,
        name: formatName(repo.name),
        description: repo.description || 'No description',
        repoUrl: repo.html_url,
        liveUrl: repo.homepage || null,
        pushedAt: repo.pushed_at,
        language: repo.language,
        topics: repo.topics,
        stars: repo.stargazers_count,
      }));

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('GitHub fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repos', projects: [] },
      { status: 500 }
    );
  }
}

// Convert kebab-case to Title Case
function formatName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
