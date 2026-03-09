const HONO_D1_URL = process.env.NEXT_PUBLIC_HONO_D1_URL || 'https://hono-d1-backend.salalite.workers.dev';

export type Backend = 'hono-d1' | 'bun-sqlite';

export const BACKENDS: Record<Backend, { id: Backend; name: string; description: string; url: string }> = {
  'hono-d1': {
    id: 'hono-d1',
    name: 'Hono D1',
    description: 'Cloudflare Workers + D1 (Remote)',
    url: HONO_D1_URL,
  },
  'bun-sqlite': {
    id: 'bun-sqlite',
    name: 'Bun SQLite',
    description: 'Bun + SQLite (Local)',
    url: 'http://localhost:3001',
  },
};

const STORAGE_KEY = 'gtd-backend';

function getStoredBackend(): Backend {
  if (typeof window === 'undefined') return 'hono-d1';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (stored === 'hono-d1' || stored === 'bun-sqlite')) {
    return stored as Backend;
  }
  return 'hono-d1';
}

export function getCurrentBackend(): Backend {
  return getStoredBackend();
}

export function setCurrentBackend(backend: Backend): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, backend);
  }
}

export async function checkBackendHealth(backend: Backend): Promise<boolean> {
  try {
    const backendInfo = BACKENDS[backend];
    const response = await fetch(`${backendInfo.url}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const backend = getCurrentBackend();
  const backendInfo = BACKENDS[backend];
  const url = `${backendInfo.url}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  tasks: {
    list: () => request<ApiTask[]>('/tasks'),
    get: (id: string) => request<ApiTask>(`/tasks/${id}`),
    create: (data: { title: string; description?: string; status?: string; project_id?: string }) =>
      request<ApiTask>('/tasks', { method: 'POST', body: data }),
    update: (id: string, data: Partial<{ title: string; description: string; status: string; project_id: string }>) =>
      request<ApiTask>(`/tasks/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  },
  projects: {
    list: () => request<Project[]>('/projects'),
    get: (id: string) => request<Project>(`/projects/${id}`),
    create: (data: { name: string }) => request<Project>('/projects', { method: 'POST', body: data }),
    update: (id: string, data: Partial<{ name: string; status: string }>) =>
      request<Project>(`/projects/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  },
  health: () => request<{ status: string }>('/health'),
};

export interface ApiTask {
  id: string;
  title: string;
  description: string;
  status: 'inbox' | 'next' | 'waiting' | 'done';
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'someday' | 'archive';
  created_at: string;
  updated_at: string;
}
